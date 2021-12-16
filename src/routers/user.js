import express from 'express'
import User from '../models/user.js'
import auth from '../middleware/auth.js'
import multer from 'multer'
import sharp from 'sharp'
import { sendWelcomeEmail, sendGoodbyeEmail } from '../emails/account.js'

const router = new express.Router()
const uploadAvatar = multer({//better to create this variable, at a "Upload" folder, and import it
    //NOTE: when there is no "dest:" value in multer, the Middleware, will pass on the file information to the Router [in "req.file"]
    limits: {
        fileSize: 1048576,
    }, fileFilter(req, file, cb) {

        // if the file is does not end with ".doc" or ".docx"
        if (!file.originalname.match(/\.(jpg|jpeg|png)$/)) {
            return cb(new Error('Please upload a Picture'))
        }

        cb(undefined, true)
    }
});

router.post('/users', async (req, res) => {
    const user = new User(req.body)

    try {
        //since if the Promise fails, it throws an exception, so you can "catch" it
        //NOTE: when you "save()" the user, it actually changes the "user" object AND returns it (so you don't need to do "user=await user.save()")
        await user.save()

        //note, this is an async function (returns a promise)
        sendWelcomeEmail(user.email, user.name)

        //generating token for the new user (so he doesn't have to login, after creating it)
        const token = await user.generateAuthToken()

        return res.status(201).send({ user, token })
    } catch (error) {
        return res.status(400).send({ error: error.message })
    }
})

router.post('/users/login', async (req, res) => {
    try {
        //this is a created function at the User Model
        const user = await User.findByCredentials(req.body.email, req.body.password)

        //generating a token for the user (using the instance and not the class, to gain access to his "fields")
        const token = await user.generateAuthToken()

        //sending back the user, and his token
        return res.send({ user, token })
    } catch (error) {
        return res.status(400).send({ error: error.message })
    }
})

router.post('/users/logout', auth, async (req, res) => {
    try {
        //removing the token that was used with the "auth" middleman (the current one that the user is logged in with)
        req.user.tokens = req.user.tokens.filter((token) => req.token !== token.token)//token is Sub-Document (object)

        //saving the new tokens list
        await req.user.save()

        return res.send()
    } catch (error) {
        return res.status(500).send({ error: error.message })
    }
})

router.post('/users/logout-all', auth, async (req, res) => {
    try {
        //removing all the tokens from the user
        req.user.tokens = []

        //saving the empty token list (so it will be updated)
        await req.user.save()

        return res.send()
    } catch (error) {
        return res.status(500).send({ error: error.message })
    }
})

//an example of adding Middleware to a "Route"
router.get('/users/profile', auth, async (req, res) => {
    return res.send(req.user)
})

//"patch()" http method, is design for updating an existing resource
router.patch('/users/profile', auth, async (req, res) => {
    //"mongoose" update function, allows inputs of non-existing fields (they will be ignored)
    //we need to restrict the fields manually
    const updates = Object.keys(req.body) //this returns an Array of Strings
    const allowedUpdates = ['name', 'email', 'password', 'age']

    //every() returns false, if not EVERY return from the Callback is true
    const isValidOperation = updates.every((update) => allowedUpdates.includes(update))

    //error if the "every()" function is not successful
    if (!isValidOperation) return res.status(400).send({ error: 'Invalid update properties!' })

    try {
        updates.forEach((update) => req.user[update] = req.body[update])// updating fields
        return res.send(await req.user.save())  // saving the update and returning the user
    } catch (error) {
        //not taking server error to account, right now
        return res.status(400).send({ error: error.message })
    }
})

router.delete('/users/profile', auth, async (req, res) => {
    try {
        //"remove()" is also a function, which deletes the current "document"
        await req.user.remove()

        sendGoodbyeEmail(req.user.email, req.user.name)

        return res.send(req.user)
    } catch (error) {
        return res.status(500).send({ error: error.message })
    }
})

//adding the "auth" Middleware (NOTE: the callbacks are not called by argument location, but by parameters)
router.post('/users/profile/avatar', auth, uploadAvatar.single('avatar'), async (req, res) => {

    //"req.file.buffer" contains the file binary data (requires "multer" to have no "dest:" key)
    //using "sharp" to modify the file, and then turning it into binary
    const buffer = await sharp(req.file.buffer).resize({ width: 250, height: 250 }).png().toBuffer()

    req.user.avatar = buffer

    try {
        await req.user.save() // saving the profile picture, to the MongoDB server
        return res.send('Success')
    } catch (error) {
        return res.status(500).send({ error: error.message })
    }
}, (error, req, res, next) => {
    res.status(400).send({ error: error.message })
})

router.delete('/users/profile/avatar', auth, async (req, res) => {
    try {
        //removing the avatar from the user
        req.user.avatar = undefined //NOTE: to remove a "field" from a "document", set the field to "undefined" and save the document
        await req.user.save() //saving the user
        return res.send('Success')
    } catch (error) {
        return res.status(500).send({ error: error.message })
    }
})

//you get the image into html through the url
router.get('/users/avatar/:id', async (req, res) => {
    try {
        const user = await User.findById(req.params.id)

        if (!user || !user.avatar) {
            throw new Error('User or avatar not found')
        }

        //the "res.set()" function, sets the header that will be used in the "respond.send()" function
        //first argument = key of the respond header (usually "Content-Type")
        //second argument = the value of the type (when we send JSON back, it automatically sets the "Content-Type" = "application/json")
        res.set('Content-Type', 'image/jpg')
        res.send(user.avatar)
    } catch (error) {
        return res.status(404).send({ error: error.message })
    }
})

export default router