import * as functions from 'firebase-functions'
import UsersModel from './../models/usersModel'
import LeaseModel from './../models/leaseModel'
import PropertiesModel from './../models/propertiesModel'
import TenantsModel from './../models/tenantsModel'
const admin = require('firebase-admin')
const bodyParser = require('body-parser')
const uuidv4 = require('uuid/v4')
const db = admin.firestore()
const usersCollectionRef = db.collection('users')

// CREATE USER
exports.create = (req, res) => {
  const incomingData: UsersModel = req.body
  const uid: string = uuidv4().replace(/-/g,'')

  usersCollectionRef.doc(uid)
    .set({
      'id': uid,
      'lastName': incomingData.lastName,
      'firstName': incomingData.firstName,
      'email': incomingData.email,
      'title': incomingData.title,
      'leaseIds': incomingData.leaseIds,
      'phone': incomingData.phone,
      'ext': incomingData.ext,
      'role': incomingData.role
    })
    .then(_ => {

      usersCollectionRef.doc(uid)
      .get()
      .then(createdUser => {
        res.status(201).send(createdUser.data())
      })
      .catch(err => {
        res.status(400).send(err.stack)
      })

    })
    .catch(err => {
      res.status(400).send(err.stack)
    })
}

// READ USERS
exports.read = (_req, res) => {
  if (!'users') {
    res.status(404).send(res.message = `Collection ${usersCollectionRef} does not exist; status code: 404`)
  }

  usersCollectionRef
    .get()
    .then(async incomingUserObject => {

      const userList: Array<UsersModel> = []

      await incomingUserObject.forEach(userObject => {
        const user: UsersModel = userObject.data()
        user.leases = []
        userList.push(user)
      })

      return userList
    })
    .then((userList: Array<UsersModel>) => {
      async function getLeaseInfo() {

        for (const user of userList) {

          const tempLeasesArray: Array<LeaseModel | string> = []

          user.leaseIds.forEach(id => {
            user.leaseIds === [] ?
            tempLeasesArray :
            tempLeasesArray.push(

              db.collection('leases').doc(id)
                .get()
                .then(incomingLeaseObject => {
                  return incomingLeaseObject.data()
                })
                .catch(err => {
                  res.status(400).send(err.stack)
                }))

          })

          await Promise.all(tempLeasesArray)
            .then(resolvedLeasesArray => {
              user.leases = resolvedLeasesArray
            })
            .catch(err => {
              res.status(400).send(err.stack)
            })

        }
        
        return userList
      }

      return getLeaseInfo()
    })
    .then((userList: Array<UsersModel>) => {

      interface NewUsersModel {
        id: string,
        lastName: string,
        firstName: string,
        email: string,
        title: string,
        leases: Array<LeaseModel> | [],
        phone: string,
        ext: string,
        role: object
      }

      async function cleanUp() {
        const newUsersArray: Array<NewUsersModel> = []

        for (const user of userList) {

          const newUser: NewUsersModel = {
            id: user.id,
            lastName: user.lastName,
            firstName: user.firstName,
            email: user.email,
            title: user.title,
            leases: user.leases,
            phone: user.phone,
            ext: user.ext,
            role: user.role
          }

          newUsersArray.push(newUser)
        }

        const usersArray = await Promise.all(newUsersArray)
          .then(resolvedUsersArray => {
            resolvedUsersArray.forEach(user => user['name'] = `${user.firstName} ${user.lastName}`)
            return resolvedUsersArray
          })
          .catch(err => {
            res.status(400).send(err.stack)
          })
        
        return usersArray
       }

       return cleanUp()
    })
    .then((finalUserInfoPayload: Array<UsersModel>) => {
      res.status(200).send(finalUserInfoPayload)
    })
    .catch(err => {
      res.status(400).send(err.stack)
    })
}


// READ INDIVIDUAL USER
exports.readIndividualUser = (req, res) => {
const uid: string = req.params.uid

if (!uid) throw new Error('Id is blank')

  usersCollectionRef.doc(uid)
    .get()
    .then(user => {
      return user.data()
    })
    .then((userInfo: UsersModel) => {
      async function getLeaseInfo() {

        const tempLeasesArray: Array<LeaseModel> = []

        userInfo.leaseIds.forEach(id => {
          tempLeasesArray.push(

            db.collection('leases').doc(id)
              .get()
              .then(incomingLeaseObject => {
                return incomingLeaseObject.data()
              })
              .catch(err => {
                res.status(400).send(err.stack)
              }))

        })

      await Promise.all(tempLeasesArray)
        .then(resolvedLeasesArray => {
          userInfo.leases = resolvedLeasesArray
        })
        .catch(err => {
          res.status(400).send(err.stack)
        })

        return userInfo
      }

      return getLeaseInfo()
    })
    .then((userInfo: UsersModel) => {
      for(const lease of userInfo.leases) {

        lease.property
        lease.tenants = []
      }

      return userInfo
    })
    .then((userInfo: UsersModel) => {
      async function getPropertyInfo() {

        for (const lease of userInfo.leases) {
          const tempPropertyArray: Array<PropertiesModel> = []

          userInfo.leaseIds.forEach(id => {

            tempPropertyArray.push(

              db.collection('property').doc(id)
              .get()
              .then(incomingPropertyObject => {
                return incomingPropertyObject.data()
              })
              .catch(err => {
                res.status(400).send(err.stack)
              }))

            })

            await Promise.all(tempPropertyArray)
            .then(resolvedPropertyArray => {
              lease.property = resolvedPropertyArray.pop()
            })
            .catch(err => {
              res.status(400).send(err.stack)
            })
        }

        return userInfo
      }

      return getPropertyInfo()
    })
    .then((userInfo: UsersModel) => {
      async function getTenantInfo() {

        for(const lease of userInfo.leases) {

          const tempTenantsArray: Array<TenantsModel> = []

          lease.tenantIds.forEach(id => {
            tempTenantsArray.push(

              db.collection('tenants').doc(id)
              .get()
              .then(incomingTenantObjects => {
                return incomingTenantObjects.data()
              })
              .catch(err => {
                res.status(400).send(err.stack)
              }))

            })

            await Promise.all(tempTenantsArray)
            .then(resolvedTenantsArray => {
              lease.tenants = resolvedTenantsArray
            })
            .catch(err => {
              res.status(400).send(err.stack)
            })
          }

        return userInfo
      }

      return getTenantInfo()
    })
    .then((userInfo: UsersModel) => {
      const NewUsersModel = {
        id: userInfo.id,
        lastName: userInfo.lastName,
        firstName: userInfo.firstName,
        email: userInfo.email,
        title: userInfo.title,
        leases: userInfo.leases,
        phone: userInfo.phone,
        ext: userInfo.ext,
        role: userInfo.role
      }

      return NewUsersModel
    })
    .then(finalUserInfoPayload => {
      res.status(200).send(finalUserInfoPayload)
    })
    .catch(err => {
      res.status(400).send(err.stack)
    })
}

// UPDATE INDIVIDUAL USER
exports.update = (req, res) => {
  const uid: string = req.params.uid
  const userData: UsersModel = req.body

  if (!uid) throw new Error('Id is blank')

  const newUsersModel: UsersModel = {
    id: uid,
    lastName: userData.lastName,
    firstName: userData.firstName,
    email: userData.email,
    title: userData.title,
    leaseIds: userData.leaseIds,
    phone: userData.phone,
    ext: userData.ext,
    role: userData.role
  }

  const serverValidation = usersCollectionRef.doc(uid)
    .get()
    .then(databaseObject => {
      const dbObject = databaseObject.data()
      const validationObject: UsersModel = {
        id: uid,
        lastName: dbObject.lastName,
        firstName: dbObject.firstName,
        email: dbObject.email,
        title: dbObject.title,
        leaseIds: dbObject.leaseIds,
        phone: dbObject.phone,
        ext: dbObject.ext,
        role: dbObject.role
      }

      return validationObject
    })
    .catch(err => {
      res.status(400).send(err.stack)
    })

  Promise.resolve(serverValidation)
    .then(validationObject => {
      newUsersModel.lastName !== validationObject.lastName &&
      newUsersModel.lastName !== '' ?
        validationObject.lastName = newUsersModel.lastName :
        validationObject.lastName

      return validationObject
    })
    .then(validationObject => {
      newUsersModel.firstName !== validationObject.firstName &&
      newUsersModel.firstName !== '' ?
        validationObject.firstName = newUsersModel.firstName :
        validationObject.firstName

      return validationObject
    })
    .then(validationObject => {
      newUsersModel.email !== validationObject.email &&
      newUsersModel.email !== '' ?
        validationObject.email = newUsersModel.email :
        validationObject.email

      return validationObject
    })
    .then(validationObject => {
      newUsersModel.phone !== validationObject.phone &&
      newUsersModel.phone !== '' ?
        validationObject.phone = newUsersModel.phone :
        validationObject.phone

      return validationObject
    })
    .then(validationObject => {
      newUsersModel.ext !== validationObject.ext &&
      newUsersModel.ext !== '' ?
        validationObject.ext = newUsersModel.ext :
        validationObject.ext

      return validationObject
    })
    .then(validationObject => {
      newUsersModel.role.isAdmin !== validationObject.role.isAdmin ?
        validationObject.role.isAdmin = newUsersModel.role.isAdmin :
        validationObject.role.isAdmin

      return validationObject
    })
    .then(validationObject => {
      newUsersModel.role.isPropertyManager !== validationObject.role.isPropertyManager ?
        validationObject.role.isPropertyManager = newUsersModel.role.isPropertyManager :
         validationObject.role.isPropertyManager

      return validationObject
    })
    .then(validationObject => {
      newUsersModel.role.isStaff !== validationObject.role.isStaff ?
        validationObject.role.isStaff = newUsersModel.role.isStaff :
        validationObject.role.isStaff

      return validationObject
    })
    .then(validationObject => {
      async function validateLeaseIds() {
        const validatedLeaseIdsArray = newUsersModel.leaseIds.map(id => {
          return db.collection('leases').doc(id)
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

        await Promise.all(validatedLeaseIdsArray)
          .then(async results => {
            validationObject.leaseIds = await results.filter(validated => validated !== undefined)

            return Promise.all(results)
          })

        return validationObject
      }

      return validateLeaseIds()
    })
    .then(finalUserInfoPayload => {
      usersCollectionRef.doc(uid)
        .update(finalUserInfoPayload)
    })
    .then(_ => {
      usersCollectionRef.doc(uid)
        .get()
        .then(updatedUser => {
          res.status(200).send(updatedUser.data())
        })
        .catch(err => {
          res.status(400).send(err.stack)
        })
    })
    .catch(err => {
      res.status(400).send(err.stack)
    })
}

// ARCHIVE INDIVIDUAL USER
exports.archive = (req, res) => {
  const uid: string = req.params.uid
  if (!uid) throw new Error('Id is blank')

  usersCollectionRef.doc(uid)
    .get()
    .then(databaseObject => {
      const archiveUser: UsersModel = databaseObject.data()

      db.collection('archivedUsers').doc(uid)
        .set({archiveUser})

      usersCollectionRef.doc(uid)
        .delete()

      res.status(200).send(`user ${archiveUser.firstName} ${archiveUser.lastName} has been archived`)
    })
    .catch((err) => {
      res.status(400).send(res.message = `ID does not exist: ${uid}; status code: 400 \n` + err.stack)
    })
}

// DELETE INDIVIDUAL USER
exports.delete = (req, res) => {
  const uid: string = req.params.uid
  if (!uid) throw new Error('Id is blank')

  usersCollectionRef.doc(uid)
    .get()
    .then(deleteUserInfo => {
      const deleteUserData: UsersModel = deleteUserInfo.data()

      usersCollectionRef.doc(uid)
        .delete()

      res.status(200).send(`user ${deleteUserData.firstName} ${deleteUserData.lastName} has been deleted`)
    })
    .catch(err => {
      res.status(400).send(err.stack)
    })

}
