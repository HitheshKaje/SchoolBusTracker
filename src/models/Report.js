const mongoose = require('mongoose');

const reportSchema = new mongoose.Schema({
  institution: { type: mongoose.Schema.Types.ObjectId, ref: 'Institution', required: true },
  type: { type: String, enum: ['attendance', 'trip', 'incident'], required: true },
  generatedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  data: { type: mongoose.Schema.Types.Mixed }, // Stores flexible JSON data
  dateRange: {
    start: { type: Date },
    end: { type: Date }
  }
}, { timestamps: true });

module.exports = mongoose.model('Report', reportSchema);
