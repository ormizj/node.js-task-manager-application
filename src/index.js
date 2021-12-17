import app from './app.js'

//index.js used for deploying the application on a server

const port = process.env.PORT

app.listen(port, () => console.log('Server is up on port ' + port))