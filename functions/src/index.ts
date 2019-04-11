// *––––––––––––––––––*
// NPM IMPORTS
// *––––––––––––––––––*
import * as functions from 'firebase-functions'
import express = require('express')
const admin = require('firebase-admin'),
      bodyParser = require('body-parser'),
      serviceAccount = require('./../ServiceAccountKey.json')

// *––––––––––––––––––*
// FIREBASE INIT
// *––––––––––––––––––*
const firebaseInit = admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
  databaseURL: 'https://join-thingy-v01.firebaseio.com'
})
const settings = { timestampsInSnapshots: true }
firebaseInit.firestore().settings(settings)

// *––––––––––––––––––*
// IMPORTS CONT.
// *––––––––––––––––––*
// *––––––––––––––––––*
// EXPRESS INIT
const app = express(),
// *––––––––––––––––––*
// ROUTER IMPORTS
      usersRouter = require('./routes/usersRouter'),
      ticketsRouter = require('./routes/ticketsRouter'),
      tenantsRouter = require('./routes/tenantsRouter'),
      propertiesRouter = require('./routes/propertiesRouter'),
      notesRouter = require('./routes/notesRouter'),
      leasesRouter = require('./routes/leasesRouter'),
      emergencyNumbersRouter = require('./routes/emergencyNumbersRouter'),
// *––––––––––––––––––*
// MIDDLEWARE IMPORTS
      cors = require('cors'),
      morgan = require('morgan'),
      compression = require('compression'),
      minify = require('express-minify'),
      helmet = require('helmet')

// *––––––––––––––––––*
// MIDDLEWARE
// *––––––––––––––––––*
app.use(bodyParser.json())            // JSON parser
app.use(cors({ origin: true }))       // enable CORS
app.use(morgan('dev'))                // logger
app.use(compression())                // compress HTML response
app.use(helmet())                     // checks header for vulnerabilities
app.use(minify())                     // minify compile output

// *––––––––––––––––––*
// ROUTES
// *––––––––––––––––––*
app.use('/v1/users', usersRouter)                        // Routes to usersRouter
app.use('/v1/tickets', ticketsRouter)                    // Routes to ticketsRouter
app.use('/v1/tenants', tenantsRouter)                    // Routes to tenantsRouter
app.use('/v1/properties', propertiesRouter)              // Routes to propertiesRouter
app.use('/v1/notes', notesRouter)                        // Routes to notesRouter
app.use('/v1/leases', leasesRouter)                      // Routes to leasRouter
app.use('/v1/emergencyNumbers', emergencyNumbersRouter)  // Routes to emergencyNumbersRouter

// *––––––––––––––––––*
// ERROR LOGGING
// *––––––––––––––––––*
// app.use(function(err, _req, res, _next) {
//   res.status(err.status || 500)
//      .json({
//         message: err.message,
//         error: err.stack
//   })
// })

exports.api = functions.https.onRequest(app)
