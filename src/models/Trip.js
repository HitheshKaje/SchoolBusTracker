const mongoose = require('mongoose');

const tripSchema = new mongoose.Schema({
  institution: { type: mongoose.Schema.Types.ObjectId, ref: 'Institution', required: true },
  route: { type: mongoose.Schema.Types.ObjectId, ref: 'Route', required: true },
  bus: { type: mongoose.Schema.Types.ObjectId, ref: 'Bus', required: true },
  driver: { type: mongoose.Schema.Types.ObjectId, ref: 'Driver', required: true },
  date: { type: Date, required: true },
  status: { type: String, enum: ['scheduled', 'in_progress', 'completed', 'cancelled'], default: 'scheduled' },
  startTime: { type: Date },
  endTime: { type: Date },
}, { timestamps: true });

module.exports = mongoose.model('Trip', tripSchema);
