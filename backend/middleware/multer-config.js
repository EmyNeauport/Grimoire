const multer = require('multer')
const sharp = require('sharp')
const fs = require('fs')

//stocker temporairement en mémoire
const storage = multer.memoryStorage()
const upload = multer({ storage }).single('image')

//traiter et enregistrer l’image
const processImage = async (req, res, next) => {
    if (!req.file) return next()
    try {
        //vérifier que le dossier /images existe
        if (!fs.existsSync('./images')) {
            fs.mkdirSync('./images')
        }
        // générer un nom unique pour l'image
        const timestamp = Date.now();
        const fileName = `${timestamp}-${req.file.originalname.split(' ').join('_')}.webp`
        //convertir et optimiser l'image avec sharp
        await sharp(req.file.buffer)
            .resize(200, 250, { fit: 'inside' }) //redimensionnement
            .webp({ quality: 90 }) //compression
            .sharpen()
            .toFile(`./images/${fileName}`)
        //ajouter l’URL de l’image dans `req.imageUrl`
        req.imageUrl = `${req.protocol}://${req.get('host')}/images/${fileName}`
        next()
    } catch (error) {
        res.status(500).json({ error: 'Erreur lors du traitement de l’image' })
    }
}

//exporter les middlewares `upload` et `processImage`
module.exports = { upload, processImage }
