const express = require('express');
const router = express.Router();
const { protect, authorize } = require('../middleware/auth');
const upload = require('../middleware/upload');
const studentCtrl = require('../controllers/studentController');

router.use(protect, authorize('student'));

router.get('/dashboard', studentCtrl.getDashboard);
router.get('/events', studentCtrl.discoverEvents);
router.get('/events/:id', studentCtrl.getEvent);
router.post('/events/:id/register', studentCtrl.registerForEvent);
router.delete('/events/:id/register', studentCtrl.cancelRegistration);
router.post('/events/:id/save', studentCtrl.saveEvent);
router.delete('/events/:id/save', studentCtrl.unsaveEvent);
router.get('/my-events', studentCtrl.getMyEvents);
router.get('/saved-events', studentCtrl.getSavedEvents);
router.get('/activity', studentCtrl.getActivity);
router.get('/certificates', studentCtrl.getCertificates);
router.get('/notifications', studentCtrl.getNotifications);
router.patch('/notifications/:id/read', studentCtrl.markNotificationRead);
router.patch('/notifications/read-all', studentCtrl.markAllNotificationsRead);
router.get('/profile', studentCtrl.getProfile);
router.put('/profile', upload.single('profileImage'), studentCtrl.updateProfile);

module.exports = router;
