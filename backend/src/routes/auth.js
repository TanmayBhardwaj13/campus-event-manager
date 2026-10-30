const express = require('express');
const router = express.Router();
const {
  registerStudent, loginStudent, registerHost, loginHost, loginAdmin, getMe
} = require('../controllers/authController');
const { protect } = require('../middleware/auth');

router.post('/student/register', registerStudent);
router.post('/student/login', loginStudent);
router.post('/host/register', registerHost);
router.post('/host/login', loginHost);
router.post('/admin/login', loginAdmin);
router.get('/me', protect, getMe);

module.exports = router;
