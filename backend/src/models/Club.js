const mongoose = require('mongoose');

const clubSchema = new mongoose.Schema({
  name: { type: String, required: true, trim: true },
  description: { type: String, default: '' },
  departmentId: { type: mongoose.Schema.Types.ObjectId, ref: 'Department', default: null },
  status: { type: String, enum: ['active', 'inactive'], default: 'active' },
  approved: { type: Boolean, default: false },
  logoImage: { type: String, default: null },
}, { timestamps: true });

module.exports = mongoose.model('Club', clubSchema);
