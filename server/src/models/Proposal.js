const mongoose = require('mongoose');

const sectionSchema = new mongoose.Schema(
  {
    key: { type: String, required: true },
    title: { type: String, required: true },
    body: { type: String, default: '' },
  },
  { _id: false }
);

const proposalSchema = new mongoose.Schema(
  {
    quoteId: { type: mongoose.Schema.Types.ObjectId, ref: 'Quote', required: true },
    title: { type: String, trim: true, default: 'Proposal' },
    sections: [sectionSchema],
    version: { type: Number, default: 1 },
    status: {
      type: String,
      enum: ['draft', 'sent', 'accepted', 'declined'],
      default: 'draft',
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model('Proposal', proposalSchema);