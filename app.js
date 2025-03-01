const express = require ('express');
const mongoose = require('mongoose');

const Book = require('./models/book')

// appeler la constante express pour créer notre application express
const app = express();
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

app.post ('/api/books',(req, res, next) => {
    console.log("données reçues:", req.body);
    delete req.body.userId;
    const book = new Book({
        ...req.body
    });
    book.save()
    .then(() => res.status(201).json({messagge: 'Objet enregistré'}))
    .catch(error => res.status(400).json({error}));
});

app.get('/api/books',(req, res, next) => {
    Book.find()
    .then(books => res.status(200).json(books))
    .catch(error => res.status(400).json({error}));
});


// exporter l'application pour que l'on puisse y accéder depuis les autres fichiers de notre projet
module.exports = app;