const express = require('express');
const { exportStudentsExcel, exportStudentsPDF } = require('../controllers/report.controller');
const { protect } = require('../middlewares/auth.middleware');
const { authorize } = require('../middlewares/role.middleware');

const router = express.Router();

router.use(protect);
router.use(authorize('Admin'));

router.get('/students/excel', exportStudentsExcel);
router.get('/students/pdf', exportStudentsPDF);

module.exports = router;
