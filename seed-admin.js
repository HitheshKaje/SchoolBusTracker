const mongoose = require('mongoose');
require('dotenv').config();

async function fixAdmin() {
  await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/school_bus_tracker');
  
  const Institution = mongoose.model('Institution', new mongoose.Schema({ name: String }));
  const User = mongoose.model('User', new mongoose.Schema({ mobile: String, institution: mongoose.Schema.Types.ObjectId }, { strict: false }));

  let inst = await Institution.findOne({ name: 'Test Institution' });
  if (!inst) {
    inst = await Institution.create({ name: 'Test Institution' });
  }

  await User.updateOne({ mobile: '1234567890' }, { $set: { institution: inst._id } });
  
  console.log('Admin user updated with institution:', inst._id);
  process.exit(0);
}

fixAdmin();
