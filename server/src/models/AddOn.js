const mongoose = require('mongoose');

const addOnSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true },
    price: { type: Number, required: true, min: 0 },
    appliesTo: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Package' }],
  },
  { timestamps: true }
);

module.exports = mongoose.model('AddOn', addOnSchema);