//CONTIENT LA LOGIQUE DE ROUTING

//créer un router express
const express = require('express')
const router = express.Router()
const userCtrl = require('../controllers/user')

router.post('/signup', userCtrl.signup)
router.post('/login', userCtrl.login)

//exporter le router
module.exports = router
