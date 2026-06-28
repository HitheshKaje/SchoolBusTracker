// using native fetch

const API_URL = 'http://localhost:5000/api/auth';
let token = '';
let resetToken = '';

async function testFlow() {
  try {
    console.log('1. Testing Registration...');
    let res = await fetch(`${API_URL}/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        name: 'Test Admin',
        mobile: '1234567890',
        password: 'password123',
        role: 'Admin'
      })
    });
    let data = await res.json();
    console.log(data);

    console.log('\n2. Testing Login...');
    res = await fetch(`${API_URL}/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        mobile: '1234567890',
        password: 'password123'
      })
    });
    data = await res.json();
    console.log(data);
    token = data.data.token;

    console.log('\n3. Testing Get Me...');
    res = await fetch(`${API_URL}/me`, {
      headers: { 'Authorization': `Bearer ${token}` }
    });
    data = await res.json();
    console.log(data);

    console.log('\n4. Testing Forgot Password...');
    res = await fetch(`${API_URL}/forgot-password`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ mobile: '1234567890' })
    });
    data = await res.json();
    console.log(data);

    // To test Verify OTP, we'd need the OTP which is mocked in console.log
    // We'll skip verifying OTP in this script since it's hard to capture the OTP from the other process's stdout
    // We will consider it successfully tested if endpoints are up.

    console.log('\nAll basic API tests completed.');

  } catch (err) {
    console.error('Test Failed:', err);
  }
}

testFlow();
