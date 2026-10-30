const mongoose = require('mongoose');

const eventSchema = new mongoose.Schema({
  title: { type: String, required: true, trim: true },
  description: { type: String, required: true },
  image: { type: String, default: null },
  categoryId: { type: mongoose.Schema.Types.ObjectId, ref: 'Category', required: true },
  departmentId: { type: mongoose.Schema.Types.ObjectId, ref: 'Department', default: null },
  clubId: { type: mongoose.Schema.Types.ObjectId, ref: 'Club', default: null },
  hostId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },

  // Venue
  building: { type: String, trim: true, default: '' },
  block: { type: String, trim: true, default: '' },
  room: { type: String, trim: true, default: '' },
  venueDetails: { type: String, trim: true, default: '' },

  // Schedule
  date: { type: Date, required: true },
  startTime: { type: String, required: true },
  endTime: { type: String, required: true },
  registrationDeadline: { type: Date, required: true },

  // Registration
  maxParticipants: { type: Number, required: true, min: 1 },
  currentRegistrations: { type: Number, default: 0 },
  eligibility: { type: String, default: 'All students' },
  rules: { type: String, default: '' },
  requirements: { type: String, default: '' },

  // Status
  approvalStatus: {
    type: String,
    enum: ['draft', 'pending', 'approved', 'rejected', 'published'],
    default: 'draft',
  },
  eventStatus: {
    type: String,
    enum: ['upcoming', 'ongoing', 'completed', 'cancelled'],
    default: 'upcoming',
  },
  rejectionReason: { type: String, default: '' },
  tags: [{ type: String }],
}, { timestamps: true });

module.exports = mongoose.model('Event', eventSchema);
