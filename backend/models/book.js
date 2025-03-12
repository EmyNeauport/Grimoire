const mongoose = require('mongoose')

//méthode schéma du package mongoose :
//permet de créer un schéma de données pour la BDD MongoDB
const bookSchema = mongoose.Schema({
    userId : { type : String, required : true },
    title : { type : String, required : true },
    author : { type : String, required : true },
    imageUrl : { type : String, required : true},
    year : { type : Number, required : true },
    genre : { type : String, required : true },
    ratings : 
        [{
            userId : { type : String, required : true },
            grade : { type : Number, required : true },
        }],
    averageRating : { type : Number, required : true },
})

//méthode model du package mongoose : 
//permet de transformer le modèle en un modèle utilisable
module.exports = mongoose.model('book', bookSchema)