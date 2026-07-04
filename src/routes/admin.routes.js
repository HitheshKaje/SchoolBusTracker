const express = require('express');
const { getDashboardStats, assignResources, getAssignments, unassignResources, getLiveLocation } = require('../controllers/admin.controller');
const { protect } = require('../middlewares/auth.middleware');
const { authorize } = require('../middlewares/role.middleware');

const router = express.Router();

router.use(protect);
router.use(authorize('Admin'));

router.get('/dashboard', getDashboardStats);
router.get('/live-location/:busId', getLiveLocation);
router.get('/assignments', getAssignments);
router.post('/assign', assignResources);
router.post('/unassign', unassignResources);

module.exports = router;
