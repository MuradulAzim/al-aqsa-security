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
    employees = (result.data || []).filter(e => e.status === 'active' && (e.role === 'guard' || e.role === 'supervisor'));
    populateEmployeeSelect();
  }
}

async function loadClients() {
  const result = await API.getClients();
  if (result.success) {
    clients = (result.data || []).filter(c => c.status === 'active');
    populateClientSelect();
  }
}

function populateEmployeeSelect() {
  const select = document.getElementById('duty-employee');
  select.innerHTML = '<option value="">Select Employee</option>' + 
    employees.map(e => `<option value="${e.id}" data-name="${escapeHtml(e.name)}">${escapeHtml(e.name)}</option>`).join('');
}

function populateClientSelect() {
  const select = document.getElementById('duty-client');
  select.innerHTML = '<option value="">Select Client</option>' + 
    clients.map(c => `<option value="${c.id}" data-name="${escapeHtml(c.name)}">${escapeHtml(c.name)}</option>`).join('');
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
  document.getElementById('duty-status').value = 'present';
  openModal('duty-modal');
}

function editRecord(id) {
  const record = dutyRecords.find(r => r.id === id);
  if (!record) return;
  
  editingId = id;
  document.getElementById('modal-title').textContent = 'Edit Duty Record';
  document.getElementById('duty-id').value = record.id;
  document.getElementById('duty-employee').value = record.employeeId || '';
  document.getElementById('duty-client').value = record.clientId || '';
  document.getElementById('duty-shift').value = record.shift || 'day';
  document.getElementById('duty-status').value = record.status || 'present';
  document.getElementById('duty-notes').value = record.notes || '';
  openModal('duty-modal');
}

async function handleSubmit(event) {
  event.preventDefault();
  
  const employeeSelect = document.getElementById('duty-employee');
  const clientSelect = document.getElementById('duty-client');
  
  const data = {
    date: document.getElementById('duty-date').value,
    employeeId: employeeSelect.value,
    employeeName: employeeSelect.options[employeeSelect.selectedIndex]?.dataset?.name || '',
    clientId: clientSelect.value,
    clientName: clientSelect.options[clientSelect.selectedIndex]?.dataset?.name || '',
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
