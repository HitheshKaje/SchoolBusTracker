const express = require('express');
const { getDashboard, getChildren, getAssignedBuses, getAssignedRoutes, getAssignedDrivers, getNotifications, getTripHistory, getProfile, updateProfile, getLiveLocation } = require('../controllers/parentApp.controller');
const { protect } = require('../middlewares/auth.middleware');
const { authorize } = require('../middlewares/role.middleware');

const router = express.Router();

router.use(protect);
router.use(authorize('Parent'));

router.get('/dashboard', getDashboard);
router.get('/children', getChildren);
router.get('/buses', getAssignedBuses);
router.get('/routes', getAssignedRoutes);
router.get('/drivers', getAssignedDrivers);
router.get('/live-location', getLiveLocation);
router.get('/notifications', getNotifications);
router.get('/trips', getTripHistory);
router.get('/profile', getProfile);
router.put('/profile', updateProfile);

module.exports = router;
