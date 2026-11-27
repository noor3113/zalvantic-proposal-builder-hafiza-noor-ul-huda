const express = require('express');
const Template = require('../models/Template');

const router = express.Router();

// List templates
router.get('/', async (req, res) => {
  try {
    res.json(await Template.find().sort({ name: 1 }));
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error' });
  }
});

module.exports = router;