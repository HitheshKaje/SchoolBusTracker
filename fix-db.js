const mongoose = require('mongoose');
const User = require('./src/models/User');
const Institution = require('./src/models/Institution');

mongoose.connect('mongodb://127.0.0.1:27017/school_bus_tracker').then(async () => {
  const admins = await User.find({ role: 'Admin', institution: { $exists: false } });
  console.log('Fixing admins without institution:', admins.length);
  for (const admin of admins) {
    const inst = await Institution.create({ name: admin.name + "'s Institution", contactPhone: admin.mobile });
    admin.institution = inst._id;
    await admin.save();
    console.log('Fixed admin:', admin.mobile, 'assigned institution:', inst._id);
  }
  process.exit(0);
}).catch(err => {
  console.error(err);
  process.exit(1);
});
