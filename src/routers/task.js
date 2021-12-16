import express from 'express'
import Task from '../models/task.js'
import auth from '../middleware/auth.js'

const router = new express.Router()

router.post('/tasks', auth, async (req, res) => {
    const task = new Task({
        ...req.body, // copies all the properties from the "req.body" object
        owner: req.user._id // the id of the logged in user
    })

    try {
        task.save()
        return res.status(201).send(task)
    } catch (error) {
        return res.status(400).send({ error: error.message })
    }
})

router.get('/tasks', auth, async (req, res) => {
    const match = {}
    const sort = {}

    // "if" will enable us to find ALL documents if wanted
    if (req.query.completed) {
        //all Route queries return a String, so a conversion is needed (also returns false, if its "undefined")
        match.completed = req.query.completed === 'true'
    }

    // when inserting default value, you need to do the "||" operator and NOT the "=" operator ( "=" operator is ONLY for parameters)
    // finding description that includes the inserted string
    match.description = { "$regex": req.query.includes || '' }

    if (req.query.sort_by) {
        //splitting the sort-by object into two strings, based on the delimiter
        const parts = req.query.sort_by.split(':')

        //setting sort.<field>=<-1/1>
        sort[parts[0]] = parts[1] === 'desc' ? -1 : 1
    }

    try {
        await req.user.populate({
            path: 'tasks',// what field to populate (this case its a "virtual" field named "tasks")
            match,// match is the "Option Object" to filter what documents to get based on their "field" (like in the ".find()" function)
            options: {// another Extra "Option Object" that has special filters, that are not directly related to the "document"
                limit: parseInt(req.query.limit),//how many documents to populate (2=the list will contain UP to 2 document)
                skip: parseInt(req.query.skip),//how many documents to skip from (0=don't skip, 2=skip the first two)
                sort//object used for sorting [sort: {<field>:<1/-1>}] (-1 = descending, 1 = ascending)
            }
        }).execPopulate()

        return res.send(req.user.tasks)
    } catch (error) {
        return res.status(500).send({ error: error.message })
    }
})

router.get('/tasks/:id', auth, async (req, res) => {
    const _id = req.params.id

    try {
        // ensuring that only the owner of the task, can get the task
        const task = await Task.findOne({ _id, owner: req.user._id })

        if (!task) return res.status(404).send('Task with the ID:"' + _id + '" was not found')
        return res.send(task)
    } catch (error) {
        return res.status(500).send({ error: error.message })
    }
})

router.patch('/tasks/:id', auth, async (req, res) => {
    const updates = Object.keys(req.body)
    const allowedUpdates = ['description', 'completed']
    const isValidOperation = updates.every((update) => allowedUpdates.includes(update))

    if (!isValidOperation) {
        return res.status(400).send('Invalid update properties!')
    }

    try {
        const task = await Task.findOne({ _id: req.params.id, owner: req.user._id })

        if (!task) return res.status(404).send('Task with the ID:"' + req.params.id + '" was not found')

        updates.forEach((update) => task[update] = req.body[update])
        return res.send(await task.save())
    } catch (error) {
        return res.status(400).send({ error: error.message })
    }
})

router.delete('/tasks/:id', auth, async (req, res) => {
    try {
        const task = await Task.findOne({ _id: req.params.id, owner: req.user._id })

        if (!task) return res.status(404).send('Task with the ID:"' + req.params.id + '" was not found')

        task.delete()
        return res.send(task)
    } catch (error) {
        return res.status(500).send({ error: error.message })
    }
})

export default router