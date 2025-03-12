const jwt = require('jsonwebtoken')

module.exports = (req, res, next) => {
    try {
        //récupérer le token
        const token = req.headers.authorization.split(' ')[1]
        //décoder le token
        const decodedToken = jwt.verify(token, 'RANDOM_TOKEN_SECRET')
        //récupérer l'id associé au token décodé
        const userId = decodedToken.userId
        //ajouter l'id à l'objet req qui sera transmis aux routes par la suite
        req.auth = {
            userId: userId
        }
        next ()
    } catch(error) {
        res.status(401).json({ error })
    }
}