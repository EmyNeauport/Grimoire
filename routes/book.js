//contient la logique de routing
const express = require('express');

//créer un router express
const router = express.Router();
const auth = require('../middleware/auth');
const multer = require('../images/multer-config');
const bookCtrl = require('../controllers/book')

router.post('/', auth, multer, bookCtrl.createBook);
router.put('/:id', auth, multer, bookCtrl.modifyBook);
router.delete('/:id', auth, bookCtrl.deleteBook);
router.get('/bestrating', bookCtrl.getBestRatedBooks);
router.get('/:id', bookCtrl.getOneBook);
router.get('/', bookCtrl.getAllBooks);
router.post('/:id/rating', auth, bookCtrl.rateBook);

module.exports = router;