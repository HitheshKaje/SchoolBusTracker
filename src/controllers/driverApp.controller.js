const Driver = require('../models/Driver');
const Bus = require('../models/Bus');
const Route = require('../models/Route');
const Student = require('../models/Student');
const Stop = require('../models/Stop');
const Announcement = require('../models/Announcement');
const User = require('../models/User');
const { sendSuccess, sendError } = require('../utils/response');

// Helper to get driver's own profile based on authenticated user
const getDriverProfile = async (userId, institutionId) => {
  return await Driver.findOne({ user: userId, institution: institutionId })
    .populate('user')
    .populate({
      path: 'assignedBus',
      populate: {
        path: 'route'
      }
    });
};

exports.getDashboard = async (req, res, next) => {
  try {
    const driver = await getDriverProfile(req.user.id, req.user.institution);
    if (!driver) return sendError(res, 404, 'Driver profile not found');

    let stopsCount = 0;
    let assignedRoute = null;
    
    if (driver.assignedBus && driver.assignedBus.route) {
      assignedRoute = driver.assignedBus.route;
      stopsCount = await Stop.countDocuments({ route: assignedRoute._id, institution: req.user.institution });
    }

    let studentsCount = 0;
    if (driver.assignedBus) {
      studentsCount = await Student.countDocuments({ assignedBus: driver.assignedBus._id, institution: req.user.institution, isDeleted: false });
    }

    // Attach dynamically resolved route to the driver object for frontend compatibility
    const driverObj = driver.toObject();
    driverObj.assignedRoute = assignedRoute;

    const data = {
      profile: driverObj,
      stopsCount,
      studentsCount,
      currentTripStatus: 'Not Started' // Placeholder for future feature
    };

    sendSuccess(res, 200, 'Driver dashboard fetched successfully', data);
  } catch (error) {
    next(error);
  }
};

exports.getAssignedBus = async (req, res, next) => {
  try {
    const driver = await getDriverProfile(req.user.id, req.user.institution);
    if (!driver || !driver.assignedBus) return sendSuccess(res, 200, 'No bus assigned', null);

    // driver.assignedBus is already populated, we can return it directly or fetch it fresh
    const bus = await Bus.findOne({ _id: driver.assignedBus._id, institution: req.user.institution });
    sendSuccess(res, 200, 'Assigned bus fetched successfully', bus);
  } catch (error) {
    next(error);
  }
};

exports.getAssignedRoute = async (req, res, next) => {
  try {
    const driver = await getDriverProfile(req.user.id, req.user.institution);
    
    const assignedRoute = driver && driver.assignedBus ? driver.assignedBus.route : null;
    
    if (!driver || !assignedRoute) return sendSuccess(res, 200, 'No route assigned', null);

    const route = await Route.findOne({ _id: assignedRoute._id, institution: req.user.institution });
    const stops = await Stop.find({ route: route._id, institution: req.user.institution });

    sendSuccess(res, 200, 'Assigned route fetched successfully', { route, stops });
  } catch (error) {
    next(error);
  }
};

exports.getAssignedStudents = async (req, res, next) => {
  try {
    const driver = await getDriverProfile(req.user.id, req.user.institution);
    if (!driver || !driver.assignedBus) return sendSuccess(res, 200, 'No bus assigned', []);

    const students = await Student.find({ assignedBus: driver.assignedBus._id, institution: req.user.institution, isDeleted: false })
      .populate('pickupStop')
      .populate('dropoffStop');
      
    sendSuccess(res, 200, 'Assigned students fetched successfully', students);
  } catch (error) {
    next(error);
  }
};

exports.getNotifications = async (req, res, next) => {
  try {
    // Announcements for Driver or All
    const announcements = await Announcement.find({
      institution: req.user.institution,
      targetAudience: { $in: ['All', 'Driver'] }
    }).sort({ createdAt: -1 });

    sendSuccess(res, 200, 'Notifications fetched successfully', announcements);
  } catch (error) {
    next(error);
  }
};

exports.updateProfile = async (req, res, next) => {
  try {
    const { email, password, profilePhoto } = req.body;
    
    const userToUpdate = {};
    if (email) userToUpdate.email = email;
    if (password) userToUpdate.password = password; // pre-save hook handles hashing
    if (profilePhoto) userToUpdate.profilePhoto = profilePhoto;

    const user = await User.findOneAndUpdate(
      { _id: req.user.id, institution: req.user.institution },
      userToUpdate,
      { new: true, runValidators: true }
    );
    
    // Explicitly re-save to trigger bcrypt hash if password is updated
    if (password) {
      const u = await User.findById(req.user.id);
      u.password = password;
      await u.save();
    }

    sendSuccess(res, 200, 'Profile updated successfully', user);
  } catch (error) {
    next(error);
  }
};
