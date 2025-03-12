const express = require ('express')
require('dotenv').config()
const mongoose = require('mongoose')
const path = require('path')
const app = express()

//MongoDB
mongoose.connect(process.env.MONGO_URI, {
  useNewUrlParser: true,
  useUnifiedTopology: true
})
.then(() => console.log('Connexion à MongoDB réussie !'))
.catch(() => console.log('Connexion à MongoDB échouée !'))

app.use(express.json())

//CORS
app.use((req, res, next) => {
    res.setHeader('Access-Control-Allow-Origin', '*')
    res.setHeader('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content, Accept, Content-Type, Authorization')
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, PATCH, OPTIONS')
    next()
  })

//routing
app.use('/api/books', require('./routes/book'))
app.use('/api/auth', require('./routes/user'))
app.use('/images', express.static(path.join(__dirname, 'images'), {
  maxAge: '30d', // Cache pendant 30 jours
  etag: false   // Optionnel, selon vos besoins
}))

//exporter l'application pour que l'on puisse y accéder depuis les autres fichiers de notre projet
module.exports = app