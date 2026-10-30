const User = require('../models/User');
const StudentProfile = require('../models/StudentProfile');
const HostProfile = require('../models/HostProfile');
const Department = require('../models/Department');
const { sendTokenResponse } = require('../utils/token');

// @desc  Register student
// @route POST /api/auth/student/register
exports.registerStudent = async (req, res, next) => {
  try {
    const { name, email, password, studentId, departmentId, course, year, phone } = req.body;

    const existingUser = await User.findOne({ email });
    if (existingUser) return res.status(400).json({ success: false, message: 'Email already registered' });

    const existingStudent = await StudentProfile.findOne({ studentId });
    if (existingStudent) return res.status(400).json({ success: false, message: 'Student ID already registered' });

    const user = await User.create({ name, email, password, role: 'student' });
    await StudentProfile.create({ userId: user._id, studentId, departmentId, course, year, phone });

    sendTokenResponse(user, 201, res);
  } catch (error) {
    next(error);
  }
};

// @desc  Login student
// @route POST /api/auth/student/login
exports.loginStudent = async (req, res, next) => {
  try {
    const { email, password } = req.body;
    if (!email || !password) return res.status(400).json({ success: false, message: 'Email and password are required' });

    const user = await User.findOne({ email, role: 'student' }).select('+password');
    if (!user || !(await user.comparePassword(password))) {
      return res.status(401).json({ success: false, message: 'Invalid credentials' });
    }
    if (user.status !== 'active') {
      return res.status(403).json({ success: false, message: 'Your account has been deactivated' });
    }
    sendTokenResponse(user, 200, res);
  } catch (error) {
    next(error);
  }
};

// @desc  Register host
// @route POST /api/auth/host/register
exports.registerHost = async (req, res, next) => {
  try {
    const { name, email, password, hostType, departmentId, clubId, designation, description, phone } = req.body;

    const existingUser = await User.findOne({ email });
    if (existingUser) return res.status(400).json({ success: false, message: 'Email already registered' });

    const user = await User.create({ name, email, password, role: 'host' });
    await HostProfile.create({ userId: user._id, hostType, departmentId, clubId, designation, description, phone });

    res.status(201).json({
      success: true,
      message: 'Registration successful! Your account is pending admin approval.',
      user: { _id: user._id, name: user.name, email: user.email, role: user.role },
    });
  } catch (error) {
    next(error);
  }
};

// @desc  Login host
// @route POST /api/auth/host/login
exports.loginHost = async (req, res, next) => {
  try {
    const { email, password } = req.body;
    if (!email || !password) return res.status(400).json({ success: false, message: 'Email and password are required' });

    const user = await User.findOne({ email, role: 'host' }).select('+password');
    if (!user || !(await user.comparePassword(password))) {
      return res.status(401).json({ success: false, message: 'Invalid credentials' });
    }
    if (user.status !== 'active') {
      return res.status(403).json({ success: false, message: 'Your account has been deactivated or suspended' });
    }

    const hostProfile = await HostProfile.findOne({ userId: user._id });
    if (hostProfile && hostProfile.verificationStatus === 'pending') {
      return res.status(403).json({ success: false, message: 'Your host account is pending admin approval' });
    }
    if (hostProfile && hostProfile.verificationStatus === 'rejected') {
      return res.status(403).json({ success: false, message: 'Your host account has been rejected' });
    }
    if (hostProfile && hostProfile.verificationStatus === 'suspended') {
      return res.status(403).json({ success: false, message: 'Your host account has been suspended' });
    }

    sendTokenResponse(user, 200, res);
  } catch (error) {
    next(error);
  }
};

// @desc  Login admin
// @route POST /api/auth/admin/login
exports.loginAdmin = async (req, res, next) => {
  try {
    const { email, password } = req.body;
    if (!email || !password) return res.status(400).json({ success: false, message: 'Email and password are required' });

    const user = await User.findOne({ email, role: 'admin' }).select('+password');
    if (!user || !(await user.comparePassword(password))) {
      return res.status(401).json({ success: false, message: 'Invalid credentials' });
    }
    sendTokenResponse(user, 200, res);
  } catch (error) {
    next(error);
  }
};

// @desc  Get current user
// @route GET /api/auth/me
exports.getMe = async (req, res, next) => {
  try {
    const user = await User.findById(req.user._id);
    let profile = null;
    if (user.role === 'student') {
      profile = await StudentProfile.findOne({ userId: user._id }).populate('departmentId');
    } else if (user.role === 'host') {
      profile = await HostProfile.findOne({ userId: user._id }).populate('departmentId clubId');
    }
    res.json({ success: true, user, profile });
  } catch (error) {
    next(error);
  }
};
