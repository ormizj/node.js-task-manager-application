import mongoose from 'mongoose'

mongoose.connect(process.env.MONGODB_URL, {
    useNewUrlParser: true,
    useCreateIndex: true,
    useFindAndModify: false //setting this to false, so mongoose doesn't use the MongoDB deprecated function
})
