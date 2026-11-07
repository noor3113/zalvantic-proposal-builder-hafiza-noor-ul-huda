const mongoose = require('mongoose');

const packageSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true },
    basePrice: { type: Number, required: true, min: 0 },
    currency: { type: String, default: 'USD' },
    includes: [{ type: String }],
  },
  { timestamps: true }
);

module.exports = mongoose.model('Package', packageSchema);