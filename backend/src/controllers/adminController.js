const User = require('../models/User');
const StudentProfile = require('../models/StudentProfile');
const HostProfile = require('../models/HostProfile');
const Event = require('../models/Event');
const Registration = require('../models/Registration');
const Department = require('../models/Department');
const Club = require('../models/Club');
const Category = require('../models/Category');
const Notification = require('../models/Notification');

// ========== DASHBOARD ==========
exports.getDashboardStats = async (req, res, next) => {
  try {
    const [
      totalStudents, totalHosts, totalEvents,
      upcomingEvents, ongoingEvents, completedEvents, cancelledEvents,
      totalRegistrations, totalAttendees,
      pendingHosts, pendingEvents,
    ] = await Promise.all([
      User.countDocuments({ role: 'student', status: 'active' }),
      HostProfile.countDocuments({ verificationStatus: 'approved' }),
      Event.countDocuments(),
      Event.countDocuments({ eventStatus: 'upcoming', approvalStatus: 'published' }),
      Event.countDocuments({ eventStatus: 'ongoing' }),
      Event.countDocuments({ eventStatus: 'completed' }),
      Event.countDocuments({ eventStatus: 'cancelled' }),
      Registration.countDocuments({ status: 'registered' }),
      Registration.countDocuments({ attendanceStatus: 'present' }),
      HostProfile.countDocuments({ verificationStatus: 'pending' }),
      Event.countDocuments({ approvalStatus: 'pending' }),
    ]);

    const recentEvents = await Event.find()
      .sort({ createdAt: -1 })
      .limit(5)
      .populate('categoryId', 'name color')
      .populate('departmentId', 'name')
      .populate('hostId', 'name');

    const recentRegistrations = await Registration.find({ status: 'registered' })
      .sort({ createdAt: -1 })
      .limit(5)
      .populate('studentId', 'name email')
      .populate('eventId', 'title date');

    const popularEvents = await Event.find({ approvalStatus: 'published' })
      .sort({ currentRegistrations: -1 })
      .limit(5)
      .populate('categoryId', 'name color');

    res.json({
      success: true,
      data: {
        stats: {
          totalStudents, totalHosts, totalEvents,
          upcomingEvents, ongoingEvents, completedEvents, cancelledEvents,
          totalRegistrations, totalAttendees,
          pendingHosts, pendingEvents,
        },
        recentEvents,
        recentRegistrations,
        popularEvents,
      },
    });
  } catch (error) {
    next(error);
  }
};

// ========== STUDENT MANAGEMENT ==========
exports.getStudents = async (req, res, next) => {
  try {
    const { search, department, year, status, page = 1, limit = 20 } = req.query;
    const query = { role: 'student' };
    if (status) query.status = status;
    if (search) query.$or = [
      { name: { $regex: search, $options: 'i' } },
      { email: { $regex: search, $options: 'i' } },
    ];

    const users = await User.find(query)
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(parseInt(limit));

    const studentsWithProfiles = await Promise.all(users.map(async (user) => {
      const profile = await StudentProfile.findOne({ userId: user._id }).populate('departmentId', 'name');
      return { ...user.toJSON(), profile };
    }));

    // Filter by department and year after join
    let filtered = studentsWithProfiles;
    if (department) filtered = filtered.filter(s => s.profile?.departmentId?._id?.toString() === department);
    if (year) filtered = filtered.filter(s => s.profile?.year === parseInt(year));

    const total = await User.countDocuments(query);
    res.json({ success: true, data: filtered, total, page: parseInt(page), pages: Math.ceil(total / limit) });
  } catch (error) {
    next(error);
  }
};

exports.getStudent = async (req, res, next) => {
  try {
    const user = await User.findById(req.params.id);
    if (!user || user.role !== 'student') return res.status(404).json({ success: false, message: 'Student not found' });
    const profile = await StudentProfile.findOne({ userId: user._id }).populate('departmentId');
    const registrations = await Registration.find({ studentId: user._id })
      .populate('eventId', 'title date eventStatus categoryId')
      .sort({ registeredAt: -1 });
    res.json({ success: true, data: { ...user.toJSON(), profile, registrations } });
  } catch (error) {
    next(error);
  }
};

exports.updateStudentStatus = async (req, res, next) => {
  try {
    const { status } = req.body;
    const user = await User.findByIdAndUpdate(req.params.id, { status }, { new: true });
    if (!user) return res.status(404).json({ success: false, message: 'Student not found' });
    res.json({ success: true, data: user, message: `Student account ${status}` });
  } catch (error) {
    next(error);
  }
};

// ========== HOST MANAGEMENT ==========
exports.getHosts = async (req, res, next) => {
  try {
    const { search, status, verificationStatus, page = 1, limit = 20 } = req.query;
    const profileQuery = {};
    if (verificationStatus) profileQuery.verificationStatus = verificationStatus;

    const profiles = await HostProfile.find(profileQuery)
      .populate('departmentId', 'name')
      .populate('clubId', 'name')
      .populate('userId', 'name email status profileImage createdAt')
      .sort({ createdAt: -1 });

    let filtered = profiles.filter(p => p.userId);
    if (search) filtered = filtered.filter(p =>
      p.userId.name.toLowerCase().includes(search.toLowerCase()) ||
      p.userId.email.toLowerCase().includes(search.toLowerCase())
    );
    if (status) filtered = filtered.filter(p => p.userId.status === status);

    res.json({ success: true, data: filtered, total: filtered.length });
  } catch (error) {
    next(error);
  }
};

exports.getHost = async (req, res, next) => {
  try {
    const profile = await HostProfile.findOne({ userId: req.params.id })
      .populate('departmentId').populate('clubId').populate('userId');
    if (!profile) return res.status(404).json({ success: false, message: 'Host not found' });
    const events = await Event.find({ hostId: req.params.id })
      .populate('categoryId', 'name color').sort({ createdAt: -1 });
    res.json({ success: true, data: { profile, events } });
  } catch (error) {
    next(error);
  }
};

exports.updateHostStatus = async (req, res, next) => {
  try {
    const { verificationStatus, status } = req.body;
    const profile = await HostProfile.findOneAndUpdate(
      { userId: req.params.id },
      { verificationStatus },
      { new: true }
    );
    if (!profile) return res.status(404).json({ success: false, message: 'Host not found' });
    if (status) await User.findByIdAndUpdate(req.params.id, { status });

    // Send notification
    if (verificationStatus === 'approved') {
      await Notification.create({
        userId: req.params.id,
        title: 'Host Account Approved',
        message: 'Your host account has been approved! You can now create and publish events.',
        type: 'approval',
      });
    }
    res.json({ success: true, data: profile, message: `Host status updated to ${verificationStatus}` });
  } catch (error) {
    next(error);
  }
};

// ========== EVENT MANAGEMENT ==========
exports.getEvents = async (req, res, next) => {
  try {
    const { search, approvalStatus, eventStatus, category, department, page = 1, limit = 20 } = req.query;
    const query = {};
    if (approvalStatus) query.approvalStatus = approvalStatus;
    if (eventStatus) query.eventStatus = eventStatus;
    if (category) query.categoryId = category;
    if (department) query.departmentId = department;
    if (search) query.title = { $regex: search, $options: 'i' };

    const events = await Event.find(query)
      .populate('categoryId', 'name color')
      .populate('departmentId', 'name')
      .populate('clubId', 'name')
      .populate('hostId', 'name email')
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(parseInt(limit));

    const total = await Event.countDocuments(query);
    res.json({ success: true, data: events, total, page: parseInt(page), pages: Math.ceil(total / limit) });
  } catch (error) {
    next(error);
  }
};

exports.getEvent = async (req, res, next) => {
  try {
    const event = await Event.findById(req.params.id)
      .populate('categoryId').populate('departmentId').populate('clubId').populate('hostId', 'name email');
    if (!event) return res.status(404).json({ success: false, message: 'Event not found' });

    const registrations = await Registration.find({ eventId: event._id })
      .populate('studentId', 'name email')
      .populate({ path: 'studentId', populate: { path: 'profile', model: 'StudentProfile' } });

    res.json({ success: true, data: { event, registrations } });
  } catch (error) {
    next(error);
  }
};

exports.updateEventStatus = async (req, res, next) => {
  try {
    const { approvalStatus, eventStatus, rejectionReason } = req.body;
    const update = {};
    if (approvalStatus) update.approvalStatus = approvalStatus;
    if (eventStatus) update.eventStatus = eventStatus;
    if (rejectionReason) update.rejectionReason = rejectionReason;

    const event = await Event.findByIdAndUpdate(req.params.id, update, { new: true }).populate('hostId', '_id');
    if (!event) return res.status(404).json({ success: false, message: 'Event not found' });

    // Notify host
    if (approvalStatus === 'approved') {
      await Notification.create({
        userId: event.hostId._id,
        title: 'Event Approved',
        message: `Your event "${event.title}" has been approved and published!`,
        type: 'approval',
      });
    } else if (approvalStatus === 'rejected') {
      await Notification.create({
        userId: event.hostId._id,
        title: 'Event Rejected',
        message: `Your event "${event.title}" was rejected. Reason: ${rejectionReason || 'No reason provided'}`,
        type: 'general',
      });
    }

    res.json({ success: true, data: event, message: 'Event status updated' });
  } catch (error) {
    next(error);
  }
};

exports.createEvent = async (req, res, next) => {
  try {
    const eventData = { ...req.body, hostId: req.user._id, approvalStatus: 'published' };
    if (req.file) eventData.image = `/uploads/${req.file.filename}`;
    const event = await Event.create(eventData);
    res.status(201).json({ success: true, data: event });
  } catch (error) {
    next(error);
  }
};

exports.updateEvent = async (req, res, next) => {
  try {
    const update = { ...req.body };
    if (req.file) update.image = `/uploads/${req.file.filename}`;
    const event = await Event.findByIdAndUpdate(req.params.id, update, { new: true, runValidators: true });
    if (!event) return res.status(404).json({ success: false, message: 'Event not found' });
    res.json({ success: true, data: event });
  } catch (error) {
    next(error);
  }
};

exports.deleteEvent = async (req, res, next) => {
  try {
    await Event.findByIdAndDelete(req.params.id);
    await Registration.deleteMany({ eventId: req.params.id });
    res.json({ success: true, message: 'Event deleted' });
  } catch (error) {
    next(error);
  }
};

// ========== DEPARTMENT MANAGEMENT ==========
exports.getDepartments = async (req, res, next) => {
  try {
    const departments = await Department.find().sort({ name: 1 });
    res.json({ success: true, data: departments });
  } catch (error) { next(error); }
};

exports.createDepartment = async (req, res, next) => {
  try {
    const dept = await Department.create(req.body);
    res.status(201).json({ success: true, data: dept });
  } catch (error) { next(error); }
};

exports.updateDepartment = async (req, res, next) => {
  try {
    const dept = await Department.findByIdAndUpdate(req.params.id, req.body, { new: true });
    if (!dept) return res.status(404).json({ success: false, message: 'Department not found' });
    res.json({ success: true, data: dept });
  } catch (error) { next(error); }
};

exports.deleteDepartment = async (req, res, next) => {
  try {
    await Department.findByIdAndDelete(req.params.id);
    res.json({ success: true, message: 'Department deleted' });
  } catch (error) { next(error); }
};

// ========== CLUB MANAGEMENT ==========
exports.getClubs = async (req, res, next) => {
  try {
    const clubs = await Club.find().populate('departmentId', 'name').sort({ name: 1 });
    res.json({ success: true, data: clubs });
  } catch (error) { next(error); }
};

exports.createClub = async (req, res, next) => {
  try {
    const club = await Club.create(req.body);
    res.status(201).json({ success: true, data: club });
  } catch (error) { next(error); }
};

exports.updateClub = async (req, res, next) => {
  try {
    const club = await Club.findByIdAndUpdate(req.params.id, req.body, { new: true });
    if (!club) return res.status(404).json({ success: false, message: 'Club not found' });
    res.json({ success: true, data: club });
  } catch (error) { next(error); }
};

exports.deleteClub = async (req, res, next) => {
  try {
    await Club.findByIdAndDelete(req.params.id);
    res.json({ success: true, message: 'Club deleted' });
  } catch (error) { next(error); }
};

// ========== CATEGORY MANAGEMENT ==========
exports.getCategories = async (req, res, next) => {
  try {
    const categories = await Category.find().sort({ name: 1 });
    res.json({ success: true, data: categories });
  } catch (error) { next(error); }
};

exports.createCategory = async (req, res, next) => {
  try {
    const category = await Category.create(req.body);
    res.status(201).json({ success: true, data: category });
  } catch (error) { next(error); }
};

exports.updateCategory = async (req, res, next) => {
  try {
    const category = await Category.findByIdAndUpdate(req.params.id, req.body, { new: true });
    if (!category) return res.status(404).json({ success: false, message: 'Category not found' });
    res.json({ success: true, data: category });
  } catch (error) { next(error); }
};

exports.deleteCategory = async (req, res, next) => {
  try {
    await Category.findByIdAndDelete(req.params.id);
    res.json({ success: true, message: 'Category deleted' });
  } catch (error) { next(error); }
};

// ========== ANALYTICS ==========
exports.getAnalytics = async (req, res, next) => {
  try {
    const now = new Date();
    const sixMonthsAgo = new Date(now.getFullYear(), now.getMonth() - 5, 1);

    // Events by category
    const eventsByCategory = await Event.aggregate([
      { $group: { _id: '$categoryId', count: { $sum: 1 } } },
      { $lookup: { from: 'categories', localField: '_id', foreignField: '_id', as: 'category' } },
      { $unwind: { path: '$category', preserveNullAndEmpty: true } },
      { $project: { name: { $ifNull: ['$category.name', 'Unknown'] }, count: 1, color: '$category.color' } },
    ]);

    // Events by department
    const eventsByDepartment = await Event.aggregate([
      { $match: { departmentId: { $ne: null } } },
      { $group: { _id: '$departmentId', count: { $sum: 1 } } },
      { $lookup: { from: 'departments', localField: '_id', foreignField: '_id', as: 'dept' } },
      { $unwind: { path: '$dept', preserveNullAndEmpty: true } },
      { $project: { name: { $ifNull: ['$dept.name', 'Unknown'] }, count: 1 } },
    ]);

    // Registrations by month
    const registrationsByMonth = await Registration.aggregate([
      { $match: { registeredAt: { $gte: sixMonthsAgo } } },
      {
        $group: {
          _id: { year: { $year: '$registeredAt' }, month: { $month: '$registeredAt' } },
          count: { $sum: 1 },
        },
      },
      { $sort: { '_id.year': 1, '_id.month': 1 } },
    ]);

    // Events by month
    const eventsByMonth = await Event.aggregate([
      { $match: { createdAt: { $gte: sixMonthsAgo } } },
      {
        $group: {
          _id: { year: { $year: '$createdAt' }, month: { $month: '$createdAt' } },
          count: { $sum: 1 },
        },
      },
      { $sort: { '_id.year': 1, '_id.month': 1 } },
    ]);

    const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

    const formatMonthData = (data) => data.map(d => ({
      month: monthNames[d._id.month - 1],
      count: d.count,
    }));

    res.json({
      success: true,
      data: {
        eventsByCategory,
        eventsByDepartment,
        registrationsByMonth: formatMonthData(registrationsByMonth),
        eventsByMonth: formatMonthData(eventsByMonth),
      },
    });
  } catch (error) {
    next(error);
  }
};

// ========== REGISTRATIONS ==========
exports.getAllRegistrations = async (req, res, next) => {
  try {
    const { page = 1, limit = 20 } = req.query;
    const registrations = await Registration.find()
      .populate('studentId', 'name email')
      .populate('eventId', 'title date')
      .sort({ registeredAt: -1 })
      .skip((page - 1) * limit)
      .limit(parseInt(limit));
    const total = await Registration.countDocuments();
    res.json({ success: true, data: registrations, total });
  } catch (error) {
    next(error);
  }
};
