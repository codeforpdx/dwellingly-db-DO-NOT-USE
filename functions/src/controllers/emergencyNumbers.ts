import * as functions from 'firebase-functions'
import EmergencyNumbersModel from './../models/emergencyNumbersModel'
const admin = require('firebase-admin')
const bodyParser = require('body-parser')
const uuidv4 = require('uuid/v4')
const db = admin.firestore()
const emergencyNumbersCollectionRef = db.collection('emergencyNumbers')

// CREATE EMERGENCY NUMBER
exports.create = (req, res) => {
  const emergencyNumberData = req.body
  const uid: string = uuidv4().replace(/-/g,'')

  const createNewEmergencyNumber: EmergencyNumbersModel = {
    'id': uid,
    'contact': emergencyNumberData.contact,
    'subtext': emergencyNumberData.subtext,
    'phoneNumberOne': emergencyNumberData.phoneNumberOne,
    'phoneNumberTwo': emergencyNumberData.phoneNumberTwo,
    'phoneNumberThree': emergencyNumberData.phoneNumberThree
  }

  const validation = function validate() {
    if (typeof createNewEmergencyNumber.id !== 'string')
      res.status(400).json({
        message: `ID: ${createNewEmergencyNumber.id} is not a string, instead it received: ` + typeof createNewEmergencyNumber.id
      })

    if (typeof createNewEmergencyNumber.contact !== 'string')
      res.status(400).json({
        message: `CONTACT: ${createNewEmergencyNumber.contact} is not a string, instead it received: ` + typeof createNewEmergencyNumber.contact
      })

    if (typeof createNewEmergencyNumber.subtext !== 'string')
      res.status(400).json({
        message: `SUBTEXT: ${createNewEmergencyNumber.subtext} is not a string, instead it received: ` + typeof createNewEmergencyNumber.subtext
      })

    if (typeof createNewEmergencyNumber.phoneNumberOne.number !== 'string')
      res.status(400).json({
        message: `PHONE NUMBER ONE NUMBER: ${createNewEmergencyNumber.phoneNumberOne.subtext} is not a string, instead it received: ` + typeof createNewEmergencyNumber.phoneNumberOne.number
      })

    if (createNewEmergencyNumber.phoneNumberOne.subtext !== undefined) {
      if (typeof createNewEmergencyNumber.phoneNumberOne.subtext !== 'string')
        res.status(400).json({
          message: `PHONE NUMBER ONE SUBTEXT: ${createNewEmergencyNumber.phoneNumberOne.subtext} is not a string, instead it received: ` + typeof createNewEmergencyNumber.phoneNumberOne.subtext
        })
    } else {
      return createNewEmergencyNumber
    }

    if (createNewEmergencyNumber.phoneNumberOne.ext !== undefined) {
      if (typeof createNewEmergencyNumber.phoneNumberOne.ext !== 'string')
        res.status(400).json({
          message: `PHONE NUMBER ONE EXT: ${createNewEmergencyNumber.phoneNumberOne.ext} is not a string, instead it received: ` + typeof createNewEmergencyNumber.phoneNumberOne.ext
        })
    } else {
      return createNewEmergencyNumber
    }

    if (typeof createNewEmergencyNumber.phoneNumberTwo !== undefined) {
      if (typeof createNewEmergencyNumber.phoneNumberTwo.number !== 'string')
        res.status(400).json({
          message: `PHONE NUMBER TWO NUMBER: ${createNewEmergencyNumber.phoneNumberTwo.number} is not a string, instead it received: ` + typeof createNewEmergencyNumber.phoneNumberTwo.number
        })

      if (typeof createNewEmergencyNumber.phoneNumberTwo.subtext !== 'string')
        res.status(400).json({
          message: `PHONE NUMBER TWO SUBTEXT:${createNewEmergencyNumber.phoneNumberTwo.subtext} is not a string, instead it received: ` + typeof createNewEmergencyNumber.phoneNumberTwo.subtext
        })

      if (typeof createNewEmergencyNumber.phoneNumberTwo.ext !== 'string')
        res.status(400).json({
          message: `PHONE NUMBER TWO EXT:${createNewEmergencyNumber.phoneNumberTwo.ext} is not a string, instead it received: ` + typeof createNewEmergencyNumber.phoneNumberTwo.ext
        })
    } else {
      return createNewEmergencyNumber
    }

    if (typeof createNewEmergencyNumber.phoneNumberThree !== undefined) {
      if (typeof createNewEmergencyNumber.phoneNumberThree.number !== 'string')
        res.status(400).json({
          message: `PHONE NUMBER THREE NUMBER: ${createNewEmergencyNumber.phoneNumberThree.number} is not a string, instead it received: ` + typeof createNewEmergencyNumber.phoneNumberThree.number
        })

      if (typeof createNewEmergencyNumber.phoneNumberThree.subtext !== 'string')
        res.status(400).json({
          message: `PHONE NUMBER THREE SUBTEXT: ${createNewEmergencyNumber.phoneNumberThree.subtext} is not a string, instead it received: ` + typeof createNewEmergencyNumber.phoneNumberThree.subtext
        })

      if (typeof createNewEmergencyNumber.phoneNumberThree.ext !== 'string')
        res.status(400).json({
          message: `PHONE NUMBER THREE EXT: ${createNewEmergencyNumber.phoneNumberThree.ext} is not a string, instead it received: ` + typeof createNewEmergencyNumber.phoneNumberThree.ext
        })
    } else {
      return createNewEmergencyNumber
    }

    return createNewEmergencyNumber
  }

  Promise.resolve(validation())
  .then(newEmergencyNumberValidate =>{
    let filterUndefined = function cleanUp(newEmergencyNumberValidate) {
      for (const prop in newEmergencyNumberValidate) {
        if (newEmergencyNumberValidate[prop] === undefined) {delete newEmergencyNumberValidate[prop]}
      }

      return newEmergencyNumberValidate
    }

    Promise.resolve(filterUndefined(newEmergencyNumberValidate))
      .then(results => {
        emergencyNumbersCollectionRef.doc(uid)
        .set(results)
        .then(_ => {

          emergencyNumbersCollectionRef.doc(uid)
          .get()
          .then((createdEmergencyNumber) => {
            res.status(201).send(createdEmergencyNumber.data())
          })
          .catch(err => {
            res.end()
            res.status(400).send(err.stack)
          })
        })
        .catch(err => {
          res.status(400).send(err.stack)
        })
      })
      .catch(err => {
        res.status(400).send(err.stack)
      })
  })
  .catch(err => {
    res.status(400).send(err.stack)
  })


}

// READ EMERGENCY NUMBERS
exports.read = (_req, res) => {
  emergencyNumbersCollectionRef
    .get()
    .then(async incomingEmergencyNumberData => {

      const emergencyNumbersList: Array<EmergencyNumbersModel> = []

      await incomingEmergencyNumberData.forEach(emergencyNumberObject => {
        const emergencyNumber: EmergencyNumbersModel = emergencyNumberObject.data()
        emergencyNumbersList.push(emergencyNumber)
      })

      return emergencyNumbersList
    })
    .then(finalEmergencyNumbersList => {
      res.status(200).send(finalEmergencyNumbersList)
    })
    .catch(err => {
      res.status(400).send(err.stack)
    })

}

// READ INDIVIDUAL EMERGENCY NUMBER
exports.readIndividualEmergencyNumber = (req, res) => {
  const uid: string = req.params.uid
  if (!uid) throw new Error('Id is blank')

  emergencyNumbersCollectionRef.doc(uid)
    .get()
    .then(emergencyNumber => {
      res.status(200).send(emergencyNumber.data())
    })
    .catch(err => {
      res.status(400).send(err.stack)
    })
}

// UPDATE EMERGENCY NUMBER
exports.update = (req, res) => {
  const uid: string = req.params.uid
  const emergencyNumberData: EmergencyNumbersModel = req.body

  //entered user data from front end
  const newEmergencyNumbersModel: EmergencyNumbersModel = {
    id: uid,
    contact: emergencyNumberData.contact,
    subtext: emergencyNumberData.subtext,
    phoneNumberOne: emergencyNumberData.phoneNumberOne,
    phoneNumberTwo: emergencyNumberData.phoneNumberTwo,
    phoneNumberThree: emergencyNumberData.phoneNumberThree
  }

  if (!uid) throw new Error('Id is blank')


  const serverValidation = emergencyNumbersCollectionRef.doc(uid)
    .get()
    .then(databaseObject => {
      const dbObject = databaseObject.data()
      const validationObject: EmergencyNumbersModel = {
        id: uid,
        contact: dbObject.contact,
        subtext: dbObject.subtext,
        phoneNumberOne: dbObject.phoneNumberOne,
        phoneNumberTwo: dbObject.phoneNumberTwo,
        phoneNumberThree: dbObject.phoneNumberThree
      }

      return validationObject
    })
    .catch(err => {
      res.status(400).send(err.stack)
    })

  Promise.resolve(serverValidation)
    .then(validationObject => {
      newEmergencyNumbersModel.contact !== validationObject.contact &&
      newEmergencyNumbersModel.contact !== '' ?
        validationObject.contact = newEmergencyNumbersModel.contact :
        validationObject.contact

      return validationObject
    })
    .then(validationObject => {
      newEmergencyNumbersModel.subtext !== validationObject.subtext &&
      newEmergencyNumbersModel.subtext !== '' ?
        validationObject.subtext = newEmergencyNumbersModel.subtext :
        validationObject.subtext

      return validationObject
    })
    .then(validationObject => {
      newEmergencyNumbersModel.phoneNumberOne !== validationObject.phoneNumberOne &&
      newEmergencyNumbersModel.phoneNumberOne.number !== '' ?
        validationObject.phoneNumberOne = newEmergencyNumbersModel.phoneNumberOne :
        validationObject.phoneNumberOne

      return validationObject
    })
    .then(validationObject => {
      newEmergencyNumbersModel.phoneNumberTwo !== validationObject.phoneNumberTwo &&
      newEmergencyNumbersModel.phoneNumberTwo.number !== '' ?
        validationObject.phoneNumberTwo = newEmergencyNumbersModel.phoneNumberTwo :
        validationObject.phoneNumberTwo


      return validationObject
    })
    .then(validationObject => {
      newEmergencyNumbersModel.phoneNumberThree !== validationObject.phoneNumberThree &&
      newEmergencyNumbersModel.phoneNumberThree.number !== ''  ?
        validationObject.phoneNumberThree = newEmergencyNumbersModel.phoneNumberThree :
        validationObject.phoneNumberThree

      return validationObject
    })
    .then(finalEmergencyNumbersPayload => {
      emergencyNumbersCollectionRef.doc(uid)
        .update(finalEmergencyNumbersPayload)
    })
    .then(_ => {
      emergencyNumbersCollectionRef.doc(uid)
        .get()
        .then(updatedEmergencyNumber => {
          res.status(200).send(updatedEmergencyNumber.data())
        })
        .catch(err => {
          res.status(400).send(err.stack)
        })
    })
    .catch(err => {
      res.status(400).send(err.stack)
    })
}

// ARCHIVE EMERGENCY NUMBER
exports.archive = (req, res) => {
  const uid: string = req.params.uid
  if (!uid) throw new Error('Id is blank')

  emergencyNumbersCollectionRef.doc(uid)
    .get()
    .then(databaseObject => {
      const archiveEmergencyNumber: EmergencyNumbersModel = databaseObject.data()

      db.collection('archivedEmergencyNumbers').doc(uid)
        .set({archiveEmergencyNumber})

      emergencyNumbersCollectionRef.doc(uid)
        .delete()

      res.status(200).send(`emergency number for ${archiveEmergencyNumber.contact} has been archived`)
    })
    .catch(err => {
      res.status(400).send(err.stack)
    })
}

// DELETE EMERGENCY NUMBER
exports.delete = (req, res) => {
  const uid: string = req.params.uid
  if (!uid) throw new Error('Id is blank')

  emergencyNumbersCollectionRef.doc(uid)
    .get()
    .then(deleteEmergencyNumberData => {
      const deleteEmergencyNumber: EmergencyNumbersModel = deleteEmergencyNumberData.data()

      emergencyNumbersCollectionRef.doc(uid)
        .delete()

      res.status(200).send(`emergency number for ${deleteEmergencyNumber.contact} has been deleted`)
    })
    .catch(err => {
      res.status(400).send(err.stack)
    })
}
