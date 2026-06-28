const express = require('express');
const { getBuses, getBus, createBus, updateBus, deleteBus } = require('../controllers/bus.controller');
const { protect } = require('../middlewares/auth.middleware');
const { authorize } = require('../middlewares/role.middleware');

const router = express.Router();

router.use(protect);
router.use(authorize('Admin'));

router.route('/')
  .get(getBuses)
  .post(createBus);

router.route('/:id')
  .get(getBus)
  .put(updateBus)
  .delete(deleteBus);

module.exports = router;
