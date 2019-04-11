const propertiesExpress = require('express')
const propertiesRouter = propertiesExpress.Router()
const properties = require('../controllers/properties')

propertiesRouter.route('/')
  .get(properties.read)
  .post(properties.create)

propertiesRouter.route('/:uid')
  .get(properties.readIndividualProperty)
  .patch(properties.update)
  .put(properties.archive)
  .delete(properties.delete)

module.exports = propertiesRouter
