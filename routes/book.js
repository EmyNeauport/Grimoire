//contient la logique de routing
const express = require('express');
const auth = require('../middleware/auth');
//créer un router express
const router = express.Router();
const multer = require('multer');
const bookCtrl = require('../controllers/book')

const upload = multer({ dest: 'uploads/' });

router.post('/', auth, upload.single('image'), bookCtrl.createBook);
router.put('/:id', auth, bookCtrl.modifyBook);
router.delete('/:id', auth, bookCtrl.deleteBook);
router.get('/:id', bookCtrl.getOneBook);
router.get('/', bookCtrl.getAllBooks);

module.exports = router;