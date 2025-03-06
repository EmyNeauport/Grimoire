const sharp = require('sharp')
const Book = require('../models/book');
const fs = require('fs');

exports.createBook = async (req, res, next) => {
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

  // 🔧 Traitement de l'image si un fichier est envoyé
  if (req.file) {
    // Assurez-vous que le dossier "images" existe
    if (!fs.existsSync('./images')) {
      fs.mkdirSync('./images');
    }
    const { buffer, originalname } = req.file;
    const timestamp = Date.now();
    // Construire un nom unique et convertir en WebP
    const fileName = `${timestamp}-${originalname.split(' ').join('_')}.webp`;
    await sharp(buffer)
      .webp({ quality: 80 }) // Vous pouvez ajuster la qualité ici
      .toFile(`./images/${fileName}`);
    // Définir l'URL de l'image optimisée
    bookObject.imageUrl = `${req.protocol}://${req.get('host')}/images/${fileName}`;
  } else {
    // Sinon, conserver l'URL éventuellement fournie
    bookObject.imageUrl = bookObject.imageUrl;
  }

  // On crée le livre en utilisant le fichier uploadé pour l'image s'il existe
  const book = new Book({
    ...bookObject,
    userId: req.auth.userId,
    imageUrl: bookObject.imageUrl
  });

  book.save()
    .then(() => res.status(201).json({ message: 'Objet enregistré' }))
    .catch(error => res.status(400).json({ error }));
};


exports.modifyBook = async (req, res, next) => {
  let bookObject = {};

  if (req.file) {
    // Si un fichier est envoyé, les données textuelles se trouvent dans req.body.book
    try {
      bookObject = req.body.book ? JSON.parse(req.body.book) : {};
    } catch (error) {
      return res.status(400).json({ error: 'Mauvais format de données pour "book"' });
    }
    // Assurez-vous que le dossier "images" existe
    if (!fs.existsSync('./images')) {
      fs.mkdirSync('./images');
    }
    const { buffer, originalname } = req.file;
    const timestamp = Date.now();
    // Construire un nom unique et convertir en WebP avec Sharp
    const fileName = `${timestamp}-${originalname.split(' ').join('_')}.webp`;
    await sharp(buffer)
      .webp({ quality: 20 })
      .toFile(`./images/${fileName}`);
    // Définir l'URL de l'image optimisée
    bookObject.imageUrl = `${req.protocol}://${req.get('host')}/images/${fileName}`;
  } else {
    // Sinon, utiliser directement le corps de la requête
    bookObject = { ...req.body };
  }

  // Supprimer le champ _userId pour éviter toute modification non autorisée
  delete bookObject._userId;

  try {
    const book = await Book.findOne({ _id: req.params.id });
    if (!book) {
      return res.status(404).json({ error: 'Livre non trouvé' });
    }
    if (book.userId !== req.auth.userId) {
      return res.status(403).json({ error: 'Non autorisé' });
    }
    await Book.updateOne({ _id: req.params.id }, { ...bookObject, _id: req.params.id });
    res.status(200).json({ message: 'Objet modifié' });
  } catch (error) {
    res.status(500).json({ error });
  }
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

exports.rateBook = async (req, res, next) => {
  try {
    // Récupération de la note envoyée dans le corps de la requête
    const { rating } = req.body;
    // Vérifiez que la note est bien un nombre entre 0 et 5
    if (rating === undefined || typeof rating !== 'number' || rating < 0 || rating > 5) {
      return res.status(400).json({ error: "La note doit être un nombre entre 0 et 5." });
    }

    // Récupérez le livre à noter en utilisant l'ID passé dans l'URL
    const book = await Book.findOne({ _id: req.params.id });
    if (!book) {
      return res.status(404).json({ error: "Livre non trouvé." });
    }

    const userId = req.auth.userId;
    // Vérifiez que l'utilisateur n'a pas déjà noté ce livre
    const alreadyRated = book.ratings.some(r => r.userId === userId);
    if (alreadyRated) {
      return res.status(400).json({ error: "Vous avez déjà noté ce livre." });
    }

    // Ajoutez la nouvelle note dans le tableau "ratings"
    book.ratings.push({ userId, grade: rating });

    // Mettez à jour la note moyenne
    const sum = book.ratings.reduce((acc, curr) => acc + curr.grade, 0);
    book.averageRating = sum / book.ratings.length;

    // Sauvegardez le livre mis à jour et renvoyez-le dans la réponse
    const updatedBook = await book.save();
    res.status(200).json(updatedBook);
  } catch (error) {
    res.status(500).json({ error });
  }
};

exports.getBestRatedBooks = (req, res, next) => {
  Book.find()  
    .sort({ averageRating: -1 }) // Trie par note moyenne décroissante
    .limit(3)                   // Limite le résultat aux 3 premiers livres
    .then(books => res.status(200).json(books))
    .catch(error => res.status(400).json({ error }));
};