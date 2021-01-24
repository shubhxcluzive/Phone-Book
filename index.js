const express = require('express')
const app = express();
const mongoose = require('mongoose')
const uniqueValidator = require('mongoose-unique-validator')
const mongoosePaginate = require("mongoose-paginate-v2");
require('dotenv').config()
const dbUrl = process.env.MONGODB_URI
app.use(express.json())

//DB Connect

mongoose.connect(dbUrl, {
  useNewUrlParser: true,
  useUnifiedTopology: true
}).then(() => {
  console.log('connected to MongoDB')
}).catch(err => {
  console.log(err)
})

const phonebookSchema = new mongoose.Schema({
  name: { type: String, unique: true, required: true},
  number: { type: String, minlength: 10},
  email: {type: String, required: true, match: [/^\w+([\.-]?\w+)*@\w+([\.-]?\w+)*(\.\w{2,3})+$/, 'Please fill a valid email address']}
})

phonebookSchema.plugin(mongoosePaginate)

phonebookSchema.plugin(uniqueValidator)

phonebookSchema.set('toJSON', {
  transform: (document, returnedObject) => {
    returnedObject.id = returnedObject._id.toString()
    delete returnedObject._id
    delete returnedObject.__v
  }
})

const Phonebook = mongoose.model('Phonebook', phonebookSchema);

app.get('/api/persons', (req, res) => {
  let offset = parseInt(req.query.page || 0);
  if (offset > 0) {
    offset--;
  }
  Phonebook.paginate({}, {offset: ((offset) * 10), limit: 10})
    .then(result =>{
      res.json(result.docs);
    })
})

app.get('/api/persons/:id', (req, res) => {
  const id = req.params.id
  Phonebook.findById(id)
    .then(person => {
      if(person){
        res.json(person)
      }
      else{
        res.status(404).end()
      }
    })
    .catch(err => {
      res.status(400).send(err.message)
      console.error(err);
    })
})

app.delete('/api/persons/:id', (req, res) => {
  const id = req.params.id
  Phonebook.findByIdAndRemove(id)
    .then(() => {
      res.status(204).send({message: "deleted"})
    })
    .catch(err => {
      res.status(400).send(err.message)
      console.error(err)
    })
})

app.put('/api/persons/:id', (req, res) => {
  const body = req.body
  const id = req.params.id
  const person = {
    number: body.number
  }

  Phonebook.findByIdAndUpdate(id, person, { new: true })
    .then(updatedContact => {
      res.json(updatedContact)
    })
    .catch(err =>{
      res.status(400).send(err.message)
       console.error(err)
     })
})

app.post('/api/persons', (req, res) => {
  const body = req.body
  if(!(body.name && body.number)){
    return res.status(400).json({
      error: 'Content Missing'
    })
  }
  const person = new Phonebook({
    ...body
  })

  person.save()
    .then(savedPerson => {
      res.json(savedPerson)
    })
    .catch(err => {
      res.status(400).send(err.message)
      console.log(err);
    })
})


const PORT = process.env.PORT || 3001

app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`)
})
