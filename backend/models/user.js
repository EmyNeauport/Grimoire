const mongoose = require('mongoose')
const uniqueValidator = require('mongoose-unique-validator')

//méthode schéma du package mongoose :
//permet de créer un schéma de données pour la BDD MongoDB
const userSchema = mongoose.Schema({
    email : { type : String, required : true, unique: true },
    password : { type : String, required : true },
});

//valider l'unicité du mdp
userSchema.plugin(uniqueValidator)

//méthode model du package mongoose : 
//permet de transformer le modèle en un modèle utilisable
module.exports = mongoose.model('user', userSchema)