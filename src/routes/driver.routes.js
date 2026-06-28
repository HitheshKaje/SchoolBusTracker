const express = require('express');
const { getDrivers, getDriver, createDriver, updateDriver, deleteDriver } = require('../controllers/driver.controller');
const { protect } = require('../middlewares/auth.middleware');
const { authorize } = require('../middlewares/role.middleware');

const router = express.Router();

router.use(protect);
router.use(authorize('Admin'));

router.route('/')
  .get(getDrivers)
  .post(createDriver);

router.route('/:id')
  .get(getDriver)
  .put(updateDriver)
  .delete(deleteDriver);

module.exports = router;
