const emergencyNumbersExpress = require('express')
const emergencyNumbersRouter = emergencyNumbersExpress.Router()
const emergencyNumbers = require('../controllers/emergencyNumbers')

emergencyNumbersRouter.route('/')
  .get(emergencyNumbers.read)
  .post(emergencyNumbers.create)

emergencyNumbersRouter.route('/:uid')
  .get(emergencyNumbers.readIndividualEmergencyNumber)
  .patch(emergencyNumbers.update)
  .put(emergencyNumbers.archive)
  .delete(emergencyNumbers.delete)

module.exports = emergencyNumbersRouter
