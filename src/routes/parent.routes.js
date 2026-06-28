const express = require('express');
const { getParents, getParent, createParent, updateParent, deleteParent } = require('../controllers/parent.controller');
const { protect } = require('../middlewares/auth.middleware');
const { authorize } = require('../middlewares/role.middleware');

const router = express.Router();

router.use(protect);
router.use(authorize('Admin'));

router.route('/')
  .get(getParents)
  .post(createParent);

router.route('/:id')
  .get(getParent)
  .put(updateParent)
  .delete(deleteParent);

module.exports = router;
