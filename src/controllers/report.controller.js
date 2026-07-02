const exceljs = require('exceljs');
const PDFDocument = require('pdfkit');
const Student = require('../models/Student');
const Attendance = require('../models/Attendance');

// Generalized Excel export for Students (example)
exports.exportStudentsExcel = async (req, res, next) => {
  try {
    const students = await Student.find({ institution: req.user.institution, isDeleted: false })
      .populate('assignedBus assignedRoute');

    const workbook = new exceljs.Workbook();
    const worksheet = workbook.addWorksheet('Students');

    worksheet.columns = [
      { header: 'Admission No', key: 'admissionNumber', width: 15 },
      { header: 'Student ID', key: 'studentId', width: 15 },
      { header: 'Name', key: 'name', width: 25 },
      { header: 'Gender', key: 'gender', width: 10 },
      { header: 'Grade', key: 'grade', width: 10 },
      { header: 'Assigned Bus', key: 'assignedBus', width: 20 },
      { header: 'Assigned Route', key: 'assignedRoute', width: 20 },
    ];

    students.forEach(student => {
      worksheet.addRow({
        admissionNumber: student.admissionNumber,
        studentId: student.studentId,
        name: student.name,
        gender: student.gender,
        grade: student.grade,
        assignedBus: student.assignedBus ? student.assignedBus.registrationNumber : 'N/A',
        assignedRoute: student.assignedRoute ? student.assignedRoute.name : 'N/A'
      });
    });

    res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
    res.setHeader('Content-Disposition', 'attachment; filename=' + 'students_report.xlsx');

    await workbook.xlsx.write(res);
    res.status(200).end();
  } catch (error) {
    next(error);
  }
};

// Generalized PDF export for Students (example)
exports.exportStudentsPDF = async (req, res, next) => {
  try {
    const students = await Student.find({ institution: req.user.institution, isDeleted: false });

    const doc = new PDFDocument();
    let filename = 'students_report.pdf';
    
    res.setHeader('Content-disposition', 'attachment; filename="' + filename + '"');
    res.setHeader('Content-type', 'application/pdf');

    doc.pipe(res);

    doc.fontSize(20).text('Student Roster Report', { align: 'center' });
    doc.moveDown();

    students.forEach(student => {
      doc.fontSize(12).text(`Name: ${student.name} | ID: ${student.studentId} | Grade: ${student.grade || 'N/A'}`);
    });

    doc.end();
  } catch (error) {
    next(error);
  }
};
