const Student = require('../models/Student');
const Parent = require('../models/Parent');
const Driver = require('../models/Driver');
const Bus = require('../models/Bus');
const Route = require('../models/Route');
const Trip = require('../models/Trip');
const User = require('../models/User');
const Notification = require('../models/Notification');
const { processLiveTrip } = require('./parentApp.controller');
const Attendance = require('../models/Attendance');
const { sendSuccess, sendError } = require('../utils/response');

// @desc    Get Admin Dashboard Statistics
// @route   GET /api/admin/dashboard
// @access  Private/Admin
exports.getDashboardStats = async (req, res, next) => {
  try {
    const institutionId = req.user.institution; // Using institution scope if applicable, else global
    
    const studentQuery = { isDeleted: false, institution: institutionId };
    const parentQuery = { status: { $ne: 'inactive' }, institution: institutionId };
    const driverQuery = { status: { $ne: 'inactive' }, institution: institutionId };
    const busQuery = { status: { $ne: 'inactive' }, institution: institutionId };
    const routeQuery = { status: { $ne: 'inactive' }, institution: institutionId };

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
      Student.countDocuments(studentQuery),
      Parent.countDocuments(parentQuery),
      Driver.countDocuments(driverQuery),
      Bus.countDocuments(busQuery),
      Route.countDocuments(routeQuery),
      Trip.countDocuments({ status: 'in_progress', institution: institutionId }),
      Trip.countDocuments({ status: 'completed', institution: institutionId }),
      Driver.countDocuments({ ...driverQuery, gpsStatus: 'offline' }),
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

exports.getLiveLocation = async (req, res, next) => {
  try {
    const { busId } = req.params;
    const startOfDay = new Date();
    startOfDay.setHours(0, 0, 0, 0);

    let trip = await Trip.findOne({
      bus: busId,
      status: 'in_progress',
      date: { $gte: startOfDay },
      institution: req.user.institution
    })
    .populate({ path: 'driver', populate: { path: 'user' } })
    .populate('bus')
    .populate({ path: 'route', populate: { path: 'stops', options: { sort: { order: 1 } } } });

    if (trip) {
       // Self-heal: if trip route is missing/orphaned, try to pull it from the bus
       if (!trip.route && trip.bus && trip.bus.route) {
         trip.route = trip.bus.route;
         await trip.save();
         trip = await Trip.findById(trip._id)
           .populate({ path: 'driver', populate: { path: 'user' } })
           .populate('bus')
           .populate({ path: 'route', populate: { path: 'stops', options: { sort: { order: 1 } } } });
       }
       const processedData = processLiveTrip(trip);
       return sendSuccess(res, 200, 'Active trip found', processedData);
    }

    trip = await Trip.findOne({
      bus: busId,
      status: 'completed',
      date: { $gte: startOfDay },
      institution: req.user.institution
    })
    .sort({ endTime: -1 })
    .populate({ path: 'driver', populate: { path: 'user' } })
    .populate('bus')
    .populate({ path: 'route', populate: { path: 'stops', options: { sort: { order: 1 } } } });

    if (trip) {
       // Format for completed trips too so route reverse works
       const processedData = processLiveTrip(trip);
       processedData.status = 'completed';
       return sendSuccess(res, 200, 'Trip completed', processedData);
    }

    return sendSuccess(res, 200, 'No active trip', { status: 'no_trip' });
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
        
        if (driver.assignedBus) {
          return sendError(res, 400, 'This driver is already assigned to a bus. Unassign first.');
        }

        const targetBusForDriver = await Bus.findOne({ _id: targetId, institution: req.user.institution });
        if (!targetBusForDriver) return sendError(res, 404, 'Bus not found');
        if (targetBusForDriver.driver) {
          return sendError(res, 400, 'This bus already has a driver assigned. Unassign first.');
        }

        driver.assignedBus = targetId;
        await driver.save();
        
        await Bus.findOneAndUpdate({ _id: targetId, institution: req.user.institution }, { driver: sourceId });
        break;

      case 'busToRoute':
        const bus = await Bus.findOne({ _id: sourceId, institution: req.user.institution });
        if (!bus) return sendError(res, 404, 'Bus not found');
        
        if (bus.route) {
          return sendError(res, 400, 'This bus is already assigned to a route. Unassign first.');
        }

        const targetRoute = await Route.findOne({ _id: targetId, institution: req.user.institution });
        if (!targetRoute) return sendError(res, 404, 'Route not found');
        if (targetRoute.bus) {
          return sendError(res, 400, 'This route already has a bus assigned. Unassign first.');
        }

        bus.route = targetId;
        await bus.save();
        
        await Route.findOneAndUpdate({ _id: targetId, institution: req.user.institution }, { bus: sourceId });
        break;

      case 'studentToBus':
        const student = await Student.findOne({ _id: sourceId, institution: req.user.institution, isDeleted: false });
        if (!student) return sendError(res, 404, 'Student not found');
        if (student.assignedBus) {
          return sendError(res, 400, 'This student is already assigned to a bus. Unassign first.');
        }

        const targetBusForStudent = await Bus.findOne({ _id: targetId, institution: req.user.institution });
        if (!targetBusForStudent) return sendError(res, 404, 'Bus not found');
        
        const currentStudentsCount = await Student.countDocuments({ assignedBus: targetId, institution: req.user.institution, isDeleted: false });
        if (currentStudentsCount >= targetBusForStudent.capacity) {
          return sendError(res, 400, `Cannot assign student. Bus capacity (${targetBusForStudent.capacity}) has been reached.`);
        }

        await Student.findOneAndUpdate({ _id: sourceId, institution: req.user.institution }, { assignedBus: targetId });
        break;

      case 'studentToRoute':
        await Student.findOneAndUpdate({ _id: sourceId, institution: req.user.institution }, { assignedRoute: targetId });
        break;

      case 'parentToStudent':
        const studentForParent = await Student.findOne({ _id: targetId, institution: req.user.institution, isDeleted: false });
        if (!studentForParent) return sendError(res, 404, 'Student not found');
        if (studentForParent.parents && studentForParent.parents.length > 0) {
          return sendError(res, 400, 'This student is already assigned to a parent. Unassign first.');
        }

        const parent = await Parent.findOne({ _id: sourceId, institution: req.user.institution });
        if (!parent) return sendError(res, 404, 'Parent not found');

        await Parent.findOneAndUpdate({ _id: sourceId, institution: req.user.institution }, { $addToSet: { students: targetId } });
        await Student.findOneAndUpdate({ _id: targetId, institution: req.user.institution }, { $addToSet: { parents: sourceId } });
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
    const studentBuses = await Student.find({ institution, assignedBus: { $ne: null } }).populate('assignedBus');
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
    const parents = await Parent.find({ institution, 'students.0': { $exists: true } }).populate('user students');
    parents.forEach(p => {
      if (p.user && p.students) {
        p.students.forEach(c => {
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
        await Student.findOneAndUpdate({ _id: sourceId, institution: req.user.institution }, { assignedBus: null });
        break;

      case 'studentToRoute':
        await Student.findOneAndUpdate({ _id: sourceId, institution: req.user.institution }, { assignedRoute: null });
        break;

      case 'parentToStudent':
        await Parent.findOneAndUpdate({ _id: sourceId, institution: req.user.institution }, { $pull: { students: targetId } });
        await Student.findOneAndUpdate({ _id: targetId, institution: req.user.institution }, { $pull: { parents: sourceId } });
        break;

      default:
        return sendError(res, 400, 'Invalid assignment type');
    }

    sendSuccess(res, 200, message);
  } catch (error) {
    next(error);
  }
};
