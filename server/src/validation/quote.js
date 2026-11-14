const { z } = require('zod');

const objectId = z.string().regex(/^[0-9a-fA-F]{24}$/, 'Invalid id');

const step1 = z.object({
  clientName: z.string().trim().min(2, 'Name is too short'),
  clientEmail: z.string().trim().email('Invalid email'),
  company: z.string().trim().optional(),
});

const step2 = z.object({
  items: z
    .array(z.object({ package: objectId, addOns: z.array(objectId).default([]) }))
    .min(1, 'Choose at least one package'),
});

const step3 = z.object({
  currency: z.enum(['USD', 'EUR', 'PKR']),
  rush: z.boolean().default(false),
  notes: z.string().trim().max(500, 'Notes are too long').optional(),
});

const steps = { 1: step1, 2: step2, 3: step3 };

module.exports = { steps, step1, step2, step3 };