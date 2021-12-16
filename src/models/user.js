import mongoose from 'mongoose'
import validator from 'validator'
import bcrypt from 'bcryptjs'
import jwt from 'jsonwebtoken'
import Task from './task.js'

//using Schema to enable "Middleware"
const userSchema = new mongoose.Schema({
    name: {
        type: String,
        required: true,
        trim: true
    },
    email: {
        type: String,
        //ensuring that email is unique (since its use to login) 
        //[you need to re-create the "collection" for this to take place]
        unique: true,
        required: true,
        trim: true,
        lowercase: true,
        validator(value) {
            if (!validator.isEmail(value)) throw new Error('Email is invalid')
        }
    },
    password: {
        type: String,
        required: true,
        trim: true,
        minlength: '7',
        validate(value) {
            if (value.toLowerCase().includes('password')) throw new Error('Password cannot contain "password"')
        }
    },
    age: {
        type: Number,
        default: 0,
        validate(value) {
            if (value < 0) {
                throw new Error('Age must be a positive number')
            }
        }
    },
    //token to contain all of the user tokens (an array, because they can log-in from multiple devices)
    tokens: [{
        //this way, we have an array of objects, each object contains a token ( "tokens[{token},{token}]" )
        token: {
            type: String,
            required: true
        }
    }],
    avatar: {// to render the binary data in HTML: <img src="data:image/jpg;base64, <avatar-data> ">
        type: Buffer, //buffer will contain binary data, in our case, the profile picture (can also be files)
    }
}, {// adding an "Optional Object", as a second argument
    timestamps: true // adds "createdAt" and "updatedAt" fields, which are automatic
})

//this is a "virtual" reference (it is not stored in the data-base)
//it is just for mongoose to figure out who owns what, setting how they are related
userSchema.virtual('tasks', {
    ref: 'Task',//the name of the "Model"
    localField: '_id',//the "type" of the field which the "ref" attribute is located on the Task "Model" (the Task "owner" field "value" is the "User" "_id" field) 
    foreignField: 'owner'//the "name" (key) of the field which the "ref" attribute is located on the Task "Model"
})

//not using Asynchronous functions, so we don't need the "async" keyword
//"toJSON" is a keyword which is called, when sending the user through a "res.send(user)"
//"JSON.stringify()" function, calls the "toJSON" funcion of the object in the argument
userSchema.methods.toJSON = function () {
    const user = this

    //returns the an object with the user fields
    const userObject = user.toObject()

    //removing password, tokens and avatar from userObject
    delete userObject.password
    delete userObject.tokens
    delete userObject.avatar //this file is very large (up to 1MB in our application)

    return userObject
}

//"method" functions are accessible through the "Model" instance
//"method" functions CONTAIN this [this.email etc...]
//since we are using "this" in the function, we cannot use the "arrow" syntax
userSchema.methods.generateAuthToken = async function () {
    const user = this
    const token = jwt.sign({ _id: user._id.toString() }, 'secret')

    //adding the token to the user tokens, and then saving it
    user.tokens = user.tokens.concat({ token })
    await user.save()

    return token
}

//"static" functions are accessible through the "Model" object
//"static" functions DO NOT contain this [they contain "this" but not this.email etc...]
//using "<schema>.statics.<function> = <function>"" will create a new function for us to use from the User Model
userSchema.statics.findByCredentials = async (email, password) => {
    const user = await User.findOne({ email })

    if (!user) throw new Error('Unable to login')

    //user.password, is the "hashed" password
    const match = await bcrypt.compare(password, user.password)

    //its better to generalize the errors regarding to login (to reduce hacking chances)
    if (!match) throw new Error('Unable to login')

    return user
}


//here we need to create a normal function, because we are using the "this" keyword
//adding actions to "pre-saving", this case, hashing the plain text password before saving
userSchema.pre('save', async function (next) {
    //in Middleware, "this" will refer to the user fields (fields in the schema)
    const user = this

    //"isModified()" returns true, if the user is first created
    //and true if the user is being updated, and "password" is being changed
    if (user.isModified('password')) {
        //this will ensure the password is hashed, if it is not (you're not allowed to "hash()" a hashed password)
        user.password = await bcrypt.hash(user.password, 8)
    }

    //"next()" tells the Middleware, that the function is done (needed cause of Aynchronous functions)
    next()
})

// Delete user tasks when user is removed with Middleware
userSchema.pre('remove', async function (next) {
    const user = this

    //whenever a user is removed, all of his tasks will be deleted aswell
    await Task.deleteMany({ owner: user._id })

    next()
})

const User = mongoose.model('User', userSchema)

//exporting user as default
export default User