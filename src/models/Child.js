const mongoose = require('mongoose');

const childSchema = new mongoose.Schema({
  name: { type: String, required: true },
  studentId: { type: String, required: true },
  admissionNumber: { type: String, unique: true, sparse: true },
  photo: { type: String },
  gender: { type: String, enum: ['Male', 'Female', 'Other'] },
  dob: { type: Date },
  institution: { type: mongoose.Schema.Types.ObjectId, ref: 'Institution', required: true },
  parents: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Parent' }],
  grade: { type: String },
  section: { type: String },
  assignedBus: { type: mongoose.Schema.Types.ObjectId, ref: 'Bus' },
  assignedRoute: { type: mongoose.Schema.Types.ObjectId, ref: 'Route' },
  pickupStop: { type: mongoose.Schema.Types.ObjectId, ref: 'Stop' },
  dropoffStop: { type: mongoose.Schema.Types.ObjectId, ref: 'Stop' },
  status: { type: String, enum: ['active', 'inactive'], default: 'active' },
  isDeleted: { type: Boolean, default: false }
}, { timestamps: true });

module.exports = mongoose.model('Child', childSchema);
