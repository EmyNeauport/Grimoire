const Book = require('../models/book');

exports.createBook = (req, res, next) => {
  let bookData;
  try {
    // Si le front-end envoie un champ "book" (chaîne JSON), on le parse
    bookData = req.body.book ? JSON.parse(req.body.book) : req.body;
  } catch (error) {
    return res.status(400).json({ error: 'Mauvais format de données pour book' });
  }

  // Crée le livre en assignant l'image uploadée (si présente)
  const book = new Book({
    ...bookData,
    userId: req.auth.userId,
    imageUrl: req.file ? req.file.path : bookData.imageUrl, // Utilise le chemin du fichier ou conserve la valeur déjà fournie
  });

  book.save()
    .then(() => res.status(201).json({ message: 'Objet enregistré' }))
    .catch(error => res.status(500).json({ error }));
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
