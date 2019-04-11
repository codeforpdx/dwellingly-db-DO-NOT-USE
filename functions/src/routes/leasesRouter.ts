const leasesExpress = require('express')
const leasesRouter = leasesExpress.Router()
const leases = require('../controllers/leases')

leasesRouter.route('/')
  .get(leases.read)
  .post(leases.create)

leasesRouter.route('/:uid')
  .get(leases.readIndividualLease)
  .patch(leases.update)
  .put(leases.archive)
  .delete(leases.delete)

module.exports = leasesRouter
