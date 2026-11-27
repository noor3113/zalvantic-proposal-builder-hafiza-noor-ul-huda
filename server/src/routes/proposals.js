const express = require('express');
const mongoose = require('mongoose');
const Proposal = require('../models/Proposal');
const Template = require('../models/Template');
const Quote = require('../models/Quote');
const { createProposal, updateProposal } = require('../validation/proposal');

const router = express.Router();

function serverError(res, err) {
  console.error(err);
  return res.status(500).json({ error: 'Server error' });
}

function validationFailed(res, error) {
  return res.status(400).json({
    error: 'Validation failed',
    issues: error.issues.map((i) => ({ path: i.path.join('.'), message: i.message })),
  });
}

// List proposals
router.get('/', async (req, res) => {
  try {
    res.json(await Proposal.find().sort({ updatedAt: -1 }));
  } catch (err) {
    serverError(res, err);
  }
});

// Create a proposal from a template, for a submitted quote
router.post('/', async (req, res) => {
  const parsed = createProposal.safeParse(req.body);
  if (!parsed.success) return validationFailed(res, parsed.error);

  try {
    const quote = await Quote.findById(parsed.data.quoteId);
    if (!quote) return res.status(404).json({ error: 'Quote not found' });
    if (quote.status !== 'submitted') {
      return res.status(400).json({ error: 'Submit the quote first' });
    }
    const template = await Template.findById(parsed.data.templateId);
    if (!template) return res.status(404).json({ error: 'Template not found' });

    const proposal = await Proposal.create({
      quoteId: quote._id,
      title: `Proposal for ${quote.clientName || 'client'}`,
      sections: template.sections.map((s) => ({
        key: s.key,
        title: s.title,
        body: s.body,
      })),
    });
    res.status(201).json(proposal);
  } catch (err) {
    serverError(res, err);
  }
});

// Get one proposal
router.get('/:id', async (req, res) => {
  if (!mongoose.isValidObjectId(req.params.id)) {
    return res.status(400).json({ error: 'Invalid id' });
  }
  try {
    const proposal = await Proposal.findById(req.params.id);
    if (!proposal) return res.status(404).json({ error: 'Not found' });
    res.json(proposal);
  } catch (err) {
    serverError(res, err);
  }
});

// Edit title and sections
router.put('/:id', async (req, res) => {
  if (!mongoose.isValidObjectId(req.params.id)) {
    return res.status(400).json({ error: 'Invalid id' });
  }
  const parsed = updateProposal.safeParse(req.body);
  if (!parsed.success) return validationFailed(res, parsed.error);

  try {
    const proposal = await Proposal.findById(req.params.id);
    if (!proposal) return res.status(404).json({ error: 'Not found' });
    if (proposal.status !== 'draft') {
      return res.status(409).json({ error: 'Only a draft can be edited' });
    }
    proposal.title = parsed.data.title;
    proposal.sections = parsed.data.sections;
    await proposal.save();
    res.json(proposal);
  } catch (err) {
    serverError(res, err);
  }
});

module.exports = router;