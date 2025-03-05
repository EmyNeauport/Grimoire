const Book = require('../models/book');

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
    // On récupère d'abord le livre
    Book.findOne({ _id: req.params.id })
      .then(book => {
        if (!book) {
          return res.status(404).json({ error: 'Livre non trouvé' });
        }
        // On vérifie que l'utilisateur connecté est bien le propriétaire
        if (book.userId !== req.auth.userId) {
          return res.status(403).json({ error: 'Non autorisé' });
        }
        // L'utilisateur est le propriétaire, on procède à la mise à jour
        Book.updateOne({ _id: req.params.id }, { ...req.body, _id: req.params.id })
          .then(() => res.status(200).json({ message: 'Objet modifié' }))
          .catch(error => res.status(400).json({ error }));
      })
      .catch(error => res.status(500).json({ error }));
};

exports.deleteBook = (req, res, next) => {
    // Pour la suppression, il est également judicieux de vérifier le propriétaire
    Book.findOne({ _id: req.params.id })
      .then(book => {
        if (!book) {
          return res.status(404).json({ error: 'Livre non trouvé' });
        }
        if (book.userId !== req.auth.userId) {
          return res.status(403).json({ error: 'Non autorisé' });
        }
        Book.deleteOne({ _id: req.params.id })
          .then(() => res.status(200).json({ message: 'Objet supprimé' }))
          .catch(error => res.status(400).json({ error }));
      })
      .catch(error => res.status(500).json({ error }));
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
