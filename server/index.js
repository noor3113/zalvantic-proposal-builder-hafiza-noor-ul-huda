const dns = require('dns');
dns.setServers(['8.8.8.8', '1.1.1.1']);

require('dotenv').config();
const express = require('express');
const mongoose = require('mongoose');
const crudRouter = require('./src/routes/crud');
const Package = require('./src/models/Package');
const AddOn = require('./src/models/AddOn');

const app = express();
app.use(express.json());

app.get('/', (req, res) => {
  res.send('Server is running');
});

app.use('/api/packages', crudRouter(Package));
app.use('/api/addons', crudRouter(AddOn));

const PORT = 5000;

mongoose
  .connect(process.env.MONGODB_URI)
  .then(() => {
    console.log('MongoDB connected');
    app.listen(PORT, () => {
      console.log(`Server running on port ${PORT}`);
    });
  })
  .catch((err) => {
    console.error('MongoDB connection error:', err.message);
  });