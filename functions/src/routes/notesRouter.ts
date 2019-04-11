const notesExpress = require('express')
const notesRouter = notesExpress.Router()
const notes = require('../controllers/notes')

notesRouter.route('/')
  .get(notes.read)
  .post(notes.create)

notesRouter.route('/:uid')
  .get(notes.readIndividualNote)
  .patch(notes.update)
  .put(notes.archive)
  .delete(notes.delete)

module.exports = notesRouter
