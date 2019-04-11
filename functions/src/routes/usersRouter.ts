const usersExpress = require('express')
const usersRouter = usersExpress.Router()
const users = require('../controllers/users')

usersRouter.route('/')
  .get(users.read)
  .post(users.create)

usersRouter.route('/:uid')
  .get(users.readIndividualUser)
  .patch(users.update)
  .put(users.archive)
  .delete(users.delete)

module.exports = usersRouter
