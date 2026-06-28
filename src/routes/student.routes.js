const express = require('express');
const { getStudents, getStudent, createStudent, updateStudent, deleteStudent } = require('../controllers/student.controller');
const { protect } = require('../middlewares/auth.middleware');
const { authorize } = require('../middlewares/role.middleware');

const router = express.Router();

router.use(protect);
router.use(authorize('Admin'));

router.route('/')
  .get(getStudents)
  .post(createStudent);

router.route('/:id')
  .get(getStudent)
  .put(updateStudent)
  .delete(deleteStudent);

module.exports = router;
