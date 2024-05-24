const express = require('express');
const bodyParser = require('body-parser');
const mongoose = require('mongoose');
const cors = require('cors');

const app = express();
const port = 3000;

// Middleware
app.use(bodyParser.json());
app.use(cors());

// Connect to MongoDB
mongoose.connect('mongodb://localhost:27017/attiq', { useNewUrlParser: true, useUnifiedTopology: true })
  .then(() => console.log('MongoDB connected'))
  .catch(err => console.log(err));

// Define a schema and model for the data
const sellSchema = new mongoose.Schema({
  inscriptionId: String,
  height: String,
  contentType: String,
  inscriptionNumber: String,
  address: String,
  price: String,
  feeRate: String
});

const Sell = mongoose.model('bts', sellSchema);

// Route to handle data storage
app.post('/publish', async (req, res) => {
  const sellData = new Sell(req.body);

  try {
    await sellData.save();
    res.status(201).send('Data saved successfully');
  } catch (error) {
    res.status(400).send('Error saving data: ' + error.message);
  }
});

// Route to fetch all documents
app.get('/documents', async (req, res) => {
  try {
    const documents = await Sell.find({});
    res.status(200).json(documents);
  } catch (error) {
    res.status(500).send('Error fetching documents: ' + error.message);
  }
});

app.listen(port, () => {
  console.log(`Server running on http://localhost:${port}`);
});
