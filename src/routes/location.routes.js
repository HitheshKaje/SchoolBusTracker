const express = require('express');
const { updateLocation } = require('../controllers/location.controller');
const { protect } = require('../middlewares/auth.middleware');
const { authorize } = require('../middlewares/role.middleware');

const router = express.Router();

router.use(protect);
router.use(authorize('Admin', 'Driver'));

router.post('/update', updateLocation);

module.exports = router;
