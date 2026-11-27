const { z } = require('zod');

const objectId = z.string().regex(/^[0-9a-fA-F]{24}$/, 'Invalid id');

const sectionSchema = z.object({
  key: z.string().trim().min(1),
  title: z.string().trim().min(1, 'Section title is required').max(100),
  body: z.string().max(5000, 'Section text is too long').default(''),
});

const createProposal = z.object({
  quoteId: objectId,
  templateId: objectId,
});

const updateProposal = z.object({
  title: z.string().trim().min(1, 'Title is required').max(120),
  sections: z.array(sectionSchema).min(1, 'At least one section is required').max(12),
});

module.exports = { createProposal, updateProposal };