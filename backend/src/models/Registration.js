const mongoose = require('mongoose');

const registrationSchema = new mongoose.Schema({
  studentId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  eventId: { type: mongoose.Schema.Types.ObjectId, ref: 'Event', required: true },
  registeredAt: { type: Date, default: Date.now },
  status: {
    type: String,
    enum: ['registered', 'cancelled', 'waitlisted'],
    default: 'registered',
  },
  attendanceStatus: {
    type: String,
    enum: ['present', 'absent', 'not-marked'],
    default: 'not-marked',
  },
}, { timestamps: true });

// Prevent duplicate registrations
registrationSchema.index({ studentId: 1, eventId: 1 }, { unique: true });

module.exports = mongoose.model('Registration', registrationSchema);
