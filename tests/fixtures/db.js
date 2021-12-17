import jwt from 'jsonwebtoken'
import mongoose from 'mongoose'
import User from '../../src/models/user.js'
import Task from '../../src/models/task.js'

//file for creating the data-base

//creating an ObjectId for the user
export const userOneId = new mongoose.Types.ObjectId()
export const userOne = {
    _id: userOneId,
    name: 'Mike',
    email: 'mike@example.com',
    password: '56what!!',
    tokens: [{// generating a token for the user with his id
        token: jwt.sign({ _id: userOneId }, process.env.JWT_SECRET)
    }]
}

export const userTwoId = new mongoose.Types.ObjectId()
export const userTwo = {
    _id: userTwoId,
    name: 'Jess',
    email: 'jess@example.com',
    password: 'myhouse099@@',
    tokens: [{// generating a token for the user with his id
        token: jwt.sign({ _id: userOneId }, process.env.JWT_SECRET)
    }]
}

export const taskOne = {
    _id: new mongoose.Types.ObjectId(),
    description: 'First task',
    completed: false,
    owner: userOneId
}

export const taskTwo = {
    _id: new mongoose.Types.ObjectId(),
    description: 'Second task',
    completed: true,
    owner: userOneId
}

export const taskThree = {
    _id: new mongoose.Types.ObjectId(),
    description: 'Third task',
    completed: true,
    owner: userTwoId
}

export const setupDatabase = async () => {
    await User.deleteMany() //deleting every user
    await Task.deleteMany() //deleting every task
    await new User(userOne).save()
    await new User(userTwo).save()
    await new Task(taskOne).save()
    await new Task(taskTwo).save()
    await new Task(taskThree).save()
}

export default {
    userOneId,
    userOne,
    userTwoId,
    userTwo,
    taskOne,
    taskTwo,
    taskThree,
    setupDatabase
}