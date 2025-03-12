const Book = require('../models/book')
const fs = require('fs')

//FONCTION QUI PERMET DE GERER LA ROUTE POST DE L OBJET BOOK
exports.create = async (req, res, next) => {
  try {
    //vérifier et adapter le format des données envoyées si besoin
    let bookObject = req.body.book ? JSON.parse(req.body.book) : { ...req.body }

    //vérifier que les champs obligatoires sont bien renseignés
    if (!bookObject.title?.trim() || !bookObject.author?.trim() || 
        !bookObject.year || !bookObject.genre?.trim()) {
      return res.status(400).json({ error: 'Tous les champs (title, author, year, genre) sont requis.' })
    }
    //vérifier l'année renseignée
    if (!bookObject.year || isNaN(bookObject.year) || bookObject.year < 0) {
      return res.status(400).json({ error: 'L\'année doit être un nombre valide.' })
    }

    //définir des valeurs par défaut pour averageRating et ratings s'ils ne sont pas fournis
    bookObject.averageRating = bookObject.averageRating ?? 0
    bookObject.ratings = Array.isArray(bookObject.ratings) ? bookObject.ratings : []

    //utiliser l'image traitée par 'multer-config.js'
    if (req.imageUrl) {
      bookObject.imageUrl = req.imageUrl
    }
    
    //créer le livre en utilisant le fichier uploadé pour l'image s'il existe
    const book = new Book({
      ...bookObject,
      userId: req.auth.userId
    })

    await book.save()
    res.status(201).json({ message: 'Objet enregistré' })

  } catch (error) {
    res.status(500).json({ error: 'Erreur interne du serveur' })
  }
}

//FONCTION QUI PERMET DE GERER LA ROUTE PUT DE L'OBJET BOOK
exports.modify = async (req, res, next) => {
  try {
    //vérifier que l'objet existe en base de données
    const book = await Book.findOne({ _id: req.params.id })
    if (!book) {
      return res.status(404).json({ error: 'Livre non trouvé' })
    }

    //vérifier que l'utilisateur a bien les droits
    if (book.userId !== req.auth.userId) {
      return res.status(403).json({ error: 'Non autorisé' })
    }

    //vérifier et adapter le format des données envoyées
    let bookObject = req.body.book ? JSON.parse(req.body.book) : { ...req.body }

    //supprimer le champ `_userId` car l'utilisateur n'a pas le droit de modifier cette information
    delete bookObject._userId

    //vérifier que tous les champs obligatoires sont renseignés
    const { title, author, year, genre } = bookObject
    if (!title || !author || !year || !genre) {
      return res.status(400).json({ error: 'Champs manquants : title, author, year et genre sont requis.' })
    }

    //supprimer l'ancienne image si une nouvelle est envoyée
    if (req.imageUrl && book.imageUrl) {
      const oldFilename = book.imageUrl.split('/images/')[1]
      fs.unlink(`images/${oldFilename}`, () => {})
      bookObject.imageUrl = req.imageUrl
    }

    //mettre à jour le livre en base de données
    await Book.updateOne({ _id: req.params.id }, { ...bookObject, _id: req.params.id })
    res.status(200).json({ message: 'Livre modifié avec succès' })

  } catch (error) {
    res.status(500).json({ error })
  }
}

//fonction qui permet de gérer la route DELETE de l'objet BOOK
exports.delete = (req, res, next) => {
  Book.findOne({ _id: req.params.id})
      .then(book => {
          if (book.userId != req.auth.userId) {
              res.status(401).json({message: 'Not authorized'})
          } else {
              const filename = book.imageUrl.split('/images/')[1]
              fs.unlink(`images/${filename}`, () => {
                  Book.deleteOne({_id: req.params.id})
                      .then(() => { res.status(200).json({message: 'Objet supprimé !'})})
                      .catch(error => res.status(401).json({ error }))
              });
          }
      })
      .catch( error => {
          res.status(500).json({ error })
      })
}

//fonction qui permet de gérer la route GET (one) de l'objet BOOK
exports.getOne = (req, res, next) => {
    Book.findOne({ _id: req.params.id })
      .then(book => res.status(200).json(book))
      .catch(error => res.status(404).json({ error }))
}

//fonction qui permet de gérer la route GET (all) de l'objet BOOK
exports.getAll = (req, res, next) => {
    // Retourne la liste complète des livres en BDD
    Book.find()
      .then(books => res.status(200).json(books))
      .catch(error => res.status(400).json({ error }))
}

exports.rate = async (req, res, next) => {
  try {
    //récupérer la note envoyée dans le corps de la requête
    const { rating } = req.body
    //vérifier que la note est bien un nombre entre 0 et 5
    if (rating === undefined || typeof rating !== 'number' || rating < 0 || rating > 5) {
      return res.status(400).json({ error: "La note doit être un nombre entre 0 et 5." })
    }

    //récupérer le livre à noter en utilisant l'ID passé dans l'URL
    const book = await Book.findOne({ _id: req.params.id })
    if (!book) {
      return res.status(404).json({ error: "Livre non trouvé." })
    }

    const userId = req.auth.userId
    //vérifiez que l'utilisateur n'a pas déjà noté ce livre
    const alreadyRated = book.ratings.some(r => r.userId === userId)
    if (alreadyRated) {
      return res.status(400).json({ error: "Vous avez déjà noté ce livre." })
    }

    //ajoutez la nouvelle note dans le tableau "ratings"
    book.ratings.push({ userId, grade: rating })

    //mettre à jour la note moyenne
    const sum = book.ratings.reduce((acc, curr) => acc + curr.grade, 0)
    book.averageRating = sum / book.ratings.length

    //sauvegarder le livre mis à jour et le renvoyer dans la réponse
    const updatedBook = await book.save()
    res.status(200).json(updatedBook)
  } catch (error) {
    res.status(500).json({ error })
  }
}

exports.getBestRated = (req, res, next) => {
  Book.find()  
    .sort({ averageRating: -1 }) //trie par note moyenne décroissante
    .limit(3)                   //limite le résultat aux 3 premiers livres
    .then(books => res.status(200).json(books))
    .catch(error => res.status(400).json({ error }))
}