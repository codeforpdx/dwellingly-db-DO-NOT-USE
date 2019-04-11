import * as functions from 'firebase-functions'
import PropertiesModel from './../models/propertiesModel'
const admin = require('firebase-admin')
const bodyParser = require('body-parser')
const uuidv4 = require('uuid/v4')
const db = admin.firestore()
const propertiesCollectionRef = db.collection('properties')

// CREATE PROPERTY
exports.create = (req, res) => {
  const propertyData = req.body
  const uid: string = uuidv4().replace(/-/g,'')

  const createNewProperty: PropertiesModel = {
    'id': uid,
    'name': propertyData.name,
    'addressOne': propertyData.addressOne,
    'addressTwo': propertyData.addressTwo,
    'numberOfUnits': propertyData.numberOfUnits,
    'city': propertyData.city,
    'state': propertyData.state,
    'zipCode': propertyData.zipCode
  }

  const validation = function validate(createNewProperty) {
    if (typeof createNewProperty.id !== 'string')
      return res.status(400).json({
        message: `ID: ${createNewProperty.id} is not a string, instead it received: ` + typeof createNewProperty.id
      })

    if (typeof createNewProperty.name !== 'string')
      return res.status(400).json({
        message: `NAME: ${createNewProperty.name} is not a string, instead it received: ` + typeof createNewProperty.name
      })

    if (typeof createNewProperty.addressOne !== 'string')
      return res.status(400).json({
        message: `ADDRESS ONE: ${createNewProperty.addressOne} is not a string, instead it received: ` + typeof createNewProperty.addressOne
      })

    if (typeof createNewProperty.addressTwo !== 'string')
      return res.status(400).json({
        message: `ADDRESS TWO: ${createNewProperty.addressTwo} is not a string, instead it received: ` + typeof createNewProperty.addressTwo
      })

    if (typeof createNewProperty.numberOfUnits !== 'string')
      return res.status(400).json({
        message: `NUMBER OF UNITS: ${createNewProperty.numberOfUnits} is not a string, instead it received: ` + typeof createNewProperty.numberOfUnits
      })

    if (typeof createNewProperty.city !== 'string')
      return res.status(400).json({
        message: `CITY: ${createNewProperty.city} is not a string, instead it received: ` + typeof createNewProperty.city
      })

    if (typeof createNewProperty.state !== 'string')
      return res.status(400).json({
        message: `STATE: ${createNewProperty.state} is not a string, instead it received: ` + typeof createNewProperty.state
      })

    if (typeof createNewProperty.zipCode !== 'number')
      return res.status(400).json({
        message: `ZIP CODE: ${createNewProperty.zipCode} is not a number, instead it received: ` + typeof createNewProperty.zipCode
      })

    return createNewProperty
  }

  Promise.resolve(validation(createNewProperty))
    .then(results => {
      propertiesCollectionRef.doc(uid)
        .set(results)
        .then(_ => {

          propertiesCollectionRef.doc(uid)
            .get()
            .then(createdProperty => {
              res.status(201).send(createdProperty.data())
            })
            .catch(err => {
              res.end()
              res.status(400).send(err.stack)
            })

        })
        .catch(err => {
          res.end()
          res.status(400).send(err.stack)
        })
    })
    .catch(err => {
      res.end()
      res.status(400).send(err.stack)
    })
}

// READ PROPERTIES
exports.read = (_req, res) => {
  if (!'properties') {
    res.status(404).send(res.message = `Collection ${propertiesCollectionRef} does not exist; status code: 404`)
  }

  propertiesCollectionRef
    .get()
    .then(async incomingPropertyObjects => {

      const propertyList: Array<any> = []

      await incomingPropertyObjects.forEach(propertyObject => {
        const property: PropertiesModel = propertyObject.data()
        propertyList.push(property)
      })
      propertyList.forEach(property => property['searchName'] = `${property.name}, ${property.addressOne}`)
      return propertyList
    })
    .then((finalPropertyListPayload: Array<PropertiesModel>) => {
      res.status(200).send(finalPropertyListPayload)
    })
    .catch(err => {
      res.status(400).send(err.stack)
    })
}

// READ INDIVIDUAL PROPERTY
exports.readIndividualProperty = (req, res) => {
  const uid: string = req.params.uid
  if (!uid) throw new Error('Id is blank')

  propertiesCollectionRef.doc(uid)
    .get()
    .then(property => {
      res.status(200).send(property.data())
    })
    .catch(err => {
      res.status(400).send(err.stack)
    })
}

// UPDATE INDIVIDUAL PROPERTY
exports.update = (req, res) => {
  const uid: string = req.params.uid
  const propertyData: PropertiesModel = req.body

  if (!uid) throw new Error('Id is blank')


  const newPropertyModel: PropertiesModel = {
    id: uid,
    name: propertyData.name,
    addressOne: propertyData.addressOne,
    addressTwo: propertyData.addressTwo,
    numberOfUnits: propertyData.numberOfUnits,
    city: propertyData.city,
    state: propertyData.state,
    zipCode: propertyData.zipCode
  }


  const serverValidation = propertiesCollectionRef.doc(uid)
    .get()
    .then(databaseObject => {
      const dbObject = databaseObject.data()
      const validationObject: PropertiesModel = {
        id: uid,
        name: dbObject.name,
        addressOne: dbObject.addressOne,
        addressTwo: dbObject.addressTwo,
        numberOfUnits: dbObject.numberOfUnits,
        city: dbObject.city,
        state: dbObject.state,
        zipCode: dbObject.zipCode
      }

      return validationObject
    })

  Promise.resolve(serverValidation)
    .then(validationObject => {
      newPropertyModel.name !== validationObject.name &&
      newPropertyModel.name !== '' ?
        validationObject.name = newPropertyModel.name :
        validationObject.name

      return validationObject
    })
    .then(validationObject => {
      newPropertyModel.addressOne !== validationObject.addressOne &&
      newPropertyModel.addressOne !== '' ?
        validationObject.addressOne = newPropertyModel.addressOne :
        validationObject.addressOne

      return validationObject
    })
    .then(validationObject => {
      newPropertyModel.addressTwo !== validationObject.addressTwo &&
      newPropertyModel.addressTwo !== '' ?
        validationObject.addressTwo = newPropertyModel.addressTwo :
        validationObject.addressTwo

      return validationObject
    })
    .then(validationObject => {
      newPropertyModel.numberOfUnits !== validationObject.numberOfUnits &&
      newPropertyModel.numberOfUnits !== '' ?
        validationObject.numberOfUnits = newPropertyModel.numberOfUnits :
        validationObject.numberOfUnits

      return validationObject
    })
    .then(validationObject => {
      newPropertyModel.city !== validationObject.city &&
      newPropertyModel.city !== '' ?
        validationObject.city = newPropertyModel.city :
        validationObject.city

      return validationObject
    })
    .then(validationObject => {
      newPropertyModel.state !== validationObject.state &&
      newPropertyModel.state !== '' ?
        validationObject.state = newPropertyModel.state :
        validationObject.state

      return validationObject
    })
    .then(validationObject => {
      newPropertyModel.zipCode !== validationObject.zipCode &&
      newPropertyModel.zipCode !== NaN ?
        validationObject.zipCode = newPropertyModel.zipCode :
        validationObject.zipCode

      return validationObject
    })
    .then(finalPropertyInfoPayload => {
      propertiesCollectionRef.doc(uid)
        .update(finalPropertyInfoPayload)
    })
    .then(_ => {
      propertiesCollectionRef.doc(uid)
        .get()
        .then(updatedProperty => {
          res.status(200).send(updatedProperty.data())
        })
        .catch(err => {
          res.status(400).send(err.stack)
        })
    })
    .catch(err => {
      res.status(400).send(err.stack)
    })
}

// ARCHIVE INDIVIDUAL PROPERTY
exports.archive = (req, res) => {
  const uid: string = req.params.uid
  if (!uid) throw new Error('Id is blank')

  propertiesCollectionRef.doc(uid)
    .get()
    .then(databaseObject => {
      const archiveProperty: PropertiesModel = databaseObject.data()

      db.collection('archivedProperties').doc(uid)
        .set({archiveProperty})

      propertiesCollectionRef.doc(uid)
        .delete()

      res.status(200).send(`property ${archiveProperty.name} has been archived`)
    })
    .catch(err => {
      res.status(400).send(res.message = `ID does not exist: ${uid}; status code: 400 \n` + err.stack)
    })
}

// DELETE INDIVIDUAL PROPERTY
exports.delete = (req, res) => {
  const uid: string = req.params.uid
  if (!uid) throw new Error('Id is blank')

  propertiesCollectionRef.doc(uid)
    .get()
    .then(deletePropertyInfo => {
      const deletePropertyData: PropertiesModel = deletePropertyInfo.data()

      propertiesCollectionRef.doc(uid)
        .delete()

      res.status(200).send(`property ${deletePropertyData.name} has been deleted`)
    })
    .catch(err => {
      res.status(400).send(err.stack)
    })
}
