import mongoose from 'mongoose'

const taskSchema = new mongoose.Schema({
    description: {
        type: String,
        required: true,
        trim: true
    }, completed: {
        type: Boolean,
        default: false
    }, owner: {
        // declaring that the type of the object, is an "ObjectID"
        type: mongoose.Schema.Types.ObjectId,
        required: true,
        ref: 'User'//setting reference to an existing "Model" in the data-base (using its "Model" name)
    }
}, {
    timestamps: true
})

const Task = mongoose.model('Task', taskSchema)

export default Task