const mongoose = require('mongoose');

const sectionSchema = new mongoose.Schema(
  {
    key: { type: String, required: true },
    title: { type: String, required: true },
    body: { type: String, default: '' },
  },
  { _id: false }
);

const templateSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true },
    sections: [sectionSchema],
  },
  { timestamps: true }
);

module.exports = mongoose.model('Template', templateSchema);