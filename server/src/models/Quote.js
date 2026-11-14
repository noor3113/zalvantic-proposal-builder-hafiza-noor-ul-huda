const mongoose = require('mongoose');

const itemSchema = new mongoose.Schema(
  {
    package: { type: mongoose.Schema.Types.ObjectId, ref: 'Package', required: true },
    addOns: [{ type: mongoose.Schema.Types.ObjectId, ref: 'AddOn' }],
  },
  { _id: false }
);

const quoteSchema = new mongoose.Schema(
  {
    status: { type: String, enum: ['draft', 'submitted'], default: 'draft' },
    currentStep: { type: Number, default: 1 },
    clientName: { type: String, trim: true },
    clientEmail: { type: String, trim: true, lowercase: true },
    company: { type: String, trim: true },
    items: [itemSchema],
    currency: { type: String, default: 'USD' },
    rush: { type: Boolean, default: false },
    notes: { type: String, trim: true },
    total: { type: Number, default: 0 },
  },
  { timestamps: true }
);

module.exports = mongoose.model('Quote', quoteSchema);