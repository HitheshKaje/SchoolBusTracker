const mongoose = require('mongoose');
mongoose.connect('mongodb://localhost:27017/school_bus_tracker')
  .then(async () => {
    const db = mongoose.connection.db;
    
    // Check if children collection exists
    const collections = await db.listCollections().toArray();
    const hasChildren = collections.some(c => c.name === 'children');
    
    if (hasChildren) {
      console.log('Renaming children collection to students...');
      await db.renameCollection('children', 'students');
    }
    
    console.log('Updating fields in parents collection...');
    await db.collection('parents').updateMany({}, { $rename: { 'children': 'students' } });
    
    console.log('Updating fields in attendances collection...');
    await db.collection('attendances').updateMany({}, { $rename: { 'child': 'student' } });
    
    console.log('Done');
    process.exit(0);
  }).catch(err => {
    console.error(err);
    process.exit(1);
  });
