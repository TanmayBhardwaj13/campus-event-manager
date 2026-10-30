const express = require('express');
const router = express.Router();
const { protect, authorize } = require('../middleware/auth');
const upload = require('../middleware/upload');
const adminCtrl = require('../controllers/adminController');

router.use(protect, authorize('admin'));

// Dashboard
router.get('/dashboard', adminCtrl.getDashboardStats);

// Students
router.get('/students', adminCtrl.getStudents);
router.get('/students/:id', adminCtrl.getStudent);
router.patch('/students/:id/status', adminCtrl.updateStudentStatus);

// Hosts
router.get('/hosts', adminCtrl.getHosts);
router.get('/hosts/:id', adminCtrl.getHost);
router.patch('/hosts/:id/status', adminCtrl.updateHostStatus);

// Events
router.get('/events', adminCtrl.getEvents);
router.post('/events', upload.single('image'), adminCtrl.createEvent);
router.get('/events/:id', adminCtrl.getEvent);
router.put('/events/:id', upload.single('image'), adminCtrl.updateEvent);
router.delete('/events/:id', adminCtrl.deleteEvent);
router.patch('/events/:id/status', adminCtrl.updateEventStatus);

// Departments
router.get('/departments', adminCtrl.getDepartments);
router.post('/departments', adminCtrl.createDepartment);
router.put('/departments/:id', adminCtrl.updateDepartment);
router.delete('/departments/:id', adminCtrl.deleteDepartment);

// Clubs
router.get('/clubs', adminCtrl.getClubs);
router.post('/clubs', adminCtrl.createClub);
router.put('/clubs/:id', adminCtrl.updateClub);
router.delete('/clubs/:id', adminCtrl.deleteClub);

// Categories
router.get('/categories', adminCtrl.getCategories);
router.post('/categories', adminCtrl.createCategory);
router.put('/categories/:id', adminCtrl.updateCategory);
router.delete('/categories/:id', adminCtrl.deleteCategory);

// Analytics
router.get('/analytics', adminCtrl.getAnalytics);

// Registrations
router.get('/registrations', adminCtrl.getAllRegistrations);

module.exports = router;
