import * as functions from 'firebase-functions'
import TenantsModel from './../models/tenantsModel'
import TicketsModel from '../models/ticketsModel'
import UsersModel from '../models/usersModel'
import PropertiesModel from '../models/propertiesModel'
import NotesModel from '../models/notesModel'
import LeaseModel from '../models/leaseModel'
const admin = require('firebase-admin')
const bodyParser = require('body-parser')
const uuidv4 = require('uuid/v4')
const db = admin.firestore()
const tenantsCollectionRef = db.collection('tenants')

// CREATE TENANT
exports.create = (req, res) => {
  const incomingData: TenantsModel = req.body
  const uid: string = uuidv4().replace(/-/g,'')
  const dateCreatedTimeStamp: string = new Date().toString()

  tenantsCollectionRef.doc(uid)
    .set({
      'id': uid,
      'firstName': incomingData.firstName,
      'lastName': incomingData.lastName,
      'staffIds': incomingData.staffIds,
      'ticketsIds': incomingData.ticketsIds,
      'propertyId': incomingData.propertyId,
      'leaseId': incomingData.leaseId,
      'dateCreated': dateCreatedTimeStamp,
      'dateUpdated': dateCreatedTimeStamp
    })
    .then(_ => {

      tenantsCollectionRef.doc(uid)
        .get()
        .then(createdTenant => {
          res.status(201).send(createdTenant.data())
        })
        .catch(err => {
          res.status(400).send(err.stack)
        })

    })
    .catch(err => {
      res.status(400).send(err.stack)
    })

}

// READ TENANTS
exports.read = (_req, res) => {
  if (!'tenants') {
    res.status(404).send(res.message = `Collection ${tenantsCollectionRef} does not exist; status code: 404`)
  }

//////////////// gets tenant objects and pushes into tenantList array
  tenantsCollectionRef
    .get()
    .then(async incomingTenantObjects => {

      const tenantList: Array<TenantsModel> = []

      await incomingTenantObjects.forEach(tenantObject => {
        const tenant: TenantsModel = tenantObject.data()
        tenant.property
        tenant.staffList = []
        tenantList.push(tenant)
      })

      return tenantList
    })
//////////////// takes individual tenants and appends property information
    .then((tenantList: Array<TenantsModel>) => {
      async function getPropertyInfo() {

        for (const tenant of tenantList) {

          const tempPropertyArray: Array<PropertiesModel | string> = []

          tenant.propertyId === '' ?
            tempPropertyArray.push('This user has no property') :
            tempPropertyArray.push(

              db.collection('properties').doc(tenant.propertyId)
                .get()
                .then(incomingPropertyObject => {
                  return tenant.property = incomingPropertyObject.data()
                })
                .catch(err => {
                  res.status(400).send(err.stack)
                }))

          await Promise.all(tempPropertyArray)
            .then(resolvedPropertyArray => {
              tenant.property = resolvedPropertyArray.pop()

              return tenant
            })
            .catch(err => {
              res.status(400).send(err.stack)
            })
        }

        return tenantList
      }

      return getPropertyInfo()
    })
//////////////// takes individual tenants and appends staff information
    .then((tenantList: Array<TenantsModel>) => {
      async function getuserInfo() {

        for (const tenant of tenantList) {

          const tempUsersArray: Array<UsersModel> = []

          tenant.staffIds.forEach(id => {
            tenant.staffIds === [] ?
              tempUsersArray :
              tempUsersArray.push(

                db.collection('users').doc(id)
                  .get()
                  .then(incomingUserObject => {
                    return incomingUserObject.data()
                  })
                  .catch(err => {
                    res.status(400).send(err.stack)
                  }))

          })

          await Promise.all(tempUsersArray)
            .then(resolvedUsersArray => {
              tenant.staffList = resolvedUsersArray
            })
            .catch(err => {
              res.status(400).send(err.stack)
            })

        }

        return tenantList
      }

      return getuserInfo()
    })
//////////////// Clean up before sending to client
    .then((tenantList: Array<TenantsModel>) => {

      interface NewTenantModel {
        id: string,
        lastname: string,
        firstName: string,
        staffList: Array<UsersModel> | [],
        property: PropertiesModel | string,
        dateCreated: string,
        dateUpdated: string
      }

      async function cleanUp() {
        const newTenantsArray: Array<NewTenantModel> = []

        for (const tenant of tenantList) {

          const newTenant: NewTenantModel = {
            id: tenant.id,
            lastname: tenant.lastName,
            firstName: tenant.firstName,
            staffList: tenant.staffList,
            property: tenant.property,
            dateCreated: tenant.dateCreated,
            dateUpdated: tenant.dateUpdated
          }

          newTenantsArray.push(newTenant)
        }

        const tenantsArray = await Promise.all(newTenantsArray)
            .then(resolvedTenantsArray => {
              return resolvedTenantsArray
            })
            .catch(err => {
              res.status(400).send(err.stack)
            })

        return tenantsArray
      }

      return cleanUp()
    })
    .then((finalTenantInfoPayload: Array<TenantsModel>) => {
      res.status(200).send(finalTenantInfoPayload)
    })
    .catch(err => {
      res.status(400).send(err.stack)
    })
}

// READ INDIVIDUAL TENANT
exports.readIndividualTenant = (req, res) => {
  const uid: string = req.params.uid
  if (!uid) throw new Error('Id is blank')

  tenantsCollectionRef.doc(uid)
    .get()
    .then(tenant => {
      return tenant.data()
    })
//////////////// gets tickets objects and pushes into ticketsList array
    .then((tenantInfo: TenantsModel) => {
      async function getTicketInfo() {

        const tempTicketArray: Array<TicketsModel> = []

        tenantInfo.ticketsIds.forEach(id => {
          tempTicketArray.push(

            db.collection('tickets').doc(id)
              .get()
              .then(incomingTicketObject => {
                return incomingTicketObject.data()
              })
              .catch(err => {
                res.status(400).send(err.stack)
              }))

          })

        await Promise.all(tempTicketArray)
          .then(resolevdTicketsArray => {
            tenantInfo.ticketsList = resolevdTicketsArray
          })
          .catch(err => {
            res.status(400).send(err.stack)
          })


        return tenantInfo
      }

      return getTicketInfo()
    })
//////////////// adds empty users array to each ticket object
    .then((tenantInfo: TenantsModel) => {
      for (const ticket of tenantInfo.ticketsList) {

        ticket.users = []
        ticket.notes = []
      }

      return tenantInfo
    })
//////////////// looks up users from userIds and pushes to users array for each ticket object
    .then((tenantInfo: TenantsModel) => {
       async function getUserInfo() {

        for (const ticket of tenantInfo.ticketsList) {

          const tempUsersArray: Array<UsersModel> = []

          ticket.userIds.forEach(id => {
            tempUsersArray.push(

              db.collection('users').doc(id)
                .get()
                .then(incomingUserObject => {
                  return incomingUserObject.data()
                })
                .catch(err => {
                  res.status(400).send(err.stack)
                }))

          })

          await Promise.all(tempUsersArray)
            .then(resolvedUsersArray => {
              ticket.users = resolvedUsersArray
            })
            .catch(err => {
              res.status(400).send(err.stack)
            })
        }

        return tenantInfo
      }

      return getUserInfo()
    })
//////////////// looks up notes from noteIds and pushes to users for each ticket object
    .then((tenantInfo: TenantsModel) => {
      async function getNoteInfo() {

        for (const ticket of tenantInfo.ticketsList) {

          const tempNotesArray: Array<NotesModel> = []

          ticket.notesIds.forEach(id => {
            tempNotesArray.push(

              db.collection('notes').doc(id)
                .get()
                .then(incomingNotesObject => {
                  return incomingNotesObject.data()
                })
                .catch(err => {
                  res.status(400).send(err.stack)
                }))

          })

          await Promise.all(tempNotesArray)
            .then(resolvedNotesArray => {
              ticket.notes = resolvedNotesArray
            })
            .catch(err => {
              res.status(400).send(err.stack)
            })
        }

       return tenantInfo
      }

     return getNoteInfo()
    })
//////////////// looks up staff from staffIds and pushes to staffList for tenant
    .then((tenantInfo: TenantsModel) => {
      async function getStaffInfo() {

        const tempStaffArray: Array<UsersModel> = []

        tenantInfo.staffIds.forEach(id => {
          tempStaffArray.push(

            db.collection('users').doc(id)
              .get()
              .then(incomingUserObject => {
                return incomingUserObject.data()
              })
              .catch(err => {
                res.status(400).send(err.stack)
              }))

        })

        await Promise.all(tempStaffArray)
          .then(resolvedStaffArray => {
            tenantInfo.staffList = resolvedStaffArray
          })
          .catch(err => {
            res.status(400).send(err.stack)
          })

        return tenantInfo
      }

      return getStaffInfo()
    })
//////////////// looks up lease from leaseIds and pushes to lease for tenant
    .then((tenantInfo: TenantsModel) => {
      async function getLeaseInfo() {

        const tempLeaseArray: Array<LeaseModel> = []

        tempLeaseArray.push(

          db.collection('leases').doc(tenantInfo.leaseId)
            .get()
            .then(incomingLeaseObject => {
              return incomingLeaseObject.data()
            })
            .catch(err => {
              res.status(400).send(err.stack)
            }))

        await Promise.all(tempLeaseArray)
          .then(resolvedLeaseArray => {
            tenantInfo.lease = resolvedLeaseArray.pop()
          })

        return tenantInfo
      }

      return getLeaseInfo()
    })
//////////////// looks up property from propertyId and pushes to property for tenant
    .then((tenantInfo: TenantsModel) => {
      async function getPropertyInfo() {

        const tempPropertyArray: Array<PropertiesModel> = []

        tempPropertyArray.push(

          db.collection('properties').doc(tenantInfo.propertyId)
            .get()
            .then(incomingPropertyObject => {
              return incomingPropertyObject.data()
            })
            .catch(err => {
              res.status(400).send(err.stack)
            }))

        await Promise.all(tempPropertyArray)
          .then(resolvedPropertyArray => {
            tenantInfo.property = resolvedPropertyArray.pop()
          })

        return tenantInfo
      }

      return getPropertyInfo()
    })
//////////////// Clean up before sending to client
    .then((tenantInfo: TenantsModel) => {
      const newTenantModel = {
        id: tenantInfo.id,
        lastName: tenantInfo.lastName,
        firstName: tenantInfo.firstName,
        ticketsList: tenantInfo.ticketsList,
        staffList: tenantInfo.staffList,
        lease: tenantInfo.lease,
        property: tenantInfo.property,
        dateCreated: tenantInfo.dateCreated,
        dateUpdated: tenantInfo.dateUpdated
      }

      return newTenantModel
    })
//////////////// Final
    .then(finalTenantInfoPayload => {
      res.status(200).send(finalTenantInfoPayload)
    })
    .catch(err => {
      res.status(400).send(err.stack)
    })
}

// UPDATE INDIVIDUAL TENANT
exports.update = (req, res) => {
  const uid: string = req.params.uid
  const tenantData: TenantsModel = req.body

  if (!uid) throw new Error('Id is blank')

  //entered tenant data from front end
  const newTenantModel: TenantsModel = {
    id: uid,
    lastName: tenantData.lastName,
    firstName: tenantData.firstName,
    staffIds: tenantData.staffIds,
    ticketsIds: tenantData.ticketsIds,
    propertyId: tenantData.propertyId,
    leaseId: tenantData.leaseId
  }

  const serverValidation = tenantsCollectionRef.doc(uid)
    .get()
    .then(databaseObject => {
      const dbObject = databaseObject.data()
      const validationObject: TenantsModel = {
        id: uid,
        lastName: dbObject.lastName,
        firstName: dbObject.firstName,
        staffIds: dbObject.staffIds,
        ticketsIds: dbObject.ticketsIds,
        propertyId: dbObject.propertyId,
        leaseId: dbObject.leaseId,
        dateCreated: dbObject.dateCreated,
        dateUpdated: dbObject.dateUpdated
      }

      return validationObject
    })
    .catch(err => {
      res.status(400).send(err.stack)
    })

  Promise.resolve(serverValidation)
    .then(validationObject => {
      newTenantModel.lastName !== validationObject.lastName &&
      newTenantModel.lastName !== '' ?
        validationObject.lastName = newTenantModel.lastName :
        validationObject.lastName

      return validationObject
    })
    .then(validationObject => {
      newTenantModel.firstName !== validationObject.firstName &&
      newTenantModel.firstName !== '' ?
        validationObject.firstName = newTenantModel.firstName :
        validationObject.firstName

      return validationObject
    })
    .then(validationObject => {
      newTenantModel.propertyId !== validationObject.propertyId &&
      newTenantModel.propertyId !== '' ?
        validationObject.propertyId = newTenantModel.propertyId :
        validationObject.propertyId

      return validationObject
    })
    .then(validationObject => {
      newTenantModel.leaseId !== validationObject.leaseId &&
      newTenantModel.leaseId !== '' ?
        validationObject.leaseId = newTenantModel.leaseId :
        validationObject.leaseId

      return validationObject
    })
    .then(validationObject => {
      async function validateStaffIds() {
        const validatedStaffIdsArray = newTenantModel.staffIds.map(id => {
          return db.collection('users').doc(id)
            .get()
            .then(results => {
              if (results.exists) {
                return results.id
              }
            })
            .catch(err => {
              res.status(400).send(err.stack)
            })
        })

        await Promise.all(validatedStaffIdsArray)
          .then(async results => {
            validationObject.staffIds = await results.filter(validated => validated !== undefined)

            return Promise.all(results)
          })

        return validationObject
      }

      return validateStaffIds()
    })
    .then(validationObject => {
      async function validateTicketsIds() {
        const validatedTicketsIdsArray = newTenantModel.ticketsIds.map(id => {
          return db.collection('tickets')
            .doc(id)
            .get()
            .then(results => {
              if (results.exists) {
                return results.id
              }
            })
            .catch(err => {
              res.status(400).send(err.stack)
            })
        })

        await Promise.all(validatedTicketsIdsArray)
          .then(async results => {
            validationObject.ticketsIds = await results.filter(validated => validated !== undefined)

            return Promise.all(results)
          })

        return validationObject
      }

      return validateTicketsIds()
    })
    .then(finalTenantInfoPayload => {
      tenantsCollectionRef.doc(uid)
        .update(finalTenantInfoPayload)
    })
    .then(_ => {
      tenantsCollectionRef.doc(uid)
        .get()
        .then(updatedTenant => {
          res.status(200).send(updatedTenant.data())
        })
        .catch(err => {
          res.status(400).send(err.stack)
        })
    })
    .catch((err) => {
      res.status(400).send(err.stack)
    })
}

// ARCHIVE INDIVIDUAL TENANT
exports.archive = (req, res) => {
  const uid: string = req.params.uid
  if (!uid) throw new Error('Id is blank')

  tenantsCollectionRef.doc(uid)
    .get()
    .then(databaseObject => {
      const archiveTenant: TenantsModel = databaseObject.data()

      db.collection('archivedTenants').doc(uid)
        .set({archiveTenant})

      tenantsCollectionRef.doc(uid)
        .delete()

      res.status(200).send(`tenant ${archiveTenant.firstName} ${archiveTenant.lastName} has been archived`)
    })
    .catch(err => {
      res.status(400).send(res.message = `ID does not exist: ${uid}; status code: 400 \n` + err.stack)
    })
}

// DELETE INDIVIDUAL TENANT
exports.delete = (req, res) => {
  const uid: string = req.params.uid
  if (!uid) throw new Error('Id is blank')

  tenantsCollectionRef.doc(uid)
    .get()
    .then(deleteTenantData => {
      const deleteTenant: TenantsModel = deleteTenantData.data()

      tenantsCollectionRef.doc(uid)
        .delete()

      res.status(200).send(`tenant ${deleteTenant.firstName} ${deleteTenant.lastName} has been deleted`)
    })
    .catch(err => {
      res.status(400).send(err.stack)
    })
}
