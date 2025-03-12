//CONTIENT LA LOGIQUE DE ROUTING

//créer un router express
const express = require('express')
const router = express.Router()
const auth = require('../middleware/auth')
const { upload, processImage } = require('../middleware/multer-config')
const bookCtrl = require('../controllers/book')

router.post('/', auth, upload, processImage, bookCtrl.create)
router.put('/:id', auth, upload, processImage, bookCtrl.modify)
router.delete('/:id', auth, bookCtrl.delete)
router.get('/bestrating', bookCtrl.getBestRated)
router.get('/:id', bookCtrl.getOne)
router.get('/', bookCtrl.getAll)
router.post('/:id/rating', auth, bookCtrl.rate)

//exporter le router
module.exports = router