const express = require('express');
const { getDashboard, getAssignedBus, getAssignedRoute, getAssignedStudents, getNotifications, updateProfile, startTrip, endTrip, updateLocation } = require('../controllers/driverApp.controller');
const { protect } = require('../middlewares/auth.middleware');
const { authorize } = require('../middlewares/role.middleware');

const router = express.Router();

router.use(protect);
router.use(authorize('Driver'));

router.get('/dashboard', getDashboard);
router.get('/bus', getAssignedBus);
router.get('/route', getAssignedRoute);
router.get('/students', getAssignedStudents);
router.get('/notifications', getNotifications);
router.put('/profile', updateProfile);

router.post('/trip/start', startTrip);
router.post('/trip/end', endTrip);
router.post('/trip/location', updateLocation);

module.exports = router;
