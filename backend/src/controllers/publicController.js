const Event = require('../models/Event');
const Department = require('../models/Department');
const Club = require('../models/Club');
const Category = require('../models/Category');

exports.getPublicEvents = async (req, res, next) => {
  try {
    const { search, category, page = 1, limit = 8 } = req.query;
    const query = {
      approvalStatus: 'published',
      eventStatus: { $in: ['upcoming', 'ongoing'] },
    };
    if (search) query.title = { $regex: search, $options: 'i' };
    if (category) query.categoryId = category;

    const events = await Event.find(query)
      .populate('categoryId', 'name color')
      .populate('departmentId', 'name')
      .populate('clubId', 'name')
      .sort({ date: 1 })
      .skip((page - 1) * limit)
      .limit(parseInt(limit));

    const total = await Event.countDocuments(query);
    res.json({ success: true, data: events, total });
  } catch (error) {
    next(error);
  }
};

exports.getPublicEvent = async (req, res, next) => {
  try {
    const event = await Event.findById(req.params.id)
      .populate('categoryId').populate('departmentId').populate('clubId').populate('hostId', 'name');
    if (!event) return res.status(404).json({ success: false, message: 'Event not found' });
    res.json({ success: true, data: event });
  } catch (error) {
    next(error);
  }
};

exports.getPublicDepartments = async (req, res, next) => {
  try {
    const departments = await Department.find({ status: 'active' }).sort({ name: 1 });
    res.json({ success: true, data: departments });
  } catch (error) {
    next(error);
  }
};

exports.getPublicClubs = async (req, res, next) => {
  try {
    const clubs = await Club.find({ status: 'active', approved: true })
      .populate('departmentId', 'name').sort({ name: 1 });
    res.json({ success: true, data: clubs });
  } catch (error) {
    next(error);
  }
};

exports.getPublicCategories = async (req, res, next) => {
  try {
    const categories = await Category.find({ status: 'active' }).sort({ name: 1 });
    res.json({ success: true, data: categories });
  } catch (error) {
    next(error);
  }
};

exports.getLandingStats = async (req, res, next) => {
  try {
    const Event = require('../models/Event');
    const User = require('../models/User');
    const Registration = require('../models/Registration');

    const [totalEvents, totalStudents, totalRegistrations, upcomingEvents] = await Promise.all([
      Event.countDocuments({ approvalStatus: 'published' }),
      User.countDocuments({ role: 'student' }),
      Registration.countDocuments({ status: 'registered' }),
      Event.find({ approvalStatus: 'published', eventStatus: 'upcoming' })
        .sort({ date: 1 }).limit(3)
        .populate('categoryId', 'name color').populate('departmentId', 'name'),
    ]);

    res.json({ success: true, data: { totalEvents, totalStudents, totalRegistrations, upcomingEvents } });
  } catch (error) {
    next(error);
  }
};
