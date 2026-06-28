const Notification = require('../models/Notification');
const User = require('../models/User');
const { sendSuccess, sendError } = require('../utils/response');

exports.getNotifications = async (req, res, next) => {
  try {
    // Admin checking notifications for themselves
    const notifications = await Notification.find({ recipient: req.user._id }).sort('-createdAt');
    sendSuccess(res, 200, 'Notifications fetched', notifications);
  } catch (error) {
    next(error);
  }
};

exports.createBroadcast = async (req, res, next) => {
  try {
    // Broadcast notification to a specific role or all users under this institution
    const { title, body, type, role } = req.body;
    
    let filter = { institution: req.user.institution };
    if (role && role !== 'All') {
      filter.role = role;
    }

    const users = await User.find(filter);
    
    const notifications = users.map(user => ({
      recipient: user._id,
      title,
      body,
      type: type || 'info'
    }));

    if (notifications.length > 0) {
      await Notification.insertMany(notifications);
    }

    sendSuccess(res, 201, `Broadcast sent to ${notifications.length} users`);
  } catch (error) {
    next(error);
  }
};

exports.markAsRead = async (req, res, next) => {
  try {
    await Notification.findOneAndUpdate({ _id: req.params.id, recipient: req.user._id }, { readStatus: true });
    sendSuccess(res, 200, 'Notification marked as read');
  } catch (error) {
    next(error);
  }
};

exports.deleteNotification = async (req, res, next) => {
  try {
    await Notification.findOneAndDelete({ _id: req.params.id, recipient: req.user._id });
    sendSuccess(res, 200, 'Notification deleted');
  } catch (error) {
    next(error);
  }
};
