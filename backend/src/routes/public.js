const express = require('express');
const router = express.Router();
const publicCtrl = require('../controllers/publicController');

router.get('/events', publicCtrl.getPublicEvents);
router.get('/events/:id', publicCtrl.getPublicEvent);
router.get('/departments', publicCtrl.getPublicDepartments);
router.get('/clubs', publicCtrl.getPublicClubs);
router.get('/categories', publicCtrl.getPublicCategories);
router.get('/stats', publicCtrl.getLandingStats);

module.exports = router;
