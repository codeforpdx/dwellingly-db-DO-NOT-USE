const ticketsExpress = require('express')
const ticketsRouter = ticketsExpress.Router()
const tickets = require('../controllers/tickets')

ticketsRouter.route('/')
  .get(tickets.read)
  .post(tickets.create)

ticketsRouter.route('/:uid')
  .get(tickets.readIndividualTicket)
  .patch(tickets.update)
  .put(tickets.archive)
  .delete(tickets.delete)

module.exports = ticketsRouter
