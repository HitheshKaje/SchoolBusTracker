const Announcement = require('../models/Announcement');
const ApiFeatures = require('../utils/apiFeatures');
const { sendSuccess, sendError } = require('../utils/response');

exports.getAnnouncements = async (req, res, next) => {
  try {
    const baseQuery = { institution: req.user.institution };
    let features = new ApiFeatures(Announcement.find(baseQuery), req.query)
      .search(['title', 'content'])
      .sort()
      .paginate();

    features.searchFields = ['title', 'content'];
    await features.countTotal(Announcement, baseQuery);
    const announcements = await features.query;

    res.status(200).json({
      success: true,
      data: announcements,
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

exports.createAnnouncement = async (req, res, next) => {
  try {
    const announcement = await Announcement.create({
      ...req.body,
      institution: req.user.institution
    });
    sendSuccess(res, 201, 'Announcement created', announcement);
  } catch (error) {
    next(error);
  }
};

exports.getAnnouncement = async (req, res, next) => {
  try {
    const announcement = await Announcement.findOne({ _id: req.params.id, institution: req.user.institution });
    if (!announcement) return sendError(res, 404, 'Announcement not found');
    sendSuccess(res, 200, 'Announcement fetched', announcement);
  } catch (error) {
    next(error);
  }
};

exports.updateAnnouncement = async (req, res, next) => {
  try {
    const { title, content, targetAudience } = req.body;
    const announcement = await Announcement.findOneAndUpdate(
      { _id: req.params.id, institution: req.user.institution },
      { title, content, targetAudience },
      { new: true, runValidators: true }
    );
    if (!announcement) return sendError(res, 404, 'Announcement not found');
    sendSuccess(res, 200, 'Announcement updated', announcement);
  } catch (error) {
    next(error);
  }
};

exports.deleteAnnouncement = async (req, res, next) => {
  try {
    const announcement = await Announcement.findOneAndDelete({ _id: req.params.id, institution: req.user.institution });
    if (!announcement) return sendError(res, 404, 'Announcement not found');
    sendSuccess(res, 200, 'Announcement deleted');
  } catch (error) {
    next(error);
  }
};
