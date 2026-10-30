const mongoose = require('mongoose');

const hostProfileSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, unique: true },
  hostType: {
    type: String,
    enum: ['faculty', 'department', 'club', 'society', 'committee', 'student'],
    required: true,
  },
  departmentId: { type: mongoose.Schema.Types.ObjectId, ref: 'Department', default: null },
  clubId: { type: mongoose.Schema.Types.ObjectId, ref: 'Club', default: null },
  designation: { type: String, trim: true, default: '' },
  description: { type: String, default: '' },
  phone: { type: String, trim: true, default: '' },
  verificationStatus: {
    type: String,
    enum: ['pending', 'approved', 'rejected', 'suspended'],
    default: 'pending',
  },
}, { timestamps: true });

module.exports = mongoose.model('HostProfile', hostProfileSchema);
