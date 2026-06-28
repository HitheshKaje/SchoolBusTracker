const mongoose = require('mongoose');

const attendanceSchema = new mongoose.Schema({
  institution: { type: mongoose.Schema.Types.ObjectId, ref: 'Institution', required: true },
  trip: { type: mongoose.Schema.Types.ObjectId, ref: 'Trip', required: true },
  child: { type: mongoose.Schema.Types.ObjectId, ref: 'Child', required: true },
  status: { type: String, enum: ['present', 'absent', 'picked_up', 'dropped_off'], required: true },
  timestamp: { type: Date, default: Date.now },
  location: {
    type: { type: String, enum: ['Point'], default: 'Point' },
    coordinates: { type: [Number] },
  }
}, { timestamps: true });

module.exports = mongoose.model('Attendance', attendanceSchema);
