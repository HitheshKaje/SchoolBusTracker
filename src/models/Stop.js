const mongoose = require('mongoose');

const stopSchema = new mongoose.Schema({
  institution: { type: mongoose.Schema.Types.ObjectId, ref: 'Institution', required: true },
  route: { type: mongoose.Schema.Types.ObjectId, ref: 'Route', required: true },
  name: { type: String, required: true },
  location: {
    type: { type: String, enum: ['Point'], default: 'Point' },
    coordinates: { type: [Number], required: true }, // [longitude, latitude]
  },
  estimatedTime: { type: String }, // e.g., "08:15 AM"
  order: { type: Number, default: 0 }
}, { timestamps: true });

stopSchema.index({ location: '2dsphere' });

module.exports = mongoose.model('Stop', stopSchema);
