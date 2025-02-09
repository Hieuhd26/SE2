const express = require('express')
const app = express()

const multer  = require('multer')
const upload = multer({ dest: './uploads/' })

app.post('/photos/upload', upload.array('photos', 12), function (req, res, next) {
    // req.files is array of `photos` files
    // req.body will contain the text fields, if there were any
  })