const mongoose = require('mongoose');

const announcementSchema = new mongoose.Schema({
  institution: { type: mongoose.Schema.Types.ObjectId, ref: 'Institution', required: true },
  title: { type: String, required: true },
  content: { type: String, required: true },
  targetAudience: [{ type: String, enum: ['Admin', 'Driver', 'Parent', 'All'] }],
}, { timestamps: true });

module.exports = mongoose.model('Announcement', announcementSchema);
