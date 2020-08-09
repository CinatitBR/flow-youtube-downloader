const express = require('express')
const bodyParser = require('body-parser')
const router = require('./routes')
const cors = require('cors')

const app = express()
const corsOptions = { origin: 'http://localhost:3000' }

app.use(router)
app.use(bodyParser.urlencoded({ extended: true }))
app.use(cors(corsOptions))

const PORT = process.env.PORT || 5000

app.listen(PORT, () => {
  console.log(`Server is running at localhost:${PORT}`)
})
