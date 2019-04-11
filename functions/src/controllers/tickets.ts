import * as functions from 'firebase-functions'
import TicketsModel from './../models/ticketsModel'
import UsersModel from '../models/usersModel'
import TenantsModel from './../models/tenantsModel'
import PropertiesModel from '../models/propertiesModel'
import NotesModel from '../models/notesModel'
import LeaseModel from '../models/leaseModel'
const admin = require('firebase-admin')
const bodyParser = require('body-parser')
const uuidv4 = require('uuid/v4')
const db = admin.firestore()
const ticketsCollectionRef = db.collection('tickets')

// CREATE TICKET
exports.create = (req, res) => {
  const incomingData: TicketsModel = req.body
  const uid: string = uuidv4().replace(/-/g,'')

  ticketsCollectionRef.doc(uid)
    .set({
      'id': uid,
      'issue': incomingData.issue,
      'userIds': incomingData.userIds,
      'tenantId': incomingData.tenantId,
      'propertyId': incomingData.propertyId,
      'notesIds': incomingData.notesIds,
      'urgency': incomingData.urgency,
      'status': {
        'isOpen': true,
        'recieved': false,
        'inProgress': false,
        'closedByStaff': false,
        'closedByPropertyManager': false,
        'closedByOther': false
      }
    })
    .then(_ => {

      ticketsCollectionRef.doc(uid)
        .get()
        .then(ceatedTicket => {
          res.status(201).send(ceatedTicket.data())
        })
        .catch(err => {
          res.status(400).send(err.stack)
        })

    })
    .catch(err => {
      res.status(400).send(err.stack)
    })
}

// READ TICKETS
exports.read = (_req, res) => {
  if (!'tickets') {
    res.status(404).send(res.message = `Collection ${ticketsCollectionRef} does not exist; status code: 404`)
  }

  ticketsCollectionRef
    .get()
    .then(async incomingTicketObjects => {

      const ticketsList: Array<any> = []

      await incomingTicketObjects.forEach(ticketObject => {
        const ticket: TicketsModel = ticketObject.data()
        ticket.users = []
        ticket.tenant
        ticket.property
        ticket.notes = []
        ticketsList.push(ticket)
      })

      return ticketsList
    })
    .then((ticketsList: Array<TicketsModel>) => {
      async function getUserInfo() {

        for(const ticket of ticketsList) {

          const tempUsersArray: Array<UsersModel> = []

          ticket.userIds.forEach(id => {
            tempUsersArray.push(

              db.collection('users').doc(id)
                .get()
                .then(incomingUserObject => {
                  const userPayload = incomingUserObject.data()
                  const formattedUser = userPayload.firstName + ' ' + userPayload.lastName
                  return formattedUser
                })
                .catch(err => {
                  res.status(400).send(err.stack)
                }))

          })

          await Promise.all(tempUsersArray)
            .then(resolvedUsersArray => {
              ticket.users = resolvedUsersArray

              return ticket
            })
            .catch(err => {
              res.status(400).send(err.stack)
            })

        }

        return ticketsList
      }

      return getUserInfo()
    })
    .then((ticketsList: Array<TicketsModel>) =>{
      async function getTenantInfo() {

        for (const ticket of ticketsList) {

          const tempTenantsArray: Array<TenantsModel> = []

          tempTenantsArray.push(

            db.collection('tenants').doc(ticket.tenantId)
              .get()
              .then(incomingTenantObject => {
                const tenantPayload = incomingTenantObject.data()
                const formattedTenant = tenantPayload.firstName + ' ' + tenantPayload.lastName
                return ticket.tenant = formattedTenant
              })
              .catch(err => {
                res.status(400).send(err.stack)
              }))

          await Promise.all(tempTenantsArray)
            .then(resolvedTenantsArray => {
              ticket.tenant = resolvedTenantsArray.pop()

              return ticket
            })
            .catch(err => {
              res.status(400).send(err.stack)
            })
        }

        return ticketsList
      }

      return getTenantInfo()
    })
    .then((ticketsList: Array<TicketsModel>) =>{
      async function getPropertyInfo() {

        for (const ticket of ticketsList) {

          const tempProperyArray: Array<PropertiesModel> = []

          tempProperyArray.push(

            db.collection('properties').doc(ticket.propertyId)
              .get()
              .then(incomingPropertyObject => {
                const propertyPayload =  incomingPropertyObject.data()
                const formattedProperty = propertyPayload.name
                return ticket.property = formattedProperty
              })
              .catch(err => {
                res.status(400).send(err.stack)
              }))

          await Promise.all(tempProperyArray)
            .then(resolvedPropertyArray => {
              ticket.property = resolvedPropertyArray.pop()

              return ticket
            })
            .catch(err => {
              res.status(400).send(err.stack)
            })
        }

        return ticketsList
      }

      return getPropertyInfo()
    })
    .then((ticketsList: Array<TicketsModel>) => {
      async function getNotesInfo() {

        for(const ticket of ticketsList) {

          const tempNotesArray: Array<NotesModel> = []

          ticket.notesIds.forEach(id => {
            tempNotesArray.push(

              db.collection('notes').doc(id)
                .get()
                .then(incomingNoteObject => {
                  return incomingNoteObject.data()
                })
                .catch(err => {
                  res.status(400).send(err.stack)
                }))

          })

          await Promise.all(tempNotesArray)
            .then(resolvedNotesArray => {
              ticket.notes = resolvedNotesArray

              return ticket
            })
            .catch(err => {
              res.status(400).send(err.stack)
            })
        }

        return ticketsList
      }

      return getNotesInfo()
    })
    .then((ticketsList: Array<TicketsModel>) => {

      interface NewTicketModel {
        id: string,
        issue: string,
        users: Array<any>,
        tenant: any,
        property: any,
        notes: Array<NotesModel>,
        urgency: string,
        status: {
          recieved: boolean,
          isOpen: boolean,
          inProgress: boolean,
          closedByPropertyManager: boolean,
          closedByStaff: boolean,
          closedByOther: boolean
        }
      }

      async function cleanUp() {
        const newTicketsArray: Array<NewTicketModel> = []

        for (const ticket of ticketsList) {

          const newTicket: NewTicketModel = {
            id: ticket.id,
            issue: ticket.issue,
            users: ticket.users,
            tenant: ticket.tenant,
            property: ticket.property,
            notes: ticket.notes,
            urgency: ticket.urgency,
            status: {
              recieved: ticket.status.recieved,
              isOpen: ticket.status.isOpen,
              inProgress: ticket.status.inProgress,
              closedByPropertyManager: ticket.status.closedByPropertyManager,
              closedByStaff: ticket.status.closedByStaff,
              closedByOther: ticket.status.closedByOther
            }
          }

          newTicketsArray.push(newTicket)
        }

        const ticketsArray = await Promise.all(newTicketsArray)
          .then(resolvedTicketsArray => {
            return resolvedTicketsArray
          })
          .catch(err => {
            res.status(400).send(err.stack)
          })

        return ticketsArray
      }

      return cleanUp()
    })
    .then((finalTicketInfoPlayload: Array<TicketsModel>) => {
      res.status(200).send(finalTicketInfoPlayload)
    })
    .catch(err => {
      res.status(400).send(err.stack)
    })
}

// READ INDIVIDUAL TICKETS
exports.readIndividualTicket = (req, res) => {
  const uid: string = req.params.uid
  if (!uid) throw new Error('Id is blank')

  ticketsCollectionRef.doc(uid)
    .get()
    .then(ticket => {
      return ticket.data()
    })
    .then((ticketInfo: TicketsModel) => {
      async function getUserInfo() {

        const tempUsersArray: Array<UsersModel> = []

        ticketInfo.userIds.forEach(id => {
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
            ticketInfo.users = resolvedUsersArray
          })
          .catch(err => {
            res.status(400).send(err.stack)
          })

        return ticketInfo
      }

      return getUserInfo()
    })
    .then((ticketInfo: TicketsModel) => {
      async function getTenantInfo() {

        const tempTenantsArray: Array<TenantsModel> = []

        tempTenantsArray.push(

          db.collection('tenants').doc(ticketInfo.tenantId)
            .get()
            .then(incomingTenantObject => {
              return incomingTenantObject.data()
            })
            .catch(err => {
              res.status(400).send(err.stack)
            }))

        await Promise.all(tempTenantsArray)
          .then(resolvedTenantArray => {
            ticketInfo.tenant = resolvedTenantArray.pop()
          })
          .catch(err => {
            res.status(400).send(err.stack)
          })

        return ticketInfo
      }

      return getTenantInfo()
    })
    .then((ticketInfo: TicketsModel) => {
      async function getPropertyInfo() {

        const tempPropertyArray: Array<PropertiesModel> = []

        tempPropertyArray.push(

          db.collection('properties').doc(ticketInfo.propertyId)
            .get()
            .then(incomingPropertyObject => {
              return incomingPropertyObject.data()
            })
            .catch(err => {
              res.status(400).send(err.stack)
            }))

        await Promise.all(tempPropertyArray)
          .then(resolvedPropertyArray => {
            ticketInfo.property = resolvedPropertyArray.pop()
          })
          .catch(err => {
            res.status(400).send(err.stack)
          })

        return ticketInfo
      }

      return getPropertyInfo()
    })
    .then((ticketInfo: TicketsModel) => {
      async function getNotesInfo() {

        const tempNotesArray: Array<NotesModel> = []

        ticketInfo.notesIds.forEach(id => {
          tempNotesArray.push(

            db.collection('notes').doc(id)
              .get()
              .then(incomingNoteObject => {
                return incomingNoteObject.data()
              })
              .catch(err => {
                res.status(400).send(err.stack)
              }))

        })

        await Promise.all(tempNotesArray)
          .then(resolvedNotesArray => {
            ticketInfo.notes = resolvedNotesArray
          })
          .catch(err => {
            res.status(400).send(err.stack)
          })

        return ticketInfo
      }

      return getNotesInfo()
    })
    .then((ticketInfo: TicketsModel) => {
      const NewTicketModel = {
        id: ticketInfo.id,
        issue: ticketInfo.issue,
        users: ticketInfo.users,
        tenant: ticketInfo.tenant,
        property: ticketInfo.property,
        notes: ticketInfo.notes,
        urgency: ticketInfo.urgency,
        status: ticketInfo.status
      }

      return NewTicketModel
    })
    .then(finalTicketInfoPlayload => {
      res.status(200).send(finalTicketInfoPlayload)
    })
    .catch(err => {
      res.status(400).send(err.stack)
    })
}

// UPDATE INDIVIDUAL TICKET
exports.update = (req, res) => {
  const uid: string = req.params.uid
  const ticketData: TicketsModel = req.body

  if (!uid) throw new Error('Id is blank')

  const newTicketModel: TicketsModel = {
    id: uid,
    issue: ticketData.issue,
    tenantId: ticketData.tenantId,
    propertyId: ticketData.propertyId,
    userIds: ticketData.userIds,
    notesIds: ticketData.notesIds,
    urgency: ticketData.urgency,
    status: ticketData.status
  }

  const serverValidation = ticketsCollectionRef.doc(uid)
      .get()
      .then(databaseObject => {
        const dbObject: TicketsModel = databaseObject.data()
        const validationObject: TicketsModel = {
          id: uid,
          issue: dbObject.issue,
          userIds: dbObject.userIds,
          tenantId: dbObject.tenantId,
          propertyId: dbObject.propertyId,
          notesIds: dbObject.notesIds,
          urgency: dbObject.urgency,
          status: dbObject.status
        }

        return validationObject
      })
      .catch(err => {
        res.status(400).send(err.stack)
      })

  Promise.resolve(serverValidation)
    .then(validationObject => {
      newTicketModel.issue !== validationObject.issue &&
      newTicketModel.issue !== '' ?
        validationObject.issue = newTicketModel.issue :
        validationObject.issue

      return validationObject
    })
    .then(validationObject => {
      newTicketModel.urgency !== validationObject.urgency &&
      newTicketModel.urgency !== '' ?
        validationObject.urgency = newTicketModel.urgency :
        validationObject.urgency

      return validationObject
    })
    .then(validationObject => {
      newTicketModel.status.isOpen !== validationObject.status.isOpen ?
        validationObject.status.isOpen = newTicketModel.status.isOpen :
        validationObject.status.isOpen

      return validationObject
    })
    .then(validationObject => {
      newTicketModel.status.recieved !== validationObject.status.recieved ?
        validationObject.status.recieved = newTicketModel.status.recieved :
        validationObject.status.recieved

      return validationObject
    })
    .then(validationObject => {
      newTicketModel.status.inProgress !== validationObject.status.inProgress ?
        validationObject.status.inProgress = newTicketModel.status.inProgress :
        validationObject.status.inProgress

      return validationObject
    })
    .then(validationObject => {
      newTicketModel.status.closedByStaff !== validationObject.status.closedByStaff ?
        validationObject.status.closedByStaff = newTicketModel.status.closedByStaff :
         validationObject.status.closedByStaff

      return validationObject
    })
    .then(validationObject => {
      newTicketModel.status.closedByPropertyManager !== validationObject.status.closedByPropertyManager ?
        validationObject.status.closedByPropertyManager = newTicketModel.status.closedByPropertyManager :
        validationObject.status.closedByPropertyManager

      return validationObject
    })
    .then(validationObject => {
      newTicketModel.status.closedByOther !== validationObject.status.closedByOther ?
        validationObject.status.closedByOther = newTicketModel.status.closedByOther :
         validationObject.status.closedByOther

      return validationObject
    })
    .then(validationObject => {
      async function validateUserIds() {
        const validatedUserIdsArray = newTicketModel.userIds.map(id => {
          return db.collection('users').doc(id)
            .get()
            .then(results => {
              if(results.exists) {
                return results.id
              }
            })
            .catch(err => {
              res.status(400).send(err.stack)
            })
        })

        await Promise.all(validatedUserIdsArray)
          .then(async results => {
            validationObject.userIds = await results.filter(validated => validated !== undefined)

            return Promise.all(results)
          })

        return validationObject
      }

      return validateUserIds()
    })
    .then(validationObject => {
      async function validateNotesIds() {
        const validatedNotesIdsArray = newTicketModel.notesIds.map(id => {
          return db.collection('notes').doc(id)
            .get()
            .then(results => {
              if(results.exists) {
                return results.id
              }
            })
            .catch(err => {
              res.status(400).send(err.stack)
            })
        })

        await Promise.all(validatedNotesIdsArray)
          .then(async results => {
            validationObject.notesIds = await results.filter(validated => validated !== undefined)

            return Promise.all(results)
          })

        return validationObject
      }

      return validateNotesIds()
    })
    .then(finalTicketInfoPlayload => {
      ticketsCollectionRef.doc(uid)
        .update(finalTicketInfoPlayload)
    })
    .then(_ => {
      ticketsCollectionRef.doc(uid)
        .get()
        .then(updatedTicket => {
          res.status(200).send(updatedTicket.data())
        })
        .catch(err => {
          res.status(400).send(err.stack)
        })
    })
    .catch(err => {
      res.status(400).send(err.stack)
    })
}

// ARCHIVE INDIVIDUAL TICKET
exports.archive = (req, res) => {
  const uid: string = req.params.uid
  if (!uid) throw new Error('Id is blank')

  ticketsCollectionRef.doc(uid)
    .get()
    .then(databaseObject => {
      const archiveTicket: TicketsModel = databaseObject.data()

      db.collection('archivedTickets').doc(uid)
        .set({archiveTicket})

      ticketsCollectionRef.doc(uid)
        .delete()

      res.status(200).send(`ticket for ${archiveTicket.tenantId} has been archived`)
    })
    .catch(err => {
      res.status(400).send(res.message = `ID does not exist: ${uid}; status code: 400 \n` + err.stack)
    })

}

// DELETE INDIVIDUAL TICKET
exports.delete = (req, res) => {
  const uid: string = req.params.uid
  if (!uid) throw new Error('Id is blank')

  ticketsCollectionRef.doc(uid)
    .get()
    .then(deleteTicketData => {
      const deleteTicket: TicketsModel = deleteTicketData.data()

      ticketsCollectionRef.doc(uid)
        .delete()

      res.status(200).send(`ticket for ${deleteTicket.tenantId} has been deleted`)
    })
    .catch(err => {
      res.status(400).send(err.stack)
    })

}
