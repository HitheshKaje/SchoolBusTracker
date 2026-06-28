const express = require('express');
const { getNotifications, createBroadcast, markAsRead, deleteNotification } = require('../controllers/notification.controller');
const { protect } = require('../middlewares/auth.middleware');
const { authorize } = require('../middlewares/role.middleware');

const router = express.Router();

router.use(protect);

// Users can read/delete their own notifications
router.get('/', getNotifications);
router.put('/:id/read', markAsRead);
router.delete('/:id', deleteNotification);

// Only admins can broadcast
router.post('/broadcast', authorize('Admin'), createBroadcast);

module.exports = router;
