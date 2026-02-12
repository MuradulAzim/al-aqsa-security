/**
 * Guard Duty module for Al Aksha Security Management System
 */

let dutyRecords = [];
let employees = [];
let clients = [];
let editingId = null;

async function initGuardDuty() {
  document.getElementById('duty-date').value = getToday();
  await Promise.all([loadEmployees(), loadClients()]);
  await loadGuardDuty();
}

async function loadEmployees() {
  const result = await API.getEmployees();
  if (result.success) {
    // Show all active employees (roles: Security Guard, Escort, Labor, etc.)
    employees = (result.data || []).filter(e => e.status === 'active');
    populateEmployeeSelect();
  } else {
    console.error('Failed to load employees:', result.message);
  }
}

async function loadClients() {
  const result = await API.getClients();
  if (result.success) {
    clients = (result.data || []).filter(c => c.status === 'active');
    populateClientSelect();
  } else {
    console.error('Failed to load clients:', result.message);
  }
}

// Searchable dropdown functions
function populateEmployeeSelect() {
  // Initial population - no longer using select, but keeping function for backward compatibility
  renderEmployeeDropdown(employees);
}

function populateClientSelect() {
  // Initial population - no longer using select, but keeping function for backward compatibility
  renderClientDropdown(clients);
}

function renderEmployeeDropdown(filteredEmployees) {
  const dropdown = document.getElementById('employee-dropdown');
  if (filteredEmployees.length === 0) {
    dropdown.innerHTML = '<div class="px-3 py-2 text-gray-500">No employees found</div>';
  } else {
    dropdown.innerHTML = filteredEmployees.map((e, index) => 
      `<div class="px-3 py-2 hover:bg-blue-50 cursor-pointer" data-id="${e.id}" data-name="${escapeHtml(e.name)}" onclick="selectEmployeeByIndex(this)">${escapeHtml(e.name)} <span class="text-gray-400 text-sm">(${e.role || ''})</span></div>`
    ).join('');
  }
}

function renderClientDropdown(filteredClients) {
  const dropdown = document.getElementById('client-dropdown');
  if (filteredClients.length === 0) {
    dropdown.innerHTML = '<div class="px-3 py-2 text-gray-500">No clients found</div>';
  } else {
    dropdown.innerHTML = filteredClients.map((c, index) => 
      `<div class="px-3 py-2 hover:bg-blue-50 cursor-pointer" data-id="${c.id}" data-name="${escapeHtml(c.name)}" onclick="selectClientByIndex(this)">${escapeHtml(c.name)}</div>`
    ).join('');
  }
}

function selectEmployeeByIndex(element) {
  const id = element.dataset.id;
  const name = element.dataset.name;
  document.getElementById('duty-employee-id').value = id;
  document.getElementById('duty-employee').value = name;
  hideDropdown('employee-dropdown');
}

function selectClientByIndex(element) {
  const id = element.dataset.id;
  const name = element.dataset.name;
  document.getElementById('duty-client-id').value = id;
  document.getElementById('duty-client').value = name;
  hideDropdown('client-dropdown');
}

function filterEmployees(searchText) {
  const search = searchText.toLowerCase();
  const filtered = employees.filter(e => 
    e.name.toLowerCase().includes(search) || 
    (e.role && e.role.toLowerCase().includes(search)) ||
    (e.phone && e.phone.includes(search))
  );
  renderEmployeeDropdown(filtered);
  showEmployeeDropdown();
}

function filterClients(searchText) {
  const search = searchText.toLowerCase();
  const filtered = clients.filter(c => 
    c.name.toLowerCase().includes(search) || 
    (c.contact && c.contact.toLowerCase().includes(search))
  );
  renderClientDropdown(filtered);
  showClientDropdown();
}

function showEmployeeDropdown() {
  document.getElementById('employee-dropdown').classList.remove('hidden');
}

function showClientDropdown() {
  document.getElementById('client-dropdown').classList.remove('hidden');
}

function hideDropdown(dropdownId) {
  document.getElementById(dropdownId).classList.add('hidden');
}

async function loadGuardDuty() {
  const date = document.getElementById('duty-date').value;
  try {
    showLoading();
    const result = await API.getGuardDuty(date);
    if (result.success) {
      dutyRecords = result.data || [];
      renderDutyTable();
      updateSummary();
    }
    hideLoading();
  } catch (error) {
    hideLoading();
    showToast('Error loading duty records', 'error');
  }
}

function renderDutyTable() {
  const tbody = document.getElementById('duty-table');
  const emptyState = document.getElementById('empty-state');
  
  if (dutyRecords.length === 0) {
    tbody.innerHTML = '';
    emptyState.classList.remove('hidden');
    return;
  }
  
  emptyState.classList.add('hidden');
  tbody.innerHTML = dutyRecords.map(record => {
    const status = formatStatus(record.status);
    return `
      <tr>
        <td><div class="font-medium">${escapeHtml(record.employeeName || '-')}</div></td>
        <td>${escapeHtml(record.clientName || '-')}</td>
        <td><span class="capitalize">${record.shift || '-'}</span></td>
        <td><span class="badge ${status.class}">${status.text}</span></td>
        <td class="text-sm text-gray-500">${escapeHtml(record.notes || '-')}</td>
        <td class="text-center">
          <button onclick="editRecord('${record.id}')" class="p-2 text-green-600 hover:bg-green-50 rounded-lg">✏️</button>
          <button onclick="deleteRecord('${record.id}')" class="p-2 text-red-600 hover:bg-red-50 rounded-lg">🗑️</button>
        </td>
      </tr>
    `;
  }).join('');
}

function updateSummary() {
  const total = dutyRecords.length;
  const present = dutyRecords.filter(r => r.status === 'present' || r.status === 'late').length;
  const absent = dutyRecords.filter(r => r.status === 'absent').length;
  const uniqueClients = new Set(dutyRecords.map(r => r.clientId)).size;
  
  document.getElementById('total-assigned').textContent = total;
  document.getElementById('total-present').textContent = present;
  document.getElementById('total-absent').textContent = absent;
  document.getElementById('total-clients').textContent = uniqueClients;
}

function changeDate(days) {
  const dateInput = document.getElementById('duty-date');
  const current = new Date(dateInput.value);
  current.setDate(current.getDate() + days);
  dateInput.value = formatDateISO(current);
  loadGuardDuty();
}

function setToday() {
  document.getElementById('duty-date').value = getToday();
  loadGuardDuty();
}

function openAddModal() {
  editingId = null;
  document.getElementById('modal-title').textContent = 'Add Duty Record';
  clearForm('duty-form');
  // Clear hidden ID fields for searchable inputs
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
  
  // Set employee searchable input
  document.getElementById('duty-employee-id').value = record.employeeId || '';
  document.getElementById('duty-employee').value = record.employeeName || '';
  
  // Set client searchable input
  document.getElementById('duty-client-id').value = record.clientId || '';
  document.getElementById('duty-client').value = record.clientName || '';
  
  document.getElementById('duty-shift').value = record.shift || 'day';
  document.getElementById('duty-status').value = record.status || 'present';
  document.getElementById('duty-notes').value = record.notes || '';
  openModal('duty-modal');
}

async function handleSubmit(event) {
  event.preventDefault();
  
  // Get values from hidden ID fields and display inputs
  const employeeId = document.getElementById('duty-employee-id').value;
  const employeeName = document.getElementById('duty-employee').value;
  const clientId = document.getElementById('duty-client-id').value;
  const clientName = document.getElementById('duty-client').value;
  
  // Validate that both employee and client are selected (not just typed)
  if (!employeeId) {
    showToast('Please select an employee from the dropdown', 'error');
    return;
  }
  if (!clientId) {
    showToast('Please select a client from the dropdown', 'error');
    return;
  }
  
  const data = {
    date: document.getElementById('duty-date').value,
    employeeId: employeeId,
    employeeName: employeeName,
    clientId: clientId,
    clientName: clientName,
    shift: document.getElementById('duty-shift').value,
    status: document.getElementById('duty-status').value,
    notes: document.getElementById('duty-notes').value.trim()
  };
  
  try {
    showLoading();
    let result;
    if (editingId) {
      data.id = editingId;
      result = await API.updateGuardDuty(data);
    } else {
      result = await API.addGuardDuty(data);
    }
    
    if (result.success) {
      showToast(editingId ? 'Record updated' : 'Record added', 'success');
      closeModal('duty-modal');
      await loadGuardDuty();
    } else {
      showToast(result.message || 'Operation failed', 'error');
    }
    hideLoading();
  } catch (error) {
    hideLoading();
    showToast('Error saving record', 'error');
  }
}

async function deleteRecord(id) {
  if (!confirmDelete('Are you sure you want to delete this record?')) return;
  
  try {
    showLoading();
    const result = await API.deleteGuardDuty(id);
    if (result.success) {
      showToast('Record deleted', 'success');
      await loadGuardDuty();
    }
    hideLoading();
  } catch (error) {
    hideLoading();
    showToast('Error deleting record', 'error');
  }
}
