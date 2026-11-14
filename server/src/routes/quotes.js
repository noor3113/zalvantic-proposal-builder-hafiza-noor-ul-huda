const express = require('express');
const mongoose = require('mongoose');
const Quote = require('../models/Quote');
const { steps } = require('../validation/quote');

const router = express.Router();

function badId(res) {
  return res.status(400).json({ error: 'Invalid id' });
}

// Start a new draft
router.post('/', async (req, res) => {
  try {
    const quote = await Quote.create({});
    res.status(201).json(quote);
  } catch (err) {
    res.status(500).json({ error: 'Server error' });
  }
});

// List quotes (so a draft can be resumed)
router.get('/', async (req, res) => {
  try {
    const quotes = await Quote.find().sort({ updatedAt: -1 });
    res.json(quotes);
  } catch (err) {
    res.status(500).json({ error: 'Server error' });
  }
});

// Get one quote
router.get('/:id', async (req, res) => {
  if (!mongoose.isValidObjectId(req.params.id)) return badId(res);
  try {
    const quote = await Quote.findById(req.params.id);
    if (!quote) return res.status(404).json({ error: 'Not found' });
    res.json(quote);
  } catch (err) {
    res.status(500).json({ error: 'Server error' });
  }
});

// Save one step (validated with Zod)
router.put('/:id/steps/:n', async (req, res) => {
  if (!mongoose.isValidObjectId(req.params.id)) return badId(res);
  const n = Number(req.params.n);
  const schema = steps[n];
  if (!schema) return res.status(400).json({ error: 'Unknown step' });

  const result = schema.safeParse(req.body);
  if (!result.success) {
    return res.status(400).json({
      error: 'Validation failed',
      issues: result.error.issues.map((i) => ({
        path: i.path.join('.'),
        message: i.message,
      })),
    });
  }

  try {
    const quote = await Quote.findById(req.params.id);
    if (!quote) return res.status(404).json({ error: 'Not found' });
    if (quote.status === 'submitted') {
      return res.status(409).json({ error: 'Quote already submitted' });
    }
    Object.assign(quote, result.data);
    quote.currentStep = Math.min(4, Math.max(quote.currentStep, n + 1));
    await quote.save();
    res.json(quote);
  } catch (err) {
    res.status(500).json({ error: 'Server error' });
  }
});

// Final submit: re-check all 3 steps
router.post('/:id/submit', async (req, res) => {
  if (!mongoose.isValidObjectId(req.params.id)) return badId(res);
  try {
    const quote = await Quote.findById(req.params.id);
    if (!quote) return res.status(404).json({ error: 'Not found' });
    if (quote.status === 'submitted') {
      return res.status(409).json({ error: 'Quote already submitted' });
    }
    const plain = JSON.parse(JSON.stringify(quote.toObject()));
    for (const n of [1, 2, 3]) {
      const check = steps[n].safeParse(plain);
      if (!check.success) {
        return res.status(400).json({
          error: `Step ${n} is incomplete`,
          issues: check.error.issues.map((i) => ({
            path: i.path.join('.'),
            message: i.message,
          })),
        });
      }
    }
    quote.status = 'submitted';
    await quote.save();
    res.json(quote);
  } catch (err) {
    res.status(500).json({ error: 'Server error' });
  }
});

module.exports = router;