// Global API Fetch helper for admin section
const apiFetch = async (endpoint, options = {}) => {
  const token = localStorage.getItem('token');
  if (!token) {
    window.location.href = '/login.html';
    return null;
  }

  const defaultHeaders = {
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${token}`
  };

  try {
    const response = await fetch(endpoint, {
      ...options,
      headers: { ...defaultHeaders, ...options.headers }
    });

    // If response is a file download (like Excel/PDF)
    const contentType = response.headers.get('content-type');
    if (contentType && (contentType.includes('application/pdf') || contentType.includes('spreadsheetml'))) {
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      // Extract filename from disposition if possible, else default
      let filename = 'download';
      const disposition = response.headers.get('content-disposition');
      if (disposition && disposition.indexOf('attachment') !== -1) {
        const filenameRegex = /filename[^;=\n]*=((['"]).*?\2|[^;\n]*)/;
        const matches = filenameRegex.exec(disposition);
        if (matches != null && matches[1]) { 
          filename = matches[1].replace(/['"]/g, '');
        }
      }
      a.download = filename;
      document.body.appendChild(a);
      a.click();
      a.remove();
      return true;
    }

    const data = await response.json();
    if (response.status === 401 || response.status === 403) {
      // Unauthorized, redirect to login
      localStorage.removeItem('token');
      window.location.href = '/login.html';
      return null;
    }
    
    return data;
  } catch (error) {
    console.error('API Fetch Error:', error);
    return null;
  }
};

// Generic table renderer
const renderTable = (data, columns, containerId) => {
  const container = document.getElementById(containerId);
  if (!container) return;
  
  if (!data || data.length === 0) {
    container.innerHTML = '<tr><td colspan="100%" class="px-6 py-4 text-center text-sm text-gray-500">No records found.</td></tr>';
    return;
  }

  const rowsHTML = data.map(row => {
    const cells = columns.map(col => {
      let val = row;
      col.key.split('.').forEach(k => { val = val ? val[k] : '' });
      if (col.format) val = col.format(val, row);
      return `<td class="px-6 py-4 whitespace-nowrap text-sm text-gray-900">${val || '-'}</td>`;
    }).join('');
    
    // Add action buttons
    const actions = `
      <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-500 text-right">
        <button class="text-primary-600 hover:text-primary-900 mr-3 edit-btn" data-id="${row._id}">Edit</button>
        <button class="text-red-600 hover:text-red-900 delete-btn" data-id="${row._id}">Delete</button>
      </td>
    `;
    return `<tr class="hover:bg-gray-50">${cells}${actions}</tr>`;
  }).join('');

  container.innerHTML = rowsHTML;
};

// Generic Delete Functionality
document.addEventListener('click', async (e) => {
  if (e.target.classList.contains('delete-btn')) {
    const id = e.target.getAttribute('data-id');
    const endpoint = window.location.pathname.replace('.html', '').replace('/admin', '');
    const apiUrl = `/api${endpoint}`;
    
    if (confirm('Are you sure you want to delete this record?')) {
      const res = await apiFetch(`${apiUrl}/${id}`, { method: 'DELETE' });
      if (res && res.success) {
        alert('Deleted successfully');
        if (typeof loadData === 'function') loadData();
        else if (typeof loadStudents === 'function') loadStudents();
        else window.location.reload();
      } else {
        alert(res ? res.message : 'Error deleting record');
      }
    }
  } else if (e.target.classList.contains('edit-btn')) {
    const id = e.target.getAttribute('data-id');
    if (typeof openEditModal === 'function') {
      openEditModal(id);
    } else {
      alert('Edit functionality not fully implemented for this module yet.');
    }
  }
});

// Generic form handling setup
const setupModalForms = () => {
  const modal = document.getElementById('crudModal');
  const cancelBtn = document.getElementById('cancelModalBtn');
  const closeBtn = document.getElementById('closeModalBtn');
  const form = document.getElementById('crudForm');

  if (modal) {
    const closeModal = () => {
      modal.classList.add('hidden');
      if (form) {
        form.reset();
        delete form.dataset.editId;
      }
    };
    if (cancelBtn) cancelBtn.addEventListener('click', closeModal);
    if (closeBtn) closeBtn.addEventListener('click', closeModal);
  }
};

document.addEventListener('DOMContentLoaded', setupModalForms);
