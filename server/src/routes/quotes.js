const express = require('express');
const mongoose = require('mongoose');
const Quote = require('../models/Quote');
const { steps } = require('../validation/quote');
const { calculateQuote } = require('../services/pricing');

const router = express.Router();

function badId(res) {
  return res.status(400).json({ error: 'Invalid id' });
}

function serverError(res, err) {
  console.error(err);
  return res.status(500).json({ error: 'Server error' });
}

// Load a quote with its packages and add-ons, and price it with the pricing engine
async function priceQuote(id) {
  const quote = await Quote.findById(id)
    .populate('items.package')
    .populate('items.addOns');
  if (!quote) return { status: 404, error: 'Not found' };
  if (!quote.items.length) {
    return { status: 400, error: 'Choose at least one package first' };
  }
  if (quote.items.some((i) => !i.package)) {
    return { status: 400, error: 'A chosen package no longer exists' };
  }
  const items = quote.items.map((i) => ({
    basePrice: i.package.basePrice,
    addOns: i.addOns.filter(Boolean).map((a) => a.price),
  }));
  try {
    const price = calculateQuote({
      items,
      rush: quote.rush,
      currency: quote.currency,
    });
    return { status: 200, price };
  } catch (err) {
    return { status: 400, error: err.message };
  }
}

// Start a new draft
router.post('/', async (req, res) => {
  try {
    const quote = await Quote.create({});
    res.status(201).json(quote);
  } catch (err) {
    serverError(res, err);
  }
});

// List quotes (so a draft can be resumed)
router.get('/', async (req, res) => {
  try {
    const quotes = await Quote.find().sort({ updatedAt: -1 });
    res.json(quotes);
  } catch (err) {
    serverError(res, err);
  }
});

// Price breakdown for one quote
router.get('/:id/price', async (req, res) => {
  if (!mongoose.isValidObjectId(req.params.id)) return badId(res);
  try {
    const result = await priceQuote(req.params.id);
    if (result.error) return res.status(result.status).json({ error: result.error });
    res.json(result.price);
  } catch (err) {
    serverError(res, err);
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
    serverError(res, err);
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
    serverError(res, err);
  }
});

// Final submit: re-check all 3 steps, then store the total
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
    const priced = await priceQuote(req.params.id);
    if (priced.error) return res.status(priced.status).json({ error: priced.error });

    quote.total = priced.price.total;
    quote.status = 'submitted';
    await quote.save();
    res.json(quote);
  } catch (err) {
    serverError(res, err);
  }
});

module.exports = router;