const mongoose = require('mongoose');

const locationSchema = new mongoose.Schema({
  institution: { type: mongoose.Schema.Types.ObjectId, ref: 'Institution', required: true },
  trip: { type: mongoose.Schema.Types.ObjectId, ref: 'Trip', required: true },
  bus: { type: mongoose.Schema.Types.ObjectId, ref: 'Bus', required: true },
  driver: { type: mongoose.Schema.Types.ObjectId, ref: 'Driver', required: true },
  location: {
    type: { type: String, enum: ['Point'], default: 'Point' },
    coordinates: { type: [Number], required: true }, // [longitude, latitude]
  },
  speed: { type: Number },
  timestamp: { type: Date, default: Date.now },
}, { timestamps: true });

locationSchema.index({ location: '2dsphere' });

module.exports = mongoose.model('Location', locationSchema);
