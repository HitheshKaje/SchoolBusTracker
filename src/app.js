const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const path = require('path');
const errorHandler = require('./middlewares/error.middleware');
const authRoutes = require('./routes/auth.routes');

const app = express();

// Middlewares
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cors());
app.use(helmet({
  contentSecurityPolicy: false, // Disabling for local development ease with Tailwind CDN if used, but we'll use a built file or CDN
}));
app.use(morgan('dev'));

// Static files (Frontend)
app.use(express.static(path.join(__dirname, '../public')));

// API Routes
app.use('/api/auth', authRoutes);
app.use('/api/admin', require('./routes/admin.routes'));
app.use('/api/students', require('./routes/student.routes'));
app.use('/api/parents', require('./routes/parent.routes'));
app.use('/api/drivers', require('./routes/driver.routes'));
app.use('/api/driver-app', require('./routes/driverApp.routes'));
app.use('/api/parent-app', require('./routes/parentApp.routes'));
app.use('/api/buses', require('./routes/bus.routes'));
app.use('/api/routes', require('./routes/route.routes'));
app.use('/api/stops', require('./routes/stop.routes'));
app.use('/api/announcements', require('./routes/announcement.routes'));
app.use('/api/notifications', require('./routes/notification.routes'));
app.use('/api/reports', require('./routes/report.routes'));

// Error Handler
app.use(errorHandler);

module.exports = app;
