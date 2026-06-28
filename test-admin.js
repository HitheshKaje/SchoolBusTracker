const http = require('http');

const options = {
  hostname: 'localhost',
  port: 5000,
  path: '/api/auth/login',
  method: 'POST',
  headers: {
    'Content-Type': 'application/json'
  }
};

const req = http.request(options, (res) => {
  let data = '';
  res.on('data', chunk => data += chunk);
  res.on('end', () => {
    const response = JSON.parse(data);
    if(response.success) {
      console.log('Login Success. Token:', response.data.token.substring(0, 20) + '...');
      testDashboard(response.data.token);
    } else {
      console.log('Login failed', response);
    }
  });
});

req.write(JSON.stringify({
  mobile: '1234567890',
  password: 'password123'
}));
req.end();

function testDashboard(token) {
  const getOpt = {
    hostname: 'localhost',
    port: 5000,
    path: '/api/admin/dashboard',
    method: 'GET',
    headers: { 'Authorization': `Bearer ${token}` }
  };
  http.request(getOpt, res => {
    let data = '';
    res.on('data', chunk => data += chunk);
    res.on('end', () => {
      console.log('Dashboard Status:', res.statusCode);
      console.log('Dashboard Data:', data);
    });
  }).end();
}
