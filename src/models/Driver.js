const mongoose = require('mongoose');

const driverSchema = new mongoose.Schema({
  user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  institution: { type: mongoose.Schema.Types.ObjectId, ref: 'Institution', required: true },
  licenseNumber: { type: String, required: true },
  licenseExpiry: { type: Date, required: true },
  experience: { type: String },
  photo: { type: String },
  assignedBus: { type: mongoose.Schema.Types.ObjectId, ref: 'Bus' },
  assignedRoute: { type: mongoose.Schema.Types.ObjectId, ref: 'Route' },
  availability: { type: String, enum: ['available', 'on_leave', 'assigned'], default: 'available' },
  gpsStatus: { type: String, enum: ['online', 'offline'], default: 'offline' },
  status: { type: String, enum: ['active', 'inactive'], default: 'active' }
}, { timestamps: true });

module.exports = mongoose.model('Driver', driverSchema);
