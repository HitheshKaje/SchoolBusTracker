const Child = require('../models/Child');
const Parent = require('../models/Parent');
const Driver = require('../models/Driver');
const Bus = require('../models/Bus');
const Route = require('../models/Route');
const Trip = require('../models/Trip');
const Notification = require('../models/Notification');
const Attendance = require('../models/Attendance');
const { sendSuccess, sendError } = require('../utils/response');

// @desc    Get Admin Dashboard Statistics
// @route   GET /api/admin/dashboard
// @access  Private/Admin
exports.getDashboardStats = async (req, res, next) => {
  try {
    const institutionId = req.user.institution; // Using institution scope if applicable, else global
    
    // Base filter
    const filter = institutionId ? { institution: institutionId, isDeleted: { $ne: true } } : { isDeleted: { $ne: true } };
    const baseFilter = institutionId ? { institution: institutionId } : {};

    const [
      totalStudents,
      totalParents,
      totalDrivers,
      totalBuses,
      totalRoutes,
      activeTrips,
      completedTrips,
      offlineDrivers,
      unreadNotifications
    ] = await Promise.all([
      Child.countDocuments(filter),
      Parent.countDocuments({ status: 'active' }), // Simplified for now
      Driver.countDocuments({ status: 'active' }),
      Bus.countDocuments(baseFilter),
      Route.countDocuments(baseFilter),
      Trip.countDocuments({ status: 'in_progress' }), // Simplified assumption
      Trip.countDocuments({ status: 'completed' }),
      Driver.countDocuments({ gpsStatus: 'offline', status: 'active' }),
      Notification.countDocuments({ recipient: req.user._id, readStatus: false })
    ]);

    sendSuccess(res, 200, 'Dashboard statistics fetched successfully', {
      statistics: {
        totalStudents,
        totalParents,
        totalDrivers,
        totalBuses,
        totalRoutes,
        todaysTrips: activeTrips + completedTrips,
        activeTrips,
        offlineDrivers,
        completedTrips,
        pendingNotifications: unreadNotifications
      }
    });
  } catch (error) {
    next(error);
  }
};

const mongoose = require('mongoose');

// @desc    Assign relationships (e.g. Driver->Bus, Bus->Route, etc)
// @route   POST /api/admin/assign
// @access  Private/Admin
exports.assignResources = async (req, res, next) => {
  try {
    const { type, sourceId, targetId } = req.body;

    if (!type || !sourceId || !targetId) {
      return sendError(res, 400, 'Please provide type, sourceId, and targetId');
    }

    if (!mongoose.Types.ObjectId.isValid(sourceId) || !mongoose.Types.ObjectId.isValid(targetId)) {
      return sendError(res, 400, 'Invalid Source or Target ID format. Must be a valid 24-character MongoDB ObjectId.');
    }

    let message = 'Assignment successful';

    switch (type) {
      case 'driverToBus':
        const driver = await Driver.findOne({ _id: sourceId, institution: req.user.institution });
        if (!driver) return sendError(res, 404, 'Driver not found');
        
        // Prevent duplicate assigning
        if (driver.assignedBus && driver.assignedBus.toString() === targetId) {
          return sendError(res, 400, 'Driver is already assigned to this bus');
        }

        driver.assignedBus = targetId;
        await driver.save();
        
        await Bus.findOneAndUpdate({ _id: targetId, institution: req.user.institution }, { driver: sourceId });
        break;

      case 'busToRoute':
        const bus = await Bus.findOne({ _id: sourceId, institution: req.user.institution });
        if (!bus) return sendError(res, 404, 'Bus not found');
        
        if (bus.route && bus.route.toString() === targetId) {
          return sendError(res, 400, 'Bus is already assigned to this route');
        }

        bus.route = targetId;
        await bus.save();
        
        await Route.findOneAndUpdate({ _id: targetId, institution: req.user.institution }, { bus: sourceId });
        break;

      case 'studentToBus':
        await Child.findOneAndUpdate({ _id: sourceId, institution: req.user.institution }, { assignedBus: targetId });
        break;

      case 'studentToRoute':
        await Child.findOneAndUpdate({ _id: sourceId, institution: req.user.institution }, { assignedRoute: targetId });
        break;

      case 'parentToStudent':
        await Parent.findOneAndUpdate({ _id: sourceId, institution: req.user.institution }, { $addToSet: { children: targetId } });
        await Child.findOneAndUpdate({ _id: targetId, institution: req.user.institution }, { $addToSet: { parents: sourceId } });
        break;

      default:
        return sendError(res, 400, 'Invalid assignment type');
    }

    sendSuccess(res, 200, message);
  } catch (error) {
    next(error);
  }
};

// @desc    Get Current Assignments
// @route   GET /api/admin/assignments
// @access  Private/Admin
exports.getAssignments = async (req, res, next) => {
  try {
    const institution = req.user.institution;
    const assignments = [];

    // Driver to Bus
    const drivers = await Driver.find({ institution, assignedBus: { $ne: null } }).populate('user assignedBus');
    drivers.forEach(d => {
      if (d.user && d.assignedBus) {
        assignments.push({
          type: 'driverToBus',
          sourceId: d._id,
          targetId: d.assignedBus._id,
          sourceName: `${d.user.name}`,
          targetName: `${d.assignedBus.registrationNumber}`,
          status: d.status || 'active'
        });
      }
    });

    // Bus to Route
    const buses = await Bus.find({ institution, route: { $ne: null } }).populate('route');
    buses.forEach(b => {
      if (b.route) {
        assignments.push({
          type: 'busToRoute',
          sourceId: b._id,
          targetId: b.route._id,
          sourceName: `${b.registrationNumber}`,
          targetName: `${b.route.name}`,
          status: b.status || 'active'
        });
      }
    });

    // Student to Bus
    const studentBuses = await Child.find({ institution, assignedBus: { $ne: null } }).populate('assignedBus');
    studentBuses.forEach(s => {
      if (s.assignedBus) {
        assignments.push({
          type: 'studentToBus',
          sourceId: s._id,
          targetId: s.assignedBus._id,
          sourceName: `${s.name} (${s.admissionNumber})`,
          targetName: `${s.assignedBus.registrationNumber}`,
          status: s.status || 'active'
        });
      }
    });

    // Parent to Student
    const parents = await Parent.find({ institution, 'children.0': { $exists: true } }).populate('user children');
    parents.forEach(p => {
      if (p.user && p.children) {
        p.children.forEach(c => {
          assignments.push({
            type: 'parentToStudent',
            sourceId: p._id,
            targetId: c._id,
            sourceName: `${p.user.name}`,
            targetName: `${c.name} (${c.admissionNumber})`,
            status: p.status || 'active'
          });
        });
      }
    });

    sendSuccess(res, 200, 'Assignments fetched', assignments);
  } catch (error) {
    next(error);
  }
};

// @desc    Unassign relationships
// @route   POST /api/admin/unassign
// @access  Private/Admin
exports.unassignResources = async (req, res, next) => {
  try {
    const { type, sourceId, targetId } = req.body;

    if (!type || !sourceId || !targetId) {
      return sendError(res, 400, 'Please provide type, sourceId, and targetId');
    }

    if (!mongoose.Types.ObjectId.isValid(sourceId) || !mongoose.Types.ObjectId.isValid(targetId)) {
      return sendError(res, 400, 'Invalid Source or Target ID format.');
    }

    let message = 'Unassigned successfully';

    switch (type) {
      case 'driverToBus':
        await Driver.findOneAndUpdate({ _id: sourceId, institution: req.user.institution }, { assignedBus: null });
        await Bus.findOneAndUpdate({ _id: targetId, institution: req.user.institution }, { driver: null });
        break;

      case 'busToRoute':
        await Bus.findOneAndUpdate({ _id: sourceId, institution: req.user.institution }, { route: null });
        await Route.findOneAndUpdate({ _id: targetId, institution: req.user.institution }, { bus: null });
        break;

      case 'studentToBus':
        await Child.findOneAndUpdate({ _id: sourceId, institution: req.user.institution }, { assignedBus: null });
        break;

      case 'studentToRoute':
        await Child.findOneAndUpdate({ _id: sourceId, institution: req.user.institution }, { assignedRoute: null });
        break;

      case 'parentToStudent':
        await Parent.findOneAndUpdate({ _id: sourceId, institution: req.user.institution }, { $pull: { children: targetId } });
        await Child.findOneAndUpdate({ _id: targetId, institution: req.user.institution }, { $pull: { parents: sourceId } });
        break;

      default:
        return sendError(res, 400, 'Invalid assignment type');
    }

    sendSuccess(res, 200, message);
  } catch (error) {
    next(error);
  }
};
