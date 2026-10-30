const Event = require('../models/Event');
const Registration = require('../models/Registration');
const SavedEvent = require('../models/SavedEvent');
const Notification = require('../models/Notification');
const Certificate = require('../models/Certificate');
const StudentProfile = require('../models/StudentProfile');
const User = require('../models/User');

// @desc  Get student dashboard
exports.getDashboard = async (req, res, next) => {
  try {
    const studentId = req.user._id;

    const [registered, attended, cancelled, waitlisted] = await Promise.all([
      Registration.countDocuments({ studentId, status: 'registered' }),
      Registration.countDocuments({ studentId, attendanceStatus: 'present' }),
      Registration.countDocuments({ studentId, status: 'cancelled' }),
      Registration.countDocuments({ studentId, status: 'waitlisted' }),
    ]);

    const upcomingRegistrations = await Registration.find({ studentId, status: 'registered' })
      .populate({
        path: 'eventId',
        match: { eventStatus: 'upcoming', approvalStatus: 'published' },
        populate: [{ path: 'categoryId', select: 'name color' }, { path: 'departmentId', select: 'name' }],
      })
      .sort({ registeredAt: -1 })
      .limit(5);

    const filtered = upcomingRegistrations.filter(r => r.eventId);

    const recommendedEvents = await Event.find({
      approvalStatus: 'published',
      eventStatus: 'upcoming',
      registrationDeadline: { $gte: new Date() },
    })
      .sort({ currentRegistrations: -1 })
      .limit(6)
      .populate('categoryId', 'name color')
      .populate('departmentId', 'name');

    const unreadNotifications = await Notification.countDocuments({ userId: studentId, read: false });

    res.json({
      success: true,
      data: {
        stats: { registered, attended, cancelled, waitlisted },
        upcomingRegistrations: filtered,
        recommendedEvents,
        unreadNotifications,
      },
    });
  } catch (error) {
    next(error);
  }
};

// @desc  Discover events (published)
exports.discoverEvents = async (req, res, next) => {
  try {
    const { search, category, department, club, sort = 'date', page = 1, limit = 12 } = req.query;
    const query = { approvalStatus: 'published', eventStatus: { $in: ['upcoming', 'ongoing'] } };

    if (search) query.title = { $regex: search, $options: 'i' };
    if (category) query.categoryId = category;
    if (department) query.departmentId = department;
    if (club) query.clubId = club;

    let sortOption = { date: 1 };
    if (sort === 'popular') sortOption = { currentRegistrations: -1 };
    else if (sort === 'newest') sortOption = { createdAt: -1 };
    else if (sort === 'deadline') sortOption = { registrationDeadline: 1 };

    const events = await Event.find(query)
      .populate('categoryId', 'name color')
      .populate('departmentId', 'name')
      .populate('clubId', 'name')
      .populate('hostId', 'name')
      .sort(sortOption)
      .skip((page - 1) * limit)
      .limit(parseInt(limit));

    const total = await Event.countDocuments(query);
    res.json({ success: true, data: events, total, page: parseInt(page), pages: Math.ceil(total / limit) });
  } catch (error) {
    next(error);
  }
};

// @desc  Get single event
exports.getEvent = async (req, res, next) => {
  try {
    const event = await Event.findById(req.params.id)
      .populate('categoryId')
      .populate('departmentId')
      .populate('clubId')
      .populate('hostId', 'name email');
    if (!event) return res.status(404).json({ success: false, message: 'Event not found' });

    let isRegistered = false;
    let isSaved = false;
    let registration = null;

    if (req.user) {
      registration = await Registration.findOne({ studentId: req.user._id, eventId: event._id });
      isRegistered = !!registration;
      const saved = await SavedEvent.findOne({ studentId: req.user._id, eventId: event._id });
      isSaved = !!saved;
    }

    res.json({ success: true, data: { event, isRegistered, isSaved, registration } });
  } catch (error) {
    next(error);
  }
};

// @desc  Register for event
exports.registerForEvent = async (req, res, next) => {
  try {
    const event = await Event.findById(req.params.id);
    if (!event) return res.status(404).json({ success: false, message: 'Event not found' });
    if (event.approvalStatus !== 'published') {
      return res.status(400).json({ success: false, message: 'Event is not open for registration' });
    }
    if (new Date() > event.registrationDeadline) {
      return res.status(400).json({ success: false, message: 'Registration deadline has passed' });
    }

    const existing = await Registration.findOne({ studentId: req.user._id, eventId: event._id });
    if (existing) {
      if (existing.status === 'cancelled') {
        existing.status = 'registered';
        existing.registeredAt = new Date();
        await existing.save();
        await Event.findByIdAndUpdate(event._id, { $inc: { currentRegistrations: 1 } });
        await Notification.create({
          userId: req.user._id,
          title: 'Registration Successful',
          message: `You have re-registered for "${event.title}"`,
          type: 'registration',
        });
        return res.json({ success: true, message: 'Re-registration successful', data: existing });
      }
      return res.status(400).json({ success: false, message: 'You are already registered for this event' });
    }

    let status = 'registered';
    if (event.currentRegistrations >= event.maxParticipants) {
      status = 'waitlisted';
    }

    const registration = await Registration.create({
      studentId: req.user._id,
      eventId: event._id,
      status,
    });

    if (status === 'registered') {
      await Event.findByIdAndUpdate(event._id, { $inc: { currentRegistrations: 1 } });
    }

    await Notification.create({
      userId: req.user._id,
      title: status === 'registered' ? 'Registration Successful' : 'Added to Waitlist',
      message: status === 'registered'
        ? `You have successfully registered for "${event.title}"`
        : `You have been added to the waitlist for "${event.title}"`,
      type: 'registration',
    });

    res.status(201).json({ success: true, data: registration, message: `Registration ${status}` });
  } catch (error) {
    next(error);
  }
};

// @desc  Cancel registration
exports.cancelRegistration = async (req, res, next) => {
  try {
    const registration = await Registration.findOne({
      studentId: req.user._id,
      eventId: req.params.id,
    });
    if (!registration) return res.status(404).json({ success: false, message: 'Registration not found' });
    if (registration.status === 'cancelled') {
      return res.status(400).json({ success: false, message: 'Registration already cancelled' });
    }

    const wasRegistered = registration.status === 'registered';
    registration.status = 'cancelled';
    await registration.save();

    if (wasRegistered) {
      await Event.findByIdAndUpdate(req.params.id, { $inc: { currentRegistrations: -1 } });
      // Promote first waitlisted student
      const waitlisted = await Registration.findOne({ eventId: req.params.id, status: 'waitlisted' }).sort({ createdAt: 1 });
      if (waitlisted) {
        waitlisted.status = 'registered';
        await waitlisted.save();
        await Event.findByIdAndUpdate(req.params.id, { $inc: { currentRegistrations: 1 } });
      }
    }

    res.json({ success: true, message: 'Registration cancelled' });
  } catch (error) {
    next(error);
  }
};

// @desc  Get my events
exports.getMyEvents = async (req, res, next) => {
  try {
    const { status } = req.query;
    const query = { studentId: req.user._id };
    if (status) query.status = status;

    const registrations = await Registration.find(query)
      .populate({
        path: 'eventId',
        populate: [
          { path: 'categoryId', select: 'name color' },
          { path: 'departmentId', select: 'name' },
          { path: 'hostId', select: 'name' },
        ],
      })
      .sort({ registeredAt: -1 });

    const valid = registrations.filter(r => r.eventId);
    res.json({ success: true, data: valid });
  } catch (error) {
    next(error);
  }
};

// @desc  Save event
exports.saveEvent = async (req, res, next) => {
  try {
    const existing = await SavedEvent.findOne({ studentId: req.user._id, eventId: req.params.id });
    if (existing) return res.status(400).json({ success: false, message: 'Event already saved' });
    await SavedEvent.create({ studentId: req.user._id, eventId: req.params.id });
    res.json({ success: true, message: 'Event saved' });
  } catch (error) {
    next(error);
  }
};

// @desc  Remove saved event
exports.unsaveEvent = async (req, res, next) => {
  try {
    await SavedEvent.findOneAndDelete({ studentId: req.user._id, eventId: req.params.id });
    res.json({ success: true, message: 'Event removed from saved' });
  } catch (error) {
    next(error);
  }
};

// @desc  Get saved events
exports.getSavedEvents = async (req, res, next) => {
  try {
    const saved = await SavedEvent.find({ studentId: req.user._id })
      .populate({
        path: 'eventId',
        populate: [{ path: 'categoryId', select: 'name color' }, { path: 'departmentId', select: 'name' }],
      })
      .sort({ savedAt: -1 });
    const valid = saved.filter(s => s.eventId);
    res.json({ success: true, data: valid });
  } catch (error) {
    next(error);
  }
};

// @desc  Get activity
exports.getActivity = async (req, res, next) => {
  try {
    const registrations = await Registration.find({ studentId: req.user._id })
      .populate('eventId', 'title date categoryId')
      .sort({ updatedAt: -1 })
      .limit(50);
    res.json({ success: true, data: registrations });
  } catch (error) {
    next(error);
  }
};

// @desc  Get certificates
exports.getCertificates = async (req, res, next) => {
  try {
    const certs = await Certificate.find({ studentId: req.user._id })
      .populate('eventId', 'title date hostId')
      .populate({ path: 'eventId', populate: { path: 'hostId', select: 'name' } })
      .sort({ issuedAt: -1 });
    res.json({ success: true, data: certs });
  } catch (error) {
    next(error);
  }
};

// @desc  Get notifications
exports.getNotifications = async (req, res, next) => {
  try {
    const notifications = await Notification.find({ userId: req.user._id }).sort({ createdAt: -1 }).limit(50);
    res.json({ success: true, data: notifications });
  } catch (error) {
    next(error);
  }
};

// @desc  Mark notification read
exports.markNotificationRead = async (req, res, next) => {
  try {
    await Notification.findByIdAndUpdate(req.params.id, { read: true });
    res.json({ success: true, message: 'Notification marked as read' });
  } catch (error) {
    next(error);
  }
};

// @desc  Mark all notifications read
exports.markAllNotificationsRead = async (req, res, next) => {
  try {
    await Notification.updateMany({ userId: req.user._id, read: false }, { read: true });
    res.json({ success: true, message: 'All notifications marked as read' });
  } catch (error) {
    next(error);
  }
};

// @desc  Get profile
exports.getProfile = async (req, res, next) => {
  try {
    const user = await User.findById(req.user._id);
    const profile = await StudentProfile.findOne({ userId: req.user._id }).populate('departmentId');
    res.json({ success: true, data: { user, profile } });
  } catch (error) {
    next(error);
  }
};

// @desc  Update profile
exports.updateProfile = async (req, res, next) => {
  try {
    const { name, phone, course, year } = req.body;
    const userUpdate = {};
    if (name) userUpdate.name = name;
    if (req.file) userUpdate.profileImage = `/uploads/${req.file.filename}`;

    const profileUpdate = {};
    if (phone) profileUpdate.phone = phone;
    if (course) profileUpdate.course = course;
    if (year) profileUpdate.year = year;

    const [user, profile] = await Promise.all([
      User.findByIdAndUpdate(req.user._id, userUpdate, { new: true }),
      StudentProfile.findOneAndUpdate({ userId: req.user._id }, profileUpdate, { new: true }).populate('departmentId'),
    ]);

    res.json({ success: true, data: { user, profile }, message: 'Profile updated' });
  } catch (error) {
    next(error);
  }
};
