const mongoose = require('mongoose');

const userSchema = mongoose.Schema({
    email : { type : String, required : true, unique: true },
    password : { type : String, required : true },
});

// //deux utilisateurs ne peuvent pas partager la même adresse mail
// userSchema.plugin(uniqueValidator);

module.exports = mongoose.model('user', userSchema);