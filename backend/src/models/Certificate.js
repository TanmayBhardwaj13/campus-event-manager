const mongoose = require('mongoose');

const certificateSchema = new mongoose.Schema({
  studentId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  eventId: { type: mongoose.Schema.Types.ObjectId, ref: 'Event', required: true },
  status: { type: String, enum: ['pending', 'issued'], default: 'pending' },
  issuedAt: { type: Date, default: null },
  certificateUrl: { type: String, default: null },
}, { timestamps: true });

module.exports = mongoose.model('Certificate', certificateSchema);
