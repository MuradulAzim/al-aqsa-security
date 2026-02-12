/**
 * Employees module for Al Aksha Security Management System
 * Handles employee CRUD operations
 */

let allEmployees = [];
let filteredEmployees = [];
let editingId = null;

/**
 * Initializes the employees page
 */
async function initEmployees() {
  // Check if user can add/edit (admin only for full access)
  const role = getRole();
  if (role !== CONFIG.ROLES.ADMIN) {
    document.getElementById('add-btn').style.display = 'none';
  }
  
  await loadEmployees();
}

/**
 * Loads all employees from API
 */
async function loadEmployees() {
  try {
    showLoading();
    const result = await API.getEmployees();
    
    if (result.success) {
      allEmployees = result.data || [];
      filteredEmployees = [...allEmployees];
      renderEmployees();
    } else {
      showToast('Failed to load employees', 'error');
    }
    
    hideLoading();
  } catch (error) {
    console.error('Error loading employees:', error);
    hideLoading();
    showToast('Error loading employees', 'error');
  }
}

/**
 * Renders employees in the table
 */
function renderEmployees() {
  const tbody = document.getElementById('employees-table');
  const emptyState = document.getElementById('empty-state');
  
  if (filteredEmployees.length === 0) {
    tbody.innerHTML = '';
    emptyState.classList.remove('hidden');
    return;
  }
  
  emptyState.classList.add('hidden');
  
  tbody.innerHTML = filteredEmployees.map(emp => {
    const status = formatStatus(emp.status);
    const isAdmin = getRole() === CONFIG.ROLES.ADMIN;
    
    return `
      <tr>
        <td>
          <div class="flex items-center gap-3">
            <div class="w-10 h-10 bg-primary-light rounded-full flex items-center justify-center text-white font-medium">
              ${emp.name ? emp.name.charAt(0).toUpperCase() : '?'}
            </div>
            <div>
              <p class="font-medium text-gray-800">${escapeHtml(emp.name)}</p>
              <p class="text-sm text-gray-500">${emp.nid || '-'}</p>
            </div>
          </div>
        </td>
        <td>${escapeHtml(emp.phone || '-')}</td>
        <td><span class="capitalize">${emp.role || '-'}</span></td>
        <td>
          ${emp.salary ? formatCurrency(emp.salary) + '/month' : ''}
          ${emp.dailyRate ? formatCurrency(emp.dailyRate) + '/day' : ''}
          ${!emp.salary && !emp.dailyRate ? '-' : ''}
        </td>
        <td>
          <span class="badge ${status.class}">${status.text}</span>
        </td>
        <td class="text-center">
          <div class="flex justify-center gap-2">
            <button 
              onclick="viewEmployee('${emp.id}')"
              class="p-2 text-blue-600 hover:bg-blue-50 rounded-lg"
              title="View"
            >
              👁️
            </button>
            ${isAdmin ? `
              <button 
                onclick="editEmployee('${emp.id}')"
                class="p-2 text-green-600 hover:bg-green-50 rounded-lg"
                title="Edit"
              >
                ✏️
              </button>
              <button 
                onclick="deleteEmployee('${emp.id}')"
                class="p-2 text-red-600 hover:bg-red-50 rounded-lg"
                title="Delete"
              >
                🗑️
              </button>
            ` : ''}
          </div>
        </td>
      </tr>
    `;
  }).join('');
}

/**
 * Opens the add employee modal
 */
function openAddModal() {
  editingId = null;
  document.getElementById('modal-title').textContent = 'Add Employee';
  document.getElementById('submit-btn').textContent = 'Save Employee';
  clearForm('employee-form');
  document.getElementById('emp-status').value = 'active';
  openModal('employee-modal');
}

/**
 * Opens the edit employee modal
 */
function editEmployee(id) {
  const emp = allEmployees.find(e => e.id === id);
  if (!emp) return;
  
  editingId = id;
  document.getElementById('modal-title').textContent = 'Edit Employee';
  document.getElementById('submit-btn').textContent = 'Update Employee';
  
  // Fill form
  document.getElementById('employee-id').value = emp.id;
  document.getElementById('emp-name').value = emp.name || '';
  document.getElementById('emp-phone').value = emp.phone || '';
  document.getElementById('emp-nid').value = emp.nid || '';
  document.getElementById('emp-role').value = emp.role || '';
  document.getElementById('emp-salary').value = emp.salary || '';
  document.getElementById('emp-daily-rate').value = emp.dailyRate || '';
  document.getElementById('emp-payment').value = emp.paymentMethod || 'cash';
  document.getElementById('emp-account').value = emp.accountNumber || '';
  document.getElementById('emp-status').value = emp.status || 'active';
  
  openModal('employee-modal');
}

/**
 * Views employee details
 */
function viewEmployee(id) {
  const emp = allEmployees.find(e => e.id === id);
  if (!emp) return;
  
  // For simplicity, just edit the employee (view mode could be added)
  editEmployee(id);
}

/**
 * Handles form submission
 */
async function handleSubmit(event) {
  event.preventDefault();
  
  const empData = {
    name: document.getElementById('emp-name').value.trim(),
    phone: document.getElementById('emp-phone').value.trim(),
    nid: document.getElementById('emp-nid').value.trim(),
    role: document.getElementById('emp-role').value,
    salary: Number(document.getElementById('emp-salary').value) || 0,
    dailyRate: Number(document.getElementById('emp-daily-rate').value) || 0,
    paymentMethod: document.getElementById('emp-payment').value,
    accountNumber: document.getElementById('emp-account').value.trim(),
    status: document.getElementById('emp-status').value
  };
  
  // Validation
  if (!empData.name || !empData.phone || !empData.role) {
    showToast('Please fill in all required fields', 'error');
    return;
  }
  
  try {
    showLoading();
    let result;
    
    if (editingId) {
      empData.id = editingId;
      result = await API.updateEmployee(empData);
    } else {
      result = await API.addEmployee(empData);
    }
    
    if (result.success) {
      showToast(editingId ? 'Employee updated successfully' : 'Employee added successfully', 'success');
      closeModal('employee-modal');
      await loadEmployees();
    } else {
      showToast(result.message || 'Operation failed', 'error');
    }
    
    hideLoading();
  } catch (error) {
    console.error('Error saving employee:', error);
    hideLoading();
    showToast('Error saving employee', 'error');
  }
}

/**
 * Deletes an employee
 */
async function deleteEmployee(id) {
  const emp = allEmployees.find(e => e.id === id);
  if (!emp) return;
  
  if (!confirmDelete(`Are you sure you want to delete ${emp.name}?`)) {
    return;
  }
  
  try {
    showLoading();
    const result = await API.deleteEmployee(id);
    
    if (result.success) {
      showToast('Employee deleted successfully', 'success');
      await loadEmployees();
    } else {
      showToast(result.message || 'Delete failed', 'error');
    }
    
    hideLoading();
  } catch (error) {
    console.error('Error deleting employee:', error);
    hideLoading();
    showToast('Error deleting employee', 'error');
  }
}

/**
 * Handles search input
 */
const handleSearch = debounce(() => {
  filterEmployees();
}, 300);

/**
 * Handles filter change
 */
function handleFilter() {
  filterEmployees();
}

/**
 * Filters employees based on search and filters
 */
function filterEmployees() {
  const search = document.getElementById('search-input').value.toLowerCase();
  const statusFilter = document.getElementById('status-filter').value;
  const roleFilter = document.getElementById('role-filter').value;
  
  filteredEmployees = allEmployees.filter(emp => {
    // Search filter
    const matchesSearch = !search || 
      (emp.name && emp.name.toLowerCase().includes(search)) ||
      (emp.phone && emp.phone.includes(search)) ||
      (emp.nid && emp.nid.includes(search));
    
    // Status filter
    const matchesStatus = !statusFilter || emp.status === statusFilter;
    
    // Role filter
    const matchesRole = !roleFilter || emp.role === roleFilter;
    
    return matchesSearch && matchesStatus && matchesRole;
  });
  
  renderEmployees();
}
