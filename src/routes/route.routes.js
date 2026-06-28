const express = require('express');
const { getRoutes, getRoute, createRoute, updateRoute, deleteRoute } = require('../controllers/route.controller');
const { protect } = require('../middlewares/auth.middleware');
const { authorize } = require('../middlewares/role.middleware');

const router = express.Router();

router.use(protect);
router.use(authorize('Admin'));

router.route('/')
  .get(getRoutes)
  .post(createRoute);

router.route('/:id')
  .get(getRoute)
  .put(updateRoute)
  .delete(deleteRoute);

module.exports = router;
