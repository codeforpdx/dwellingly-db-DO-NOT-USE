import * as functions from 'firebase-functions'
import NotesModel from './../models/notesModel'
const admin = require('firebase-admin')
const bodyParser = require('body-parser')
const uuidv4 = require('uuid/v4')
const db = admin.firestore()
const notesCollectionRef = db.collection('notes')

// CREATE NOTE
exports.create = (req, res) => {
  const noteData = req.body
  const uid: string = uuidv4().replace(/-/g,'')
  const dateCreatedTimeStamp: string = new Date().toString()

  const createNewNote: NotesModel = {
    'id': uid,
    'dateCreated': dateCreatedTimeStamp,
    'whoAdded': noteData.whoAdded,
    'noteBody': noteData.noteBody
  }

  const validation = function validate(createNewNote) {
    if (typeof createNewNote.id !== 'string')
      return res.status(400).json({
        message: `ID: ${createNewNote.id} is not a string, instead it recieved: ` + typeof createNewNote.id
    })

    if (typeof createNewNote.whoAdded !== 'string')
      return res.status(400).json({
        message: `ID: ${createNewNote.whoAdded} is not a string, instead it recieved: ` + typeof createNewNote.whoAdded
    })

    if (typeof createNewNote.noteBody !== 'string')
      return res.status(400).json({
        message: `ID: ${createNewNote.noteBody} is not a string, instead it recieved: ` + typeof createNewNote.noteBody
    })

    return createNewNote
  }

  Promise.resolve(validation(createNewNote))
    .then(results => {
      notesCollectionRef.doc(uid)
      .set(results)
      .then(_ => {

        notesCollectionRef.doc(uid)
        .get()
        .then(createdNote => {
          res.status(201).send(createdNote.data())
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

// READ NOTES
exports.read = (_req, res) => {
  if(!'notes') {
    res.status(404).send(res.message = `Collection ${notesCollectionRef} does not exist; status code: 404`)
  }

  notesCollectionRef
    .get()
    .then(async incomingNotesObject => {

      const notesList: Array<NotesModel> = []

      await incomingNotesObject.forEach(notesObject => {
        const note: NotesModel = notesObject.data()
        notesList.push(note)
      })

      return notesList
    })
    .then((finalNoteListPayload: Array<NotesModel>) => {
      res.status(200).send(finalNoteListPayload)
    })
    .catch(err => {
      res.status(400).send(err.stack)
    })

}

// READ INDIVIDUAL NOTE
exports.readIndividualNote = (req, res) => {
  const uid: string = req.params.uid
  if (!uid) throw new Error('Id is blank')

  notesCollectionRef.doc(uid)
    .get()
    .then(note => {
      res.status(200).send(note.data())
    })
    .catch(err => {
      res.status(400).send(err.stack)
    })
}

// UPDATE INDIVIDUAL NOTE
exports.update = (req, res) => {
  const uid: string = req.params.uid
  const noteData: NotesModel = req.body

  if (!uid) throw new Error('Id is blank')


  const newNoteModel: NotesModel = {
    id: uid,
    whoAdded: noteData.whoAdded,
    dateCreated: noteData.dateCreated,
    noteBody: noteData.noteBody
  }

  const serverValidation = notesCollectionRef.doc(uid)
    .get()
    .then(databaseObject => {
      const dbObject = databaseObject.data()
      const validationObject: NotesModel = {
        id: uid,
        whoAdded: dbObject.whoAdded,
        dateCreated: dbObject.dateCreated,
        noteBody: dbObject.noteBody
      }

      return validationObject
    })
    .catch(err => {
      res.status(400).send(err.stack)
    })

  Promise.resolve(serverValidation)
    .then(validationObject => {
      newNoteModel.noteBody !== validationObject.noteBody &&
      validationObject.noteBody !== '' ?
        validationObject.noteBody = newNoteModel.noteBody :
        validationObject.noteBody

      return validationObject
    })
    .then(finalNoteInfoPayload => {
      notesCollectionRef.doc(uid)
        .update(finalNoteInfoPayload)
    })
    .then(_ => {
      notesCollectionRef.doc(uid)
        .get()
        .then(updatedNote => {
          res.status(200).send(updatedNote.data())
        })
        .catch(err => {
          res.status(400).send(err.stack)
        })
    })
    .catch(err => {
      res.status(400).send(err.stack)
    })
}

// ARCHIVE INDIVIDUAL NOTE
exports.archive = (req, res) => {
  const uid: string = req.params.uid
  if (!uid) throw new Error('Id is blank')

  notesCollectionRef.doc(uid)
    .get()
    .then(databaseObject => {
      const archiveNote: NotesModel = databaseObject.data()

      db.collection('archivedNotes').doc(uid)
        .set({archiveNote})

      notesCollectionRef.doc(uid)
        .delete()

      res.status(200).send(`Note ${uid} has been archived`)
    })
    .catch(err => {
      res.status(400).send(res.message = `ID does not exist: ${uid}; status code: 400 \n` + err.stack)
    })
}

// DELETE INDIVIDUAL NOTE
exports.delete = (req, res) => {
  const uid: string = req.params.uid
  if (!uid) throw new Error('Id is blank')

  notesCollectionRef.doc(uid)
    .get()
    .then(deleteNoteInfo => {
      const deleteNoteData: NotesModel = deleteNoteInfo.data()

      notesCollectionRef.doc(uid)
        .delete()

      res.status(200).send(`Note ${deleteNoteData.id} has been deleted`)
    })
    .catch(err => {
      res.status(400).send(err.stack)
    })
}
