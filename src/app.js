import express from 'express'
import './db/mongoose.js'
import taskRouter from './routers/task.js'
import userRouter from './routers/user.js'

//using app.js to seperate the "app.listen()" to a different file
//NOTE: you DONT want to run "app.listen()" when running "Jest" testing

const app = express()

const maintnance = false
app.use((req, res, next) => {
    if (maintnance) return res.status(503).send("The site is under maintenance, please try again soon!")
    next()
})

app.use(express.json())
app.use(userRouter)
app.use(taskRouter)

export default app