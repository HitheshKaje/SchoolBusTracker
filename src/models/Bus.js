const mongoose = require('mongoose');

const busSchema = new mongoose.Schema({
  institution: { type: mongoose.Schema.Types.ObjectId, ref: 'Institution', required: true },
  registrationNumber: { type: String, required: true, unique: true },
  capacity: { type: Number, required: true },
  model: { type: String },
  driver: { type: mongoose.Schema.Types.ObjectId, ref: 'Driver' },
  route: { type: mongoose.Schema.Types.ObjectId, ref: 'Route' },
  status: { type: String, enum: ['active', 'maintenance', 'inactive'], default: 'active' },
  currentGpsStatus: { type: String, enum: ['online', 'offline'], default: 'offline' }
}, { timestamps: true });

module.exports = mongoose.model('Bus', busSchema);
