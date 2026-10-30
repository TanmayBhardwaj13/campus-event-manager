const mongoose = require('mongoose');

const studentProfileSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, unique: true },
  studentId: { type: String, required: true, unique: true, trim: true },
  departmentId: { type: mongoose.Schema.Types.ObjectId, ref: 'Department', required: true },
  course: { type: String, required: true, trim: true },
  year: { type: Number, required: true, min: 1, max: 5 },
  phone: { type: String, trim: true, default: '' },
}, { timestamps: true });

module.exports = mongoose.model('StudentProfile', studentProfileSchema);
