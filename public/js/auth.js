// Centralized Auth Logic and API Calls
const API_URL = 'http://localhost:5000/api/auth';

// Helper for displaying messages
const showMessage = (elementId, message, isError = false) => {
  const el = document.getElementById(elementId);
  if (!el) return;
  el.textContent = message;
  el.className = `mt-4 p-3 rounded-lg text-sm ${isError ? 'bg-red-50 text-red-600 border border-red-200' : 'bg-green-50 text-green-600 border border-green-200'}`;
  el.classList.remove('hidden');
};

// API Call Wrapper
const apiCall = async (endpoint, method, body, requiresAuth = false) => {
  const headers = { 'Content-Type': 'application/json' };

  if (requiresAuth) {
    const token = localStorage.getItem('token');
    if (token) headers['Authorization'] = `Bearer ${token}`;
  }

  try {
    const response = await fetch(`${API_URL}${endpoint}`, {
      method,
      headers,
      body: body ? JSON.stringify(body) : null
    });
    const data = await response.json();
    return { status: response.status, data };
  } catch (error) {
    return { status: 500, data: { success: false, message: 'Network error occurred' } };
  }
};

// Redirect based on role
const handleAuthSuccess = (token, user) => {
  localStorage.setItem('token', token);
  localStorage.setItem('user', JSON.stringify(user));

  setTimeout(() => {
    switch (user.role) {
      case 'Admin': window.location.href = '/admin/dashboard.html'; break;
      case 'Driver': window.location.href = '/dashboard-driver.html'; break;
      case 'Parent': window.location.href = '/dashboard-parent.html'; break;
      default: window.location.href = '/';
    }
  }, 1000);
};

// --- Organization Search Autocomplete ---
const orgSearchInput = document.getElementById('orgSearchInput');
if (orgSearchInput) {
  const orgDropdown = document.getElementById('orgDropdown');
  const orgName = document.getElementById('orgName');
  const orgDisplayName = document.getElementById('orgDisplayName');
  const orgAddress = document.getElementById('orgAddress');
  const orgLat = document.getElementById('orgLat');
  const orgLon = document.getElementById('orgLon');
  const orgOsmId = document.getElementById('orgOsmId');
  let debounceTimer;

  const renderDropdownItem = (text, onClick) => {
    const li = document.createElement('li');
    li.className = 'px-4 py-3 hover:bg-primary-50 cursor-pointer border-b border-gray-100 last:border-0 text-sm text-gray-700';
    li.textContent = text;
    if (onClick) li.onclick = onClick;
    return li;
  };

  orgSearchInput.addEventListener('input', (e) => {
    const query = e.target.value.trim();

    // Reset hidden fields on input change to prevent stale data
    orgName.value = '';
    orgDisplayName.value = '';
    orgAddress.value = '';
    orgLat.value = '';
    orgLon.value = '';
    orgOsmId.value = '';

    if (query.length < 3) {
      orgDropdown.classList.add('hidden');
      return;
    }

    clearTimeout(debounceTimer);

    orgDropdown.innerHTML = '';
    orgDropdown.appendChild(renderDropdownItem('Searching...'));
    orgDropdown.classList.remove('hidden');

    debounceTimer = setTimeout(async () => {
      try {
        const response = await fetch(`https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(query)}&format=json&limit=5&addressdetails=1`);
        if (!response.ok) throw new Error('API Error');

        const data = await response.json();
        orgDropdown.innerHTML = '';

        if (data.length === 0) {
          orgDropdown.appendChild(renderDropdownItem('No organizations found.'));
          return;
        }

        data.forEach(place => {
          const displayName = place.display_name;
          const name = place.name || displayName.split(',')[0];
          const li = renderDropdownItem(displayName, () => {
            orgSearchInput.value = name;
            orgName.value = name;
            orgDisplayName.value = displayName;
            orgAddress.value = displayName;
            orgLat.value = place.lat;
            orgLon.value = place.lon;
            orgOsmId.value = place.osm_id;
            orgDropdown.classList.add('hidden');
          });
          orgDropdown.appendChild(li);
        });
      } catch (error) {
        orgDropdown.innerHTML = '';
        orgDropdown.appendChild(renderDropdownItem('Unable to search organizations. Please try again.'));
      }
    }, 400); // 400ms debounce
  });

  // Close dropdown when clicking outside
  document.addEventListener('click', (e) => {
    if (!orgSearchInput.contains(e.target) && !orgDropdown.contains(e.target)) {
      orgDropdown.classList.add('hidden');
    }
  });
}

// --- Form Handlers ---

// Register Form
const registerForm = document.getElementById('registerForm');
if (registerForm) {
  registerForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    const btn = document.getElementById('registerBtn');
    btn.disabled = true;
    btn.textContent = 'Processing...';

    const formData = new FormData(registerForm);
    const body = Object.fromEntries(formData.entries());

    const { status, data } = await apiCall('/register', 'POST', body);

    if (data.success) {
      showMessage('formMessage', 'Account created successfully. Please sign in.');
      setTimeout(() => {
        window.location.href = '/login.html?type=org';
      }, 1500);
    } else {
      showMessage('formMessage', data.message || 'Registration failed', true);
      btn.disabled = false;
      btn.textContent = 'Create Account';
    }
  });
}

// Login Form
const loginForm = document.getElementById('loginForm');
if (loginForm) {
  const urlParams = new URLSearchParams(window.location.search);
  const type = urlParams.get('type') || 'user';

  const loginTitle = document.getElementById('loginTitle');
  const loginSubtitle = document.getElementById('loginSubtitle');

  if (loginTitle && loginSubtitle) {
    if (type === 'org') {
      loginTitle.textContent = 'Organization Login';
      loginSubtitle.innerHTML = 'Or <a href="/register.html" class="font-medium text-primary-600 hover:text-primary-500 transition-colors">create a new organization account</a>';
    } else {
      loginTitle.textContent = 'Parent / Driver Login';
      loginSubtitle.innerHTML = 'Organization Administrators must use the <a href="/login.html?type=org" class="font-medium text-primary-600 hover:text-primary-500 transition-colors">Organization Login</a>.';
    }
  }

  loginForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    const btn = document.getElementById('loginBtn');
    btn.disabled = true;
    btn.textContent = 'Logging in...';

    const formData = new FormData(loginForm);
    const body = Object.fromEntries(formData.entries());
    body.loginType = type;

    const { status, data } = await apiCall('/login', 'POST', body);

    if (data.success) {
      showMessage('formMessage', 'Login successful! Redirecting...');
      handleAuthSuccess(data.data.token, data.data.user);
    } else {
      showMessage('formMessage', data.message || 'Login failed', true);
      btn.disabled = false;
      btn.textContent = 'Sign In';
    }
  });
}

// Forgot Password Form
const forgotForm = document.getElementById('forgotForm');
if (forgotForm) {
  forgotForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    const btn = document.getElementById('forgotBtn');
    btn.disabled = true;
    btn.textContent = 'Sending...';

    const mobile = document.getElementById('mobile').value;

    const { status, data } = await apiCall('/forgot-password', 'POST', { mobile });

    if (data.success) {
      showMessage('formMessage', 'OTP sent successfully! Redirecting...');
      // Store mobile temporarily for the next step
      sessionStorage.setItem('resetMobile', mobile);
      setTimeout(() => {
        window.location.href = '/verify-otp.html';
      }, 1500);
    } else {
      showMessage('formMessage', data.message || 'Failed to send OTP', true);
      btn.disabled = false;
      btn.textContent = 'Send OTP via SMS';
    }
  });
}

// Verify OTP Form
const otpForm = document.getElementById('otpForm');
if (otpForm) {
  // Pre-fill mobile if available
  const resetMobile = sessionStorage.getItem('resetMobile');
  if (resetMobile) {
    document.getElementById('mobileDisplay').textContent = resetMobile;
  } else {
    window.location.href = '/forgot-password.html'; // redirect back if missing
  }

  otpForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    const btn = document.getElementById('verifyBtn');
    btn.disabled = true;
    btn.textContent = 'Verifying...';

    // Get 6 digit OTP from the 6 inputs
    const inputs = document.querySelectorAll('.otp-input');
    let otp = '';
    inputs.forEach(i => otp += i.value);

    const { status, data } = await apiCall('/verify-otp', 'POST', { mobile: resetMobile, otp });

    if (data.success) {
      showMessage('formMessage', 'OTP Verified! Redirecting...');
      sessionStorage.setItem('resetToken', data.data.resetToken);
      setTimeout(() => {
        window.location.href = '/reset-password.html';
      }, 1500);
    } else {
      showMessage('formMessage', data.message || 'Invalid OTP', true);
      btn.disabled = false;
      btn.textContent = 'Verify OTP';
    }
  });
  const resendBtn = document.getElementById("resendBtn");

  if (resendBtn) {
    resendBtn.addEventListener("click", async () => {

      resendBtn.disabled = true;
      resendBtn.textContent = "Sending...";

      const mobile = sessionStorage.getItem("resetMobile");

      const { data } = await apiCall(
        "/forgot-password",
        "POST",
        { mobile }
      );

      if (data.success) {
        showMessage("formMessage", "OTP resent successfully.");
      } else {
        showMessage(
          "formMessage",
          data.message || "Failed to resend OTP",
          true
        );
      }

      resendBtn.disabled = false;
      resendBtn.textContent = "Resend";
    });
  }

  // OTP Input navigation logic
  const inputs = document.querySelectorAll('.otp-input');
  inputs.forEach((input, index) => {
    input.addEventListener('keyup', (e) => {
      if (e.key >= 0 && e.key <= 9) {
        if (index < inputs.length - 1) inputs[index + 1].focus();
      } else if (e.key === 'Backspace') {
        if (index > 0) inputs[index - 1].focus();
      }
    });
  });
}

// Reset Password Form
const resetForm = document.getElementById('resetForm');
if (resetForm) {
  const resetToken = sessionStorage.getItem('resetToken');
  if (!resetToken) window.location.href = '/forgot-password.html';

  resetForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    const btn = document.getElementById('resetBtn');

    const newPassword = document.getElementById('newPassword').value;
    const confirmPassword = document.getElementById('confirmPassword').value;

    if (newPassword !== confirmPassword) {
      showMessage('formMessage', 'Passwords do not match', true);
      return;
    }

    btn.disabled = true;
    btn.textContent = 'Updating...';

    const { status, data } = await apiCall('/reset-password', 'POST', { resetToken, newPassword });

    if (data.success) {
      showMessage('formMessage', 'Password updated successfully! Logging you in...');
      sessionStorage.removeItem('resetMobile');
      sessionStorage.removeItem('resetToken');
      // Auto login logic - if backend sends token, use it
      if (data.data && data.data.token) {
        // for simplicity, redirect to login page for them to login with new password
        setTimeout(() => window.location.href = '/login.html', 2000);
      } else {
        setTimeout(() => window.location.href = '/login.html', 2000);
      }
    } else {
      showMessage('formMessage', data.message || 'Failed to reset password', true);
      btn.disabled = false;
      btn.textContent = 'Set New Password';
    }
  });
}

// Logout logic
const logoutBtn = document.getElementById('logoutBtn');
if (logoutBtn) {
  logoutBtn.addEventListener('click', async () => {
    await apiCall('/logout', 'POST', {}, true);
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    window.location.href = '/login.html';
  });
}
