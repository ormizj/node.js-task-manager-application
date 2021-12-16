import express from 'express'
import './db/mongoose.js'
import taskRouter from './routers/task.js'
import userRouter from './routers/user.js'

const app = express()
const port = process.env.PORT //using the port from the "config/dev.env" file

// maintnance mode (this is Middleware for the entire application, not just 1 route)
const maintnance = false
app.use((req, res, next) => {
    if (maintnance) return res.status(503).send("The site is under maintenance, please try again soon!")
    next()
})


app.use(express.json())

//importing the "user" and "task" routers
app.use(userRouter)
app.use(taskRouter)

app.listen(port, () => console.log('Server is up on port ' + port))

