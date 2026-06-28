const express = require('express');
const { getStops, getStop, createStop, updateStop, deleteStop } = require('../controllers/stop.controller');
const { protect } = require('../middlewares/auth.middleware');
const { authorize } = require('../middlewares/role.middleware');

const router = express.Router();

router.use(protect);
router.use(authorize('Admin'));

router.route('/')
  .get(getStops)
  .post(createStop);

router.route('/:id')
  .get(getStop)
  .put(updateStop)
  .delete(deleteStop);

module.exports = router;
