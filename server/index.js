const dns = require('dns');
dns.setServers(['8.8.8.8', '1.1.1.1']);

require('dotenv').config();
const express = require('express');
const cors = require('cors');
const mongoose = require('mongoose');
const crudRouter = require('./src/routes/crud');
const Package = require('./src/models/Package');
const AddOn = require('./src/models/AddOn');
const authRouter = require('./src/routes/auth');
const { adminWrites, requireAuth, requireAdmin } = require('./src/middleware/auth');
const quotesRouter = require('./src/routes/quotes');

const app = express();
app.use(express.json());
app.use(cors());

app.get('/', (req, res) => {
  res.send('Server is running');
});

app.use('/api/auth', authRouter);
app.use('/api/packages', adminWrites, crudRouter(Package));
app.use('/api/addons', adminWrites, crudRouter(AddOn));
app.use('/api/quotes', requireAuth, requireAdmin, quotesRouter);

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