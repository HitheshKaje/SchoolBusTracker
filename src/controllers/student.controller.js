const Student = require('../models/Student');
const ApiFeatures = require('../utils/apiFeatures');
const { sendSuccess, sendError } = require('../utils/response');

exports.getStudents = async (req, res, next) => {
  try {
    const baseQuery = { isDeleted: false, institution: req.user.institution };
    
    let features = new ApiFeatures(Student.find(baseQuery).populate('parents assignedBus assignedRoute pickupStop dropoffStop'), req.query)
      .filter()
      .search(['name', 'admissionNumber', 'studentId'])
      .sort()
      .paginate();

    features.searchFields = ['name', 'admissionNumber', 'studentId'];
    await features.countTotal(Student, baseQuery);

    const students = await features.query;

    res.status(200).json({
      success: true,
      message: 'Students fetched successfully',
      data: students,
      pagination: {
        total: features.totalDocuments,
        page: parseInt(req.query.page, 10) || 1,
        limit: parseInt(req.query.limit, 10) || 10
      }
    });
  } catch (error) {
    next(error);
  }
};

exports.getStudent = async (req, res, next) => {
  try {
    const student = await Student.findOne({ _id: req.params.id, isDeleted: false, institution: req.user.institution })
      .populate('parents assignedBus assignedRoute pickupStop dropoffStop');
      
    if (!student) return sendError(res, 404, 'Student not found');
    sendSuccess(res, 200, 'Student fetched successfully', student);
  } catch (error) {
    next(error);
  }
};

exports.createStudent = async (req, res, next) => {
  try {
    const existing = await Student.findOne({ admissionNumber: req.body.admissionNumber });
    if (existing) return sendError(res, 400, 'Student with this admission number already exists');

    const student = await Student.create({
      ...req.body,
      institution: req.user.institution
    });
    sendSuccess(res, 201, 'Student created successfully', student);
  } catch (error) {
    next(error);
  }
};

exports.updateStudent = async (req, res, next) => {
  try {
    const student = await Student.findOneAndUpdate(
      { _id: req.params.id, isDeleted: false, institution: req.user.institution },
      req.body,
      { new: true, runValidators: true }
    );
    if (!student) return sendError(res, 404, 'Student not found');
    sendSuccess(res, 200, 'Student updated successfully', student);
  } catch (error) {
    next(error);
  }
};

exports.deleteStudent = async (req, res, next) => {
  try {
    const student = await Student.findOneAndDelete({ _id: req.params.id, institution: req.user.institution });
    if (!student) return sendError(res, 404, 'Student not found');
    sendSuccess(res, 200, 'Student deleted successfully');
  } catch (error) {
    next(error);
  }
};
