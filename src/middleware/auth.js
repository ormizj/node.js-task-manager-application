import jwt from 'jsonwebtoken'
import User from '../models/user.js'


const auth = async (req, res, next) => {
    try {
        // extracting the "Authorization" value from the header (and removing the "Bearer " word)
        const token = req.header('Authorization').replace('Bearer ', '')

        //verifying that the token is valid, and extracting the, data from it (the body of the token)
        const decoded = jwt.verify(token, process.env.JWT_SECRET)

        //checking if the user with the valid token, actually contains the token in the data-base
        const user = await User.findOne({ _id: decoded._id, 'tokens.token': token })

        // error, if token is valid BUT the user does not contain the token
        //(the user never logged in to recieve that token)
        if (!user) throw new Error()

        //adding the user to the request
        //so further Route functions, can also use it, without going to the data-base again
        req.user = user

        //adding token to the request, so we will have access to it, in the next routes
        req.token = token

        //continuing to the next route
        next()
    } catch (error) {
        res.status(401).send({ error: 'Please authinticate.' })
    }
}

export default auth