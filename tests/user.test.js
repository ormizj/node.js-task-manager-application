import request from 'supertest'
import app from '../src/app.js'
import User from '../src/models/user.js'
import { userOneId, userOne, setupDatabase } from './fixtures/db.js'

//"Jest" function, runs before every "test()" function [there is also "afterEach()"]
//NOTE: there is also "beforeAll()" and "afterAll()"
beforeEach(setupDatabase)

test('Should signup new user', async () => {
    //using "SuperTest" to help testing with "Jest"
    //saving the "request()" response, into a variable for further testing
    const response = await request(app).post('/users').send({
        name: 'Test',
        email: 'test@example.com',
        password: 'MyPass777!'
    }).expect(201)

    //Assert that the data-base was changed correctly
    const user = await User.findById(response.body.user._id)
    expect(user).not.toBeNull()//reversing expect

    //Assertions about the response (ensuring that the response contains the values we want)
    //if you want the objects to be identical, use the ".toEqual()" function
    expect(response.body).toMatchObject({
        //needs to be contain these values (if it contains more values, it is fine)
        user: {
            name: 'Test',
            email: 'test@example.com'
        },
        token: user.tokens[0].token
    })

    //ensuring the password is not in plain text
    expect(user.password).not.toBe('MyPass777!')
})

test('Should Login existing user', async () => {
    const response = await request(app).post('/users/login').send({
        email: userOne.email,
        password: userOne.password
    }).expect(200)

    //checking that the user has the new token from the login
    const user = await User.findById(userOneId)
    expect(response.body.token).toBe(user.tokens[1].token)
})

test('Should not login nonexistent user', async () => {
    await request(app).post('/users/login').send({
        email: "fake@example.com",
        password: "notapass"
    }).expect(400)
})

test('Should get profile for user', async () => {
    await request(app).get('/users/profile')
        //setting Header for the request
        .set({
            'Authorization': `Bearer ${userOne.tokens[0].token}`
        }).send()
        .expect(200)
})

test('Should not get profile for unauthenticated user', async () => {
    await request(app).get('/users/profile')
        .send()
        .expect(401)
})

test('Should delete user account', async () => {
    await request(app).delete('/users/profile')
        .set({
            'Authorization': `Bearer ${userOne.tokens[0].token}`
        }).send()
        .expect(200)
    const user = await User.findById(userOne._id)
    expect(user).toBeNull()
})

test('Should not delete user account for unauthenticated user', async () => {
    await request(app).delete('/users/profile')
        .send()
        .expect(401)
})

test('Should upload avatar image', async () => {
    await request(app).post('/users/profile/avatar')
        .set({ "Authorization": `Bearer ${userOne.tokens[0].token}` })
        //attaching the profile picture to the request (<key>, <value>)
        .attach('avatar', 'tests/fixtures/assets/profile-pic.jpg')
        .expect(200)
    const user = await User.findById(userOneId)
    expect(user.avatar).toEqual(expect.any(Buffer))// checking the type of the "user.avatar"
})

test('Should update valid user fields', async () => {
    await request(app).patch('/users/profile')
        .set({ "Authorization": `Bearer ${userOne.tokens[0].token}` })
        .send({ name: 'Mike was here', })
        .expect(200)
    const user = await User.findById(userOneId)
    expect(user.name).toEqual('Mike was here')// "toEqual()" also works as a replacement for "toBe()" ["toEqual()" should be your go to]
})

test('Should not update invalid user fields', async () => {
    await request(app).patch('/users/profile')
        .set({ "Authorization": `Bearer ${userOne.tokens[0].token}` })
        .send({ location: 'invalid', })
        .expect(400)
})