const mongoose = require('mongoose');

const routeSchema = new mongoose.Schema({
  institution: { type: mongoose.Schema.Types.ObjectId, ref: 'Institution', required: true },
  name: { type: String, required: true },
  routeNumber: { type: String, required: true, unique: true },
  distance: { type: String },
  estimatedTime: { type: String },
  startPoint: { type: String },
  endPoint: { type: String },
  stops: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Stop' }],
  bus: { type: mongoose.Schema.Types.ObjectId, ref: 'Bus' },
  driver: { type: mongoose.Schema.Types.ObjectId, ref: 'Driver' },
  status: { type: String, enum: ['active', 'inactive'], default: 'active' },
}, { timestamps: true });

module.exports = mongoose.model('Route', routeSchema);
