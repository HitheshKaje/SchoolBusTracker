const mongoose = require('mongoose');

const institutionSchema = new mongoose.Schema({
  name: { type: String, required: true },
  address: { type: String },
  contactEmail: { type: String },
  contactPhone: { type: String },
  status: { type: String, enum: ['active', 'inactive'], default: 'active' },
}, { timestamps: true });

module.exports = mongoose.model('Institution', institutionSchema);
