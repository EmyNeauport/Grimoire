const express = require ('express');
const mongoose = require('mongoose');
const path = require('path');
const app = express();

// appeler la constante express pour créer notre application express
mongoose.connect('mongodb+srv://neauportemilie:9sa4yJROcygENbUt@cluster0.kgs6a.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0',
    { useNewUrlParser: true,
      useUnifiedTopology: true })
    .then(() => console.log('Connexion à MongoDB réussie !'))
    .catch(() => console.log('Connexion à MongoDB échouée !'));

app.use(express.json());

//je ne comprends pas l'utilité de ces lignes, j'ai changé les n° de port pour avoir la même chose côté front et côté back
app.use((req, res, next) => {
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content, Accept, Content-Type, Authorization');
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, PATCH, OPTIONS');
    next();
  });

app.use('/api/books', require('./routes/book'));
app.use('/api/auth', require('./routes/user'));
app.use('/images', express.static(path.join(__dirname, 'images'), {
  maxAge: '30d', // Cache pendant 30 jours
  etag: false   // Optionnel, selon vos besoins
}));

// exporter l'application pour que l'on puisse y accéder depuis les autres fichiers de notre projet
module.exports = app;