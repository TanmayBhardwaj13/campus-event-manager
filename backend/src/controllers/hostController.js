const Event = require('../models/Event');
const Registration = require('../models/Registration');
const HostProfile = require('../models/HostProfile');
const Notification = require('../models/Notification');
const Certificate = require('../models/Certificate');
const User = require('../models/User');

// @desc  Get host dashboard stats
exports.getDashboard = async (req, res, next) => {
  try {
    const hostId = req.user._id;

    const [total, upcoming, ongoing, completed, cancelled, pending] = await Promise.all([
      Event.countDocuments({ hostId }),
      Event.countDocuments({ hostId, eventStatus: 'upcoming', approvalStatus: 'published' }),
      Event.countDocuments({ hostId, eventStatus: 'ongoing' }),
      Event.countDocuments({ hostId, eventStatus: 'completed' }),
      Event.countDocuments({ hostId, eventStatus: 'cancelled' }),
      Event.countDocuments({ hostId, approvalStatus: 'pending' }),
    ]);

    const myEvents = await Event.find({ hostId })
      .sort({ createdAt: -1 })
      .limit(5)
      .populate('categoryId', 'name color');

    const totalRegistrations = await Registration.countDocuments({
      eventId: { $in: myEvents.map(e => e._id) },
      status: 'registered',
    });

    const totalAttendees = await Registration.countDocuments({
      eventId: { $in: (await Event.find({ hostId })).map(e => e._id) },
      attendanceStatus: 'present',
    });

    const recentRegistrations = await Registration.find({
      eventId: { $in: (await Event.find({ hostId })).map(e => e._id) },
    })
      .populate('studentId', 'name email')
      .populate('eventId', 'title date')
      .sort({ registeredAt: -1 })
      .limit(5);

    res.json({
      success: true,
      data: {
        stats: { total, upcoming, ongoing, completed, cancelled, pending, totalRegistrations, totalAttendees },
        recentEvents: myEvents,
        recentRegistrations,
      },
    });
  } catch (error) {
    next(error);
  }
};

// @desc  Get host's events
exports.getMyEvents = async (req, res, next) => {
  try {
    const { approvalStatus, eventStatus } = req.query;
    const query = { hostId: req.user._id };
    if (approvalStatus) query.approvalStatus = approvalStatus;
    if (eventStatus) query.eventStatus = eventStatus;

    const events = await Event.find(query)
      .populate('categoryId', 'name color')
      .populate('departmentId', 'name')
      .populate('clubId', 'name')
      .sort({ createdAt: -1 });
    res.json({ success: true, data: events });
  } catch (error) {
    next(error);
  }
};

// @desc  Create event (host)
exports.createEvent = async (req, res, next) => {
  try {
    const hostProfile = await HostProfile.findOne({ userId: req.user._id });
    if (!hostProfile || hostProfile.verificationStatus !== 'approved') {
      return res.status(403).json({ success: false, message: 'Your host account must be approved to create events' });
    }

    const eventData = { ...req.body, hostId: req.user._id, approvalStatus: 'draft' };
    if (req.file) eventData.image = `/uploads/${req.file.filename}`;
    const event = await Event.create(eventData);
    res.status(201).json({ success: true, data: event, message: 'Event created as draft' });
  } catch (error) {
    next(error);
  }
};

// @desc  Update event (host - only own events, only if draft/rejected)
exports.updateEvent = async (req, res, next) => {
  try {
    const event = await Event.findOne({ _id: req.params.id, hostId: req.user._id });
    if (!event) return res.status(404).json({ success: false, message: 'Event not found' });
    if (!['draft', 'rejected'].includes(event.approvalStatus)) {
      return res.status(400).json({ success: false, message: 'Can only edit draft or rejected events' });
    }

    const update = { ...req.body };
    if (req.file) update.image = `/uploads/${req.file.filename}`;
    const updated = await Event.findByIdAndUpdate(req.params.id, update, { new: true });
    res.json({ success: true, data: updated });
  } catch (error) {
    next(error);
  }
};

// @desc  Submit event for approval
exports.submitEvent = async (req, res, next) => {
  try {
    const event = await Event.findOne({ _id: req.params.id, hostId: req.user._id });
    if (!event) return res.status(404).json({ success: false, message: 'Event not found' });
    if (!['draft', 'rejected'].includes(event.approvalStatus)) {
      return res.status(400).json({ success: false, message: 'Event cannot be submitted in its current state' });
    }

    event.approvalStatus = 'pending';
    await event.save();
    res.json({ success: true, data: event, message: 'Event submitted for admin approval' });
  } catch (error) {
    next(error);
  }
};

// @desc  Cancel event (host)
exports.cancelEvent = async (req, res, next) => {
  try {
    const event = await Event.findOne({ _id: req.params.id, hostId: req.user._id });
    if (!event) return res.status(404).json({ success: false, message: 'Event not found' });

    event.eventStatus = 'cancelled';
    await event.save();

    // Notify all registered students
    const registrations = await Registration.find({ eventId: event._id, status: 'registered' });
    const notifications = registrations.map(reg => ({
      userId: reg.studentId,
      title: 'Event Cancelled',
      message: `The event "${event.title}" has been cancelled.`,
      type: 'cancellation',
    }));
    if (notifications.length) await Notification.insertMany(notifications);

    res.json({ success: true, message: 'Event cancelled' });
  } catch (error) {
    next(error);
  }
};

// @desc  Get event participants
exports.getParticipants = async (req, res, next) => {
  try {
    const event = await Event.findOne({ _id: req.params.id, hostId: req.user._id });
    if (!event) return res.status(404).json({ success: false, message: 'Event not found' });

    const registrations = await Registration.find({ eventId: event._id })
      .populate({
        path: 'studentId',
        select: 'name email',
        populate: { path: 'profile', model: 'StudentProfile', populate: { path: 'departmentId', select: 'name' } },
      })
      .sort({ registeredAt: 1 });

    res.json({ success: true, data: { event, registrations } });
  } catch (error) {
    next(error);
  }
};

// @desc  Mark attendance
exports.markAttendance = async (req, res, next) => {
  try {
    const event = await Event.findOne({ _id: req.params.id, hostId: req.user._id });
    if (!event) return res.status(404).json({ success: false, message: 'Event not found' });

    const { attendanceData } = req.body; // [{ registrationId, attendanceStatus }]
    const updates = attendanceData.map(item =>
      Registration.findByIdAndUpdate(item.registrationId, { attendanceStatus: item.attendanceStatus })
    );
    await Promise.all(updates);

    res.json({ success: true, message: 'Attendance marked successfully' });
  } catch (error) {
    next(error);
  }
};

// @desc  Mark certificates for eligible students
exports.markCertificates = async (req, res, next) => {
  try {
    const event = await Event.findOne({ _id: req.params.id, hostId: req.user._id });
    if (!event) return res.status(404).json({ success: false, message: 'Event not found' });

    const { studentIds } = req.body;
    const certs = studentIds.map(studentId => ({
      studentId,
      eventId: event._id,
      status: 'issued',
      issuedAt: new Date(),
    }));

    for (const cert of certs) {
      await Certificate.findOneAndUpdate(
        { studentId: cert.studentId, eventId: cert.eventId },
        cert,
        { upsert: true, new: true }
      );
      await Notification.create({
        userId: cert.studentId,
        title: 'Certificate Issued',
        message: `Your participation certificate for "${event.title}" is ready!`,
        type: 'certificate',
      });
    }

    res.json({ success: true, message: 'Certificates marked successfully' });
  } catch (error) {
    next(error);
  }
};

// @desc  Get host analytics
exports.getAnalytics = async (req, res, next) => {
  try {
    const hostId = req.user._id;
    const events = await Event.find({ hostId });
    const eventIds = events.map(e => e._id);

    const totalRegistrations = await Registration.countDocuments({ eventId: { $in: eventIds }, status: 'registered' });
    const totalAttendees = await Registration.countDocuments({ eventId: { $in: eventIds }, attendanceStatus: 'present' });

    const eventPerformance = await Promise.all(events.slice(0, 10).map(async (event) => {
      const registered = await Registration.countDocuments({ eventId: event._id, status: 'registered' });
      const attended = await Registration.countDocuments({ eventId: event._id, attendanceStatus: 'present' });
      return {
        title: event.title,
        registered,
        attended,
        capacity: event.maxParticipants,
        date: event.date,
      };
    }));

    res.json({ success: true, data: { totalRegistrations, totalAttendees, eventPerformance } });
  } catch (error) {
    next(error);
  }
};

// @desc  Delete event (host - only own draft or rejected events)
exports.deleteEvent = async (req, res, next) => {
  try {
    const event = await Event.findOne({ _id: req.params.id, hostId: req.user._id });
    if (!event) return res.status(404).json({ success: false, message: 'Event not found' });
    if (!['draft', 'rejected'].includes(event.approvalStatus)) {
      return res.status(400).json({ success: false, message: 'Can only delete draft or rejected events' });
    }
    await Event.findByIdAndDelete(req.params.id);
    res.json({ success: true, message: 'Event deleted successfully' });
  } catch (error) {
    next(error);
  }
};

// @desc  Update host profile
exports.updateProfile = async (req, res, next) => {
  try {
    const { name, phone, designation, description } = req.body;
    if (name) {
      await User.findByIdAndUpdate(req.user._id, { name });
    }
    const update = {};
    if (phone !== undefined) update.phone = phone;
    if (designation !== undefined) update.designation = designation;
    if (description !== undefined) update.description = description;

    const profile = await HostProfile.findOneAndUpdate(
      { userId: req.user._id },
      { $set: update },
      { new: true }
    ).populate('departmentId clubId');

    const updatedUser = await User.findById(req.user._id);
    res.json({ success: true, message: 'Profile updated successfully', user: updatedUser, profile });
  } catch (error) {
    next(error);
  }
};
