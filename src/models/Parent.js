const mongoose = require('mongoose');

const parentSchema = new mongoose.Schema({
  user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  institution: { type: mongoose.Schema.Types.ObjectId, ref: 'Institution', required: true },
  children: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Child' }],
  address: { type: String },
  emergencyContact: { type: String },
  countryCode: { type: String, default: '+1' },
  secretCode: { type: String },
  status: { type: String, enum: ['active', 'inactive'], default: 'active' }
}, { timestamps: true });

module.exports = mongoose.model('Parent', parentSchema);
