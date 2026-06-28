const assignTypeSelect = document.getElementById('assignType');
const sourceSelect = document.getElementById('sourceId');
const targetSelect = document.getElementById('targetId');
const sourceLabel = document.getElementById('sourceLabel');
const targetLabel = document.getElementById('targetLabel');
const loadingIndicator = document.getElementById('loadingIndicator');
const sourceTargetContainer = document.getElementById('sourceTargetContainer');
const assignmentsTableBody = document.getElementById('assignmentsTableBody');
const assignMessage = document.getElementById('assignMessage');

let cachedData = {
  drivers: null,
  buses: null,
  routes: null,
  students: null,
  parents: null
};

// Map friendly names to endpoints
const endpoints = {
  drivers: '/api/drivers?limit=10000',
  buses: '/api/buses?limit=10000',
  routes: '/api/routes?limit=10000',
  students: '/api/students?limit=10000',
  parents: '/api/parents?limit=10000'
};

async function fetchEntity(entity) {
  if (cachedData[entity]) return cachedData[entity];
  const res = await apiFetch(endpoints[entity]);
  if (res && res.data) {
    cachedData[entity] = res.data;
    return res.data;
  }
  return [];
}

function populateSelect(selectElement, data, valueField, textField, defaultText) {
  selectElement.innerHTML = `<option value="" disabled selected>${defaultText}</option>`;
  if (data.length === 0) {
    selectElement.innerHTML += `<option value="" disabled>No records available</option>`;
    return;
  }
  data.forEach(item => {
    let text = textField(item);
    selectElement.innerHTML += `<option value="${item[valueField]}">${text}</option>`;
  });
}

function showMessage(msg, isSuccess = true) {
  assignMessage.classList.remove('hidden');
  assignMessage.className = `mt-2 text-sm ${isSuccess ? 'text-green-600' : 'text-red-600'}`;
  assignMessage.innerText = msg;
  setTimeout(() => assignMessage.classList.add('hidden'), 5000);
}

assignTypeSelect.addEventListener('change', async (e) => {
  const type = e.target.value;
  if (!type) return;

  sourceTargetContainer.classList.add('hidden');
  loadingIndicator.classList.remove('hidden');

  let sourceData = [];
  let targetData = [];

  try {
    switch (type) {
      case 'driverToBus':
        sourceLabel.innerText = "Driver";
        targetLabel.innerText = "Bus";
        sourceData = await fetchEntity('drivers');
        targetData = await fetchEntity('buses');
        populateSelect(sourceSelect, sourceData, '_id', d => `${d.user?.name || 'Unknown'} (${d.licenseNumber})`, "Select Driver");
        populateSelect(targetSelect, targetData, '_id', b => `${b.registrationNumber} (Cap: ${b.capacity})`, "Select Bus");
        break;
      
      case 'busToRoute':
        sourceLabel.innerText = "Bus";
        targetLabel.innerText = "Route";
        sourceData = await fetchEntity('buses');
        targetData = await fetchEntity('routes');
        populateSelect(sourceSelect, sourceData, '_id', b => `${b.registrationNumber} (Cap: ${b.capacity})`, "Select Bus");
        populateSelect(targetSelect, targetData, '_id', r => `${r.name} (${r.stops?.length || 0} stops)`, "Select Route");
        break;

      case 'studentToBus':
        sourceLabel.innerText = "Student";
        targetLabel.innerText = "Bus";
        sourceData = await fetchEntity('students');
        targetData = await fetchEntity('buses');
        populateSelect(sourceSelect, sourceData, '_id', s => `${s.name} (${s.admissionNumber})`, "Select Student");
        populateSelect(targetSelect, targetData, '_id', b => `${b.registrationNumber} (Cap: ${b.capacity})`, "Select Bus");
        break;

      case 'parentToStudent':
        sourceLabel.innerText = "Parent";
        targetLabel.innerText = "Student";
        sourceData = await fetchEntity('parents');
        targetData = await fetchEntity('students');
        populateSelect(sourceSelect, sourceData, '_id', p => `${p.user?.name || 'Unknown'}`, "Select Parent");
        populateSelect(targetSelect, targetData, '_id', s => `${s.name} (${s.admissionNumber})`, "Select Student");
        break;
    }
  } catch (error) {
    console.error("Error fetching data:", error);
    showMessage("Failed to load assignment data.", false);
  } finally {
    loadingIndicator.classList.add('hidden');
    sourceTargetContainer.classList.remove('hidden');
  }
});

document.getElementById('assignmentForm').addEventListener('submit', async (e) => {
  e.preventDefault();
  const type = assignTypeSelect.value;
  const sourceId = sourceSelect.value;
  const targetId = targetSelect.value;

  if (!type || !sourceId || !targetId) {
    showMessage("Please select all required fields.", false);
    return;
  }

  const res = await apiFetch('/api/admin/assign', {
    method: 'POST',
    body: JSON.stringify({ type, sourceId, targetId })
  });

  if (res && res.success) {
    showMessage("Assignment successful!");
    document.getElementById('assignmentForm').reset();
    sourceTargetContainer.classList.add('hidden');
    loadAssignmentsTable();
  } else {
    showMessage(res ? res.message : "Error processing assignment.", false);
  }
});

async function loadAssignmentsTable() {
  assignmentsTableBody.innerHTML = '<tr><td colspan="5" class="px-6 py-4 text-center text-sm text-gray-500">Loading assignments...</td></tr>';
  const res = await apiFetch('/api/admin/assignments');
  if (res && res.data) {
    const data = res.data;
    if (data.length === 0) {
      assignmentsTableBody.innerHTML = '<tr><td colspan="5" class="px-6 py-4 text-center text-sm text-gray-500">No active assignments found.</td></tr>';
      return;
    }

    const typeLabels = {
      'driverToBus': 'Driver ➜ Bus',
      'busToRoute': 'Bus ➜ Route',
      'studentToBus': 'Student ➜ Bus',
      'parentToStudent': 'Parent ➜ Student'
    };

    assignmentsTableBody.innerHTML = data.map(item => `
      <tr class="hover:bg-gray-50">
        <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-900 font-medium">${typeLabels[item.type] || item.type}</td>
        <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-900">${item.sourceName}</td>
        <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-900">${item.targetName}</td>
        <td class="px-6 py-4 whitespace-nowrap text-sm">
          <span class="px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${item.status === 'active' ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'}">
            ${item.status}
          </span>
        </td>
        <td class="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
          <button class="text-primary-600 hover:text-primary-900 mr-3 edit-assignment-btn" data-type="${item.type}" data-source="${item.sourceId}" data-target="${item.targetId}">Edit</button>
          <button class="text-red-600 hover:text-red-900 delete-assignment-btn" data-type="${item.type}" data-source="${item.sourceId}" data-target="${item.targetId}">Unassign</button>
        </td>
      </tr>
    `).join('');
  } else {
    assignmentsTableBody.innerHTML = '<tr><td colspan="5" class="px-6 py-4 text-center text-sm text-red-500">Failed to load assignments.</td></tr>';
  }
}

document.addEventListener('click', async (e) => {
  if (e.target.classList.contains('delete-assignment-btn')) {
    if (!confirm('Are you sure you want to unassign these records?')) return;
    
    const type = e.target.getAttribute('data-type');
    const sourceId = e.target.getAttribute('data-source');
    const targetId = e.target.getAttribute('data-target');

    const res = await apiFetch('/api/admin/unassign', {
      method: 'POST',
      body: JSON.stringify({ type, sourceId, targetId })
    });

    if (res && res.success) {
      alert("Unassigned successfully.");
      loadAssignmentsTable();
    } else {
      alert(res ? res.message : "Error unassigning.");
    }
  } else if (e.target.classList.contains('edit-assignment-btn')) {
    const type = e.target.getAttribute('data-type');
    const sourceId = e.target.getAttribute('data-source');
    const targetId = e.target.getAttribute('data-target');

    // Populate form
    assignTypeSelect.value = type;
    
    // Trigger change to load options
    assignTypeSelect.dispatchEvent(new Event('change'));

    // We must wait for options to render before setting values
    const checkReady = setInterval(() => {
      if (!loadingIndicator.classList.contains('hidden')) return;
      sourceSelect.value = sourceId;
      targetSelect.value = targetId;
      clearInterval(checkReady);
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }, 100);
  }
});

// Init
document.addEventListener('DOMContentLoaded', () => {
  loadAssignmentsTable();
});
