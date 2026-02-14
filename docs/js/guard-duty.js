/**
 * Guard Duty module for Al Aksha Security Management System
 * Single source of truth: dutyRecords array
 * All UI updates via refreshGuardDuty(currentDate)
 */

// ============ STATE (single source of truth) ============
let dutyRecords = [];
let currentDate = getToday(); // YYYY-MM-DD
let employees = [];
let clients = [];
let editingId = null;

// ============ INITIALIZATION ============
async function initGuardDuty() {
  currentDate = getToday();
  document.getElementById('duty-date').value = currentDate;
  
  // Load reference data in parallel
  await Promise.all([loadEmployees(), loadClients()]);
  
  // Initial data load
  await refreshGuardDuty(currentDate);
}

// ============ CORE REFRESH FUNCTION ============
async function refreshGuardDuty(date) {
  showLoading();
  try {
    const result = await API.getGuardDuty(date);
    if (result.success) {
      dutyRecords = result.data || [];
    } else {
      dutyRecords = [];
      console.error('Failed to load guard duty:', result.message);
    }
  } catch (error) {
    dutyRecords = [];
    console.error('refreshGuardDuty error:', error);
    showToast('Error loading duty records', 'error');
  }
  hideLoading();
  
  // Always update UI
  renderTable(dutyRecords);
  updateSummary(dutyRecords);
}

// ============ REFERENCE DATA LOADERS ============
async function loadEmployees() {
  try {
    const result = await API.getEmployees();
    if (result.success) {
      employees = (result.data || []).filter(e => e.status === 'active');
      renderEmployeeDropdown(employees);
    }
  } catch (error) {
    console.error('Failed to load employees:', error);
  }
}

async function loadClients() {
  try {
    const result = await API.getClients();
    if (result.success) {
      clients = (result.data || []).filter(c => c.status === 'active');
      renderClientDropdown(clients);
    }
  } catch (error) {
    console.error('Failed to load clients:', error);
  }
}

// ============ DATE NAVIGATION ============
function onDateChange() {
  currentDate = document.getElementById('duty-date').value;
  refreshGuardDuty(currentDate);
}

function navigateDate(days) {
  const d = parseDate(currentDate);
  d.setDate(d.getDate() + days);
  currentDate = formatDateISO(d);
  document.getElementById('duty-date').value = currentDate;
  refreshGuardDuty(currentDate);
}

function navigateToday() {
  currentDate = getToday();
  document.getElementById('duty-date').value = currentDate;
  refreshGuardDuty(currentDate);
}

// ============ TABLE RENDERING ============
function renderTable(records) {
  const tbody = document.getElementById('duty-table');
  const emptyState = document.getElementById('empty-state');
  
  if (records.length === 0) {
    tbody.innerHTML = '';
    emptyState.classList.remove('hidden');
    return;
  }
  
  emptyState.classList.add('hidden');
  tbody.innerHTML = records.map(record => {
    const status = formatStatus(record.status);
    return `
      <tr>
        <td><div class="font-medium">${escapeHtml(record.employeeName || '-')}</div></td>
        <td>${escapeHtml(record.clientName || '-')}</td>
        <td>${formatDate(record.date) || '-'}</td>
        <td><span class="badge ${status.class}">${status.text}</span></td>
        <td>${escapeHtml(record.checkIn || '-')}</td>
        <td>${escapeHtml(record.checkOut || '-')}</td>
        <td class="text-sm text-gray-500">${escapeHtml(record.notes || '-')}</td>
        <td class="text-center">
          <button onclick="editRecord('${record.id}')" class="p-2 text-green-600 hover:bg-green-50 rounded-lg">✏️</button>
          <button onclick="deleteRecord('${record.id}')" class="p-2 text-red-600 hover:bg-red-50 rounded-lg">🗑️</button>
        </td>
      </tr>
    `;
  }).join('');
}

// ============ SUMMARY UPDATE ============
function updateSummary(records) {
  const total = records.length;
  const present = records.filter(r => r.status === 'present' || r.status === 'late').length;
  const absent = records.filter(r => r.status === 'absent').length;
  
  document.getElementById('total-records').textContent = total;
  document.getElementById('total-present').textContent = present;
  document.getElementById('total-absent').textContent = absent;
}

// ============ MODAL OPERATIONS ============
function openAddModal() {
  editingId = null;
  document.getElementById('modal-title').textContent = 'Add Duty Record';
  clearForm('duty-form');
  document.getElementById('duty-employee-id').value = '';
  document.getElementById('duty-client-id').value = '';
  document.getElementById('duty-status').value = 'present';
  openModal('duty-modal');
}

function editRecord(id) {
  const record = dutyRecords.find(r => r.id === id);
  if (!record) return;
  
  editingId = id;
  document.getElementById('modal-title').textContent = 'Edit Duty Record';
  document.getElementById('duty-id').value = record.id;
  document.getElementById('duty-employee-id').value = record.employeeId || '';
  document.getElementById('duty-employee').value = record.employeeName || '';
  document.getElementById('duty-client-id').value = record.clientId || '';
  document.getElementById('duty-client').value = record.clientName || '';
  document.getElementById('duty-checkin').value = record.checkIn || '';
  document.getElementById('duty-checkout').value = record.checkOut || '';
  document.getElementById('duty-status').value = record.status || 'present';
  document.getElementById('duty-notes').value = record.notes || '';
  openModal('duty-modal');
}

// ============ FORM SUBMISSION ============
async function handleSubmit(event) {
  event.preventDefault();
  
  const employeeId = document.getElementById('duty-employee-id').value;
  const employeeName = document.getElementById('duty-employee').value;
  const clientId = document.getElementById('duty-client-id').value;
  const clientName = document.getElementById('duty-client').value;
  
  // Validation
  if (!employeeId) {
    showToast('Please select an employee from the dropdown', 'error');
    return;
  }
  if (!clientId) {
    showToast('Please select a client from the dropdown', 'error');
    return;
  }
  
  const data = {
    date: currentDate,
    employeeId: employeeId,
    employeeName: employeeName,
    clientId: clientId,
    status: document.getElementById('duty-status').value,
    checkIn: document.getElementById('duty-checkin').value,
    checkOut: document.getElementById('duty-checkout').value,
    notes: document.getElementById('duty-notes').value.trim()
  };
  
  showLoading();
  try {
    let result;
    if (editingId) {
      data.id = editingId;
      result = await API.updateGuardDuty(data);
    } else {
      result = await API.addGuardDuty(data);
    }
    hideLoading();
    
    if (result.success) {
      showToast(editingId ? 'Record updated' : 'Record added', 'success');
      closeModal('duty-modal');
      editingId = null;
      await refreshGuardDuty(currentDate);
    } else {
      showToast(result.message || 'Operation failed', 'error');
    }
  } catch (error) {
    hideLoading();
    showToast('Error saving record', 'error');
    console.error('handleSubmit error:', error);
  }
}

// ============ DELETE ============
async function deleteRecord(id) {
  if (!confirmDelete('Are you sure you want to delete this record?')) return;
  
  showLoading();
  try {
    const result = await API.deleteGuardDuty(id);
    hideLoading();
    
    if (result.success) {
      showToast('Record deleted', 'success');
      await refreshGuardDuty(currentDate);
    } else {
      showToast(result.message || 'Delete failed', 'error');
    }
  } catch (error) {
    hideLoading();
    showToast('Error deleting record', 'error');
    console.error('deleteRecord error:', error);
  }
}

// ============ EMPLOYEE DROPDOWN ============
function renderEmployeeDropdown(list) {
  const dropdown = document.getElementById('employee-dropdown');
  if (list.length === 0) {
    dropdown.innerHTML = '<div class="px-3 py-2 text-gray-500">No employees found</div>';
  } else {
    dropdown.innerHTML = list.map(e =>
      `<div class="px-3 py-2 hover:bg-blue-50 cursor-pointer" data-id="${e.id}" data-name="${escapeHtml(e.name)}" onclick="selectEmployee(this)">${escapeHtml(e.name)} <span class="text-gray-400 text-sm">(${e.role || ''})</span></div>`
    ).join('');
  }
}

function selectEmployee(el) {
  document.getElementById('duty-employee-id').value = el.dataset.id;
  document.getElementById('duty-employee').value = el.dataset.name;
  hideDropdown('employee-dropdown');
}

function filterEmployees(search) {
  const filtered = employees.filter(e =>
    e.name.toLowerCase().includes(search.toLowerCase()) ||
    (e.role && e.role.toLowerCase().includes(search.toLowerCase()))
  );
  renderEmployeeDropdown(filtered);
  showDropdown('employee-dropdown');
}

// ============ CLIENT DROPDOWN ============
function renderClientDropdown(list) {
  const dropdown = document.getElementById('client-dropdown');
  if (list.length === 0) {
    dropdown.innerHTML = '<div class="px-3 py-2 text-gray-500">No clients found</div>';
  } else {
    dropdown.innerHTML = list.map(c =>
      `<div class="px-3 py-2 hover:bg-blue-50 cursor-pointer" data-id="${c.id}" data-name="${escapeHtml(c.name)}" onclick="selectClient(this)">${escapeHtml(c.name)}</div>`
    ).join('');
  }
}

function selectClient(el) {
  document.getElementById('duty-client-id').value = el.dataset.id;
  document.getElementById('duty-client').value = el.dataset.name;
  hideDropdown('client-dropdown');
}

function filterClients(search) {
  const filtered = clients.filter(c =>
    c.name.toLowerCase().includes(search.toLowerCase())
  );
  renderClientDropdown(filtered);
  showDropdown('client-dropdown');
}

// ============ DROPDOWN HELPERS ============
function showDropdown(id) {
  document.getElementById(id).classList.remove('hidden');
}

function hideDropdown(id) {
  document.getElementById(id).classList.add('hidden');
}
