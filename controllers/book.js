const Book = require('../models/book');
const fs = require('fs');

exports.createBook = (req, res, next) => {
  let bookObject = {};

  // Si req.body.thing existe, on le parse, sinon on utilise req.body directement
  if (req.body.book) {
    try {
      bookObject = JSON.parse(req.body.book);
    } catch (error) {
      return res.status(400).json({ error: 'Mauvais format de données pour "book"' });
    }
  } else {
    bookObject = { ...req.body };
  }

  // On vérifie que les champs obligatoires sont présents
  const { title, author, year, genre } = bookObject;
  if (!title || !author || !year || !genre) {
    return res.status(400).json({ error: 'Champs manquants : title, author, year et genre sont requis.' });
  }

  // On définit des valeurs par défaut pour averageRating et ratings s'ils ne sont pas fournis
  bookObject.averageRating = bookObject.averageRating !== undefined ? bookObject.averageRating : 0;
  bookObject.ratings = bookObject.ratings || [];

  // On crée le livre en utilisant le fichier uploadé pour l'image s'il existe
  const book = new Book({
    ...bookObject,
    userId: req.auth.userId,
    imageUrl: req.file 
      ? `${req.protocol}://${req.get('host')}/images/${req.file.filename}` 
      : bookObject.imageUrl // ou une valeur par défaut si l'image est obligatoire
  });

  book.save()
    .then(() => res.status(201).json({ message: 'Objet enregistré' }))
    .catch(error => res.status(400).json({ error }));
};


exports.modifyBook = (req, res, next) => {
  let bookObject = {};

  if (req.file) {
    // Si un fichier est envoyé, les données textuelles se trouvent dans req.body.book
    try {
      bookObject = req.body.book ? JSON.parse(req.body.book) : {};
    } catch (error) {
      return res.status(400).json({ error: 'Mauvais format de données pour "book"' });
    }
    // Mise à jour de l'URL de l'image avec le nouveau fichier
    bookObject.imageUrl = `${req.protocol}://${req.get('host')}/images/${req.file.filename}`;
  } else {
    // Si aucun fichier n'est envoyé, on utilise directement le corps de la requête
    bookObject = { ...req.body };
  }

  // On retire le champ _userId envoyé par le client, pour éviter toute tentative de modification
  delete bookObject._userId;

  // On récupère d'abord le livre existant
  Book.findOne({ _id: req.params.id })
    .then(book => {
      if (!book) {
        return res.status(404).json({ error: 'Livre non trouvé' });
      }
      // Vérification que l'utilisateur connecté est bien le propriétaire du livre
      if (book.userId !== req.auth.userId) {
        return res.status(403).json({ error: 'Non autorisé' });
      }
      // Mise à jour du livre avec les nouvelles données
      Book.updateOne({ _id: req.params.id }, { ...bookObject, _id: req.params.id })
        .then(() => res.status(200).json({ message: 'Objet modifié' }))
        .catch(error => res.status(400).json({ error }));
    })
    .catch(error => res.status(500).json({ error }));
};


exports.deleteBook = (req, res, next) => {
  Book.findOne({ _id: req.params.id})
      .then(book => {
          if (book.userId != req.auth.userId) {
              res.status(401).json({message: 'Not authorized'});
          } else {
              const filename = book.imageUrl.split('/images/')[1];
              fs.unlink(`images/${filename}`, () => {
                  Book.deleteOne({_id: req.params.id})
                      .then(() => { res.status(200).json({message: 'Objet supprimé !'})})
                      .catch(error => res.status(401).json({ error }));
              });
          }
      })
      .catch( error => {
          res.status(500).json({ error });
      });
};

exports.getOneBook = (req, res, next) => {
    Book.findOne({ _id: req.params.id })
      .then(book => res.status(200).json(book))
      .catch(error => res.status(404).json({ error }));
};

exports.getAllBooks = (req, res, next) => {
    // Retourne la liste complète des livres en BDD
    Book.find()
      .then(books => res.status(200).json(books))
      .catch(error => res.status(400).json({ error }));
};
