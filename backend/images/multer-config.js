const multer = require('multer');

// 🚀 Utilisez memoryStorage pour stocker le fichier en mémoire (vous aurez accès à req.file.buffer)
const storage = multer.memoryStorage();

module.exports = multer({ storage }).single('image');
