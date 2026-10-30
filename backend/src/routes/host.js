const express = require('express');
const router = express.Router();
const { protect, authorize } = require('../middleware/auth');
const upload = require('../middleware/upload');
const hostCtrl = require('../controllers/hostController');

router.use(protect, authorize('host'));

router.get('/dashboard', hostCtrl.getDashboard);
router.get('/events', hostCtrl.getMyEvents);
router.post('/events', upload.single('image'), hostCtrl.createEvent);
router.put('/events/:id', upload.single('image'), hostCtrl.updateEvent);
router.patch('/events/:id/submit', hostCtrl.submitEvent);
router.patch('/events/:id/cancel', hostCtrl.cancelEvent);
router.get('/events/:id/participants', hostCtrl.getParticipants);
router.patch('/events/:id/attendance', hostCtrl.markAttendance);
router.post('/events/:id/certificates', hostCtrl.markCertificates);
router.delete('/events/:id', hostCtrl.deleteEvent);
router.get('/analytics', hostCtrl.getAnalytics);
router.put('/profile', hostCtrl.updateProfile);

module.exports = router;
