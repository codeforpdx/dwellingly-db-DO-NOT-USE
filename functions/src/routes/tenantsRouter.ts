const tenantsExpress = require('express')
const tenantsRouter = tenantsExpress.Router()
const tenants = require('../controllers/tenants')

tenantsRouter.route('/')
  .get(tenants.read)
  .post(tenants.create)

tenantsRouter.route('/:uid')
  .get(tenants.readIndividualTenant)
  .patch(tenants.update)
  .put(tenants.archive)
  .delete(tenants.delete)

module.exports = tenantsRouter
