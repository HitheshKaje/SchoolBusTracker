const http = require('http');

let token = '';

function request(method, path, body = null) {
  return new Promise((resolve, reject) => {
    const options = {
      hostname: 'localhost',
      port: 5000,
      path: '/api' + path,
      method: method,
      headers: {
        'Content-Type': 'application/json'
      }
    };
    
    if (token) {
      options.headers['Authorization'] = `Bearer ${token}`;
    }

    const req = http.request(options, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        try {
          if (res.statusCode >= 200 && res.statusCode < 300) {
            // PDF/Excel tests won't be JSON
            if (res.headers['content-type'] && res.headers['content-type'].includes('application/json')) {
              resolve(JSON.parse(data));
            } else {
              resolve({ success: true, message: 'File downloaded' });
            }
          } else {
            resolve({ success: false, statusCode: res.statusCode, data: data ? JSON.parse(data) : null });
          }
        } catch (err) {
          resolve({ success: false, error: err.message, raw: data });
        }
      });
    });

    req.on('error', reject);

    if (body) {
      req.write(JSON.stringify(body));
    }
    req.end();
  });
}

async function runTests() {
  console.log('--- Starting Stage 2 E2E Tests ---');

  // 1. Auth Login
  console.log('Testing Login...');
  const loginRes = await request('POST', '/auth/login', { mobile: '1234567890', password: 'password123' });
  if (!loginRes.success) {
    console.error('Login Failed', loginRes);
    return;
  }
  token = loginRes.data.token;
  console.log('Login OK');

  // 2. Dashboard
  const dashRes = await request('GET', '/admin/dashboard');
  console.log('Dashboard GET:', dashRes.success ? 'OK' : 'FAILED');

  // 3. Students
  const cStudent = await request('POST', '/students', { name: 'Test Student', mobile: '999999999' + Math.floor(Math.random()*9), studentId: 'S' + Math.floor(Math.random()*1000), admissionNumber: 'A' + Math.floor(Math.random()*1000) });
  console.log('Student CREATE:', cStudent.success ? 'OK' : 'FAILED', cStudent.data?.message || cStudent.raw || '');
  const studentId = cStudent.data?._id || cStudent.data?.data?._id;

  const gStudents = await request('GET', '/students');
  console.log('Student READ:', gStudents.success ? 'OK' : 'FAILED', gStudents.data?.message || gStudents.raw || '');

  const uStudent = await request('PUT', `/students/${studentId}`, { name: 'Test Student Updated' });
  console.log('Student UPDATE:', uStudent.success ? 'OK' : 'FAILED', uStudent.data?.message || uStudent.raw || '');

  // 4. Parents
  const randNum = Math.floor(Math.random()*10000);
  const cParent = await request('POST', '/parents', { name: 'Test Parent', mobile: '88888' + randNum, email: `test${randNum}@parent.com` });
  console.log('Parent CREATE:', cParent.success ? 'OK' : 'FAILED', cParent.data?.message || cParent.raw || '');
  const parentId = cParent.data?._id || cParent.data?.data?._id;

  const gParents = await request('GET', '/parents');
  console.log('Parent READ:', gParents.success ? 'OK' : 'FAILED');
  
  const gParentId = await request('GET', `/parents/${parentId}`);
  console.log('Parent GET BY ID:', gParentId.success ? 'OK' : 'FAILED');

  // 5. Drivers
  const cDriver = await request('POST', '/drivers', { name: 'Test Driver', mobile: '77777' + Math.floor(Math.random()*10000), licenseNumber: 'LIC' + Math.floor(Math.random()*10000), licenseExpiry: '2030-01-01' });
  console.log('Driver CREATE:', cDriver.success ? 'OK' : 'FAILED', cDriver.data?.message || cDriver.raw || '');
  const driverId = cDriver.data?._id || cDriver.data?.data?._id;

  const gDriverId = await request('GET', `/drivers/${driverId}`);
  console.log('Driver GET BY ID:', gDriverId.success ? 'OK' : 'FAILED');

  // 6. Buses
  const cBus = await request('POST', '/buses', { registrationNumber: 'BUS' + Math.floor(Math.random()*10000), capacity: 40 });
  console.log('Bus CREATE:', cBus.success ? 'OK' : 'FAILED', cBus.data?.message || cBus.raw || '');
  const busId = cBus.data?._id || cBus.data?.data?._id;

  const gBusId = await request('GET', `/buses/${busId}`);
  console.log('Bus GET BY ID:', gBusId.success ? 'OK' : 'FAILED');

  // 7. Routes
  const cRoute = await request('POST', '/routes', { routeNumber: 'R' + Math.floor(Math.random()*1000), name: 'Main Route' });
  console.log('Route CREATE:', cRoute.success ? 'OK' : 'FAILED', cRoute.data?.message || cRoute.raw || '');
  const routeId = cRoute.data?._id || cRoute.data?.data?._id;

  const gRouteId = await request('GET', `/routes/${routeId}`);
  console.log('Route GET BY ID:', gRouteId.success ? 'OK' : 'FAILED');

  // 8. Assignments
  const assignRes = await request('POST', '/admin/assign', { type: 'driverToBus', sourceId: driverId, targetId: busId });
  console.log('Assignment POST:', assignRes.success ? 'OK' : 'FAILED', assignRes.data?.message || assignRes.raw || '');

  // 9. Stops
  const cStop = await request('POST', '/stops', { name: 'Stop 1', route: routeId, latitude: 12.9716, longitude: 77.5946 });
  console.log('Stop CREATE:', cStop.success ? 'OK' : 'FAILED', cStop.data?.message || cStop.raw || '');
  const stopId = cStop.data?._id || cStop.data?.data?._id;

  if (stopId) {
    const gStopId = await request('GET', `/stops/${stopId}`);
    console.log('Stop GET BY ID:', gStopId.success ? 'OK' : 'FAILED');
  }

  // 10. Announcements
  const cAnnounce = await request('POST', '/announcements', { title: 'Test Announce', content: 'Hello World', targetAudience: 'All' });
  console.log('Announcement CREATE:', cAnnounce.success ? 'OK' : 'FAILED', cAnnounce.data?.message || cAnnounce.raw || '');
  const announceId = cAnnounce.data?._id || cAnnounce.data?.data?._id;

  if (announceId) {
    const gAnnounceId = await request('GET', `/announcements/${announceId}`);
    console.log('Announcement GET BY ID:', gAnnounceId.success ? 'OK' : 'FAILED');
  }

  // 11. Notifications
  const cNotify = await request('POST', '/notifications/broadcast', { title: 'Test Notify', body: 'Alert!', type: 'info', role: 'All' });
  console.log('Notification BROADCAST:', cNotify.success ? 'OK' : 'FAILED', cNotify.data?.message || cNotify.raw || '');

  // 12. Reports
  const rExcel = await request('GET', '/reports/students/excel');
  console.log('Report EXCEL:', rExcel.success ? 'OK' : 'FAILED');
  
  const rPdf = await request('GET', '/reports/students/pdf');
  console.log('Report PDF:', rPdf.success ? 'OK' : 'FAILED');

  // Cleanup
  console.log('\nCleaning up created entities...');
  await request('DELETE', `/students/${studentId}`);
  await request('DELETE', `/parents/${parentId}`);
  await request('DELETE', `/drivers/${driverId}`);
  await request('DELETE', `/buses/${busId}`);
  await request('DELETE', `/routes/${routeId}`);
  if(cStop.data && cStop.data._id) await request('DELETE', `/stops/${cStop.data._id}`);
  if(cAnnounce.data && cAnnounce.data._id) await request('DELETE', `/announcements/${cAnnounce.data._id}`);
  
  console.log('\n--- All Tests Completed ---');
}

runTests();
