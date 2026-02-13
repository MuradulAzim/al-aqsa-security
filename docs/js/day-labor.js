/**
 * Day Labor module
 */

let laborRecords = [];
let clients = [];
let employees = [];
let editingId = null;

async function initDayLabor() {
  document.getElementById('labor-date').value = getToday();
  await loadClients();
  await loadEmployees();
  await loadDayLabor();
}

async function loadClients() {
  const result = await API.getClients();
  if (result.success) {
    clients = (result.data || []).filter(c => c.status === 'active');
    const select = document.getElementById('labor-client');
    select.innerHTML = '<option value="">Select Client</option>' + 
      clients.map(c => `<option value="${c.id}" data-name="${escapeHtml(c.name)}">${escapeHtml(c.name)}</option>`).join('');
  }
}

async function loadEmployees() {
  const result = await API.getEmployees();
  if (result.success) {
    employees = (result.data || []).filter(e => e.status === 'active');
    const select = document.getElementById('labor-employee');
    select.innerHTML = '<option value="">Select Employee</option>' + 
      employees.map(e => `<option value="${e.id}" data-name="${escapeHtml(e.name)}">${escapeHtml(e.name)}</option>`).join('');
  }
}

async function loadDayLabor() {
  const date = document.getElementById('labor-date').value;
  try {
    showLoading();
    const result = await API.getDayLabor(date);
    if (result.success) {
      laborRecords = result.data || [];
      renderTable();
      updateSummary();
    }
    hideLoading();
  } catch (error) {
    hideLoading();
    showToast('Error loading records', 'error');
  }
}

function renderTable() {
  const tbody = document.getElementById('labor-table');
  const emptyState = document.getElementById('empty-state');
  
  if (laborRecords.length === 0) {
    tbody.innerHTML = '';
    emptyState.classList.remove('hidden');
    return;
  }
  
  emptyState.classList.add('hidden');
  tbody.innerHTML = laborRecords.map(record => `
    <tr>
      <td><div class="font-medium">${escapeHtml(record.employeeName || '-')}</div></td>
      <td>${escapeHtml(record.clientName || '-')}</td>
      <td>${record.hours || 0}</td>
      <td>${formatCurrency(record.rate || 0)}</td>
      <td>${formatCurrency(record.amount || 0)}</td>
      <td class="text-center">
        <button onclick="editRecord('${record.id}')" class="p-2 text-green-600 hover:bg-green-50 rounded-lg">✏️</button>
        <button onclick="deleteRecord('${record.id}')" class="p-2 text-red-600 hover:bg-red-50 rounded-lg">🗑️</button>
      </td>
    </tr>
  `).join('');
}

function updateSummary() {
  document.getElementById('total-records').textContent = laborRecords.length;
  document.getElementById('total-hours').textContent = laborRecords.reduce((sum, r) => sum + (Number(r.hours) || 0), 0);
  document.getElementById('total-pay').textContent = formatCurrency(laborRecords.reduce((sum, r) => sum + (Number(r.amount) || 0), 0));
  document.getElementById('total-clients').textContent = new Set(laborRecords.map(r => r.clientId)).size;
}

function changeDate(days) {
  const dateInput = document.getElementById('labor-date');
  const current = parseDate(dateInput.value);
  current.setDate(current.getDate() + days);
  dateInput.value = formatDateISO(current);
  loadDayLabor();
}

function setToday() {
  document.getElementById('labor-date').value = getToday();
  loadDayLabor();
}

function openAddModal() {
  editingId = null;
  document.getElementById('modal-title').textContent = 'Add Day Labor Record';
  clearForm('labor-form');
  // Set default values after clearing
  document.getElementById('labor-hours').value = 8;
  document.getElementById('labor-rate').value = 100;
  calculateAmount();
  openModal('labor-modal');
}

function editRecord(id) {
  const record = laborRecords.find(r => r.id === id);
  if (!record) return;
  
  editingId = id;
  document.getElementById('modal-title').textContent = 'Edit Record';
  document.getElementById('labor-id').value = record.id;
  document.getElementById('labor-employee').value = record.employeeId || '';
  document.getElementById('labor-client').value = record.clientId || '';
  document.getElementById('labor-hours').value = record.hours || 0;
  document.getElementById('labor-rate').value = record.rate || 0;
  document.getElementById('labor-amount').value = record.amount || 0;
  document.getElementById('labor-notes').value = record.notes || '';
  openModal('labor-modal');
}

function calculateAmount() {
  const hours = Number(document.getElementById('labor-hours').value) || 0;
  const rate = Number(document.getElementById('labor-rate').value) || 0;
  document.getElementById('labor-amount').value = hours * rate;
}

async function handleSubmit(event) {
  event.preventDefault();
  
  const employeeSelect = document.getElementById('labor-employee');
  const clientSelect = document.getElementById('labor-client');
  const data = {
    date: document.getElementById('labor-date').value,
    employeeId: employeeSelect.value,
    employeeName: employeeSelect.options[employeeSelect.selectedIndex]?.dataset?.name || '',
    clientId: clientSelect.value,
    clientName: clientSelect.options[clientSelect.selectedIndex]?.dataset?.name || '',
    hours: Number(document.getElementById('labor-hours').value) || 0,
    rate: Number(document.getElementById('labor-rate').value) || 0,
    amount: Number(document.getElementById('labor-amount').value) || 0,
    notes: document.getElementById('labor-notes').value.trim()
  };
  
  try {
    showLoading();
    let result;
    if (editingId) {
      data.id = editingId;
      result = await API.updateDayLabor(data);
    } else {
      result = await API.addDayLabor(data);
    }
    
    if (result.success) {
      showToast(editingId ? 'Record updated' : 'Record added', 'success');
      closeModal('labor-modal');
      await loadDayLabor();
    }
    hideLoading();
  } catch (error) {
    hideLoading();
    showToast('Error saving record', 'error');
  }
}

async function deleteRecord(id) {
  if (!confirmDelete('Delete this record?')) return;
  try {
    showLoading();
    const result = await API.deleteDayLabor(id);
    if (result.success) {
      showToast('Record deleted', 'success');
      await loadDayLabor();
    }
    hideLoading();
  } catch (error) {
    hideLoading();
    showToast('Error deleting record', 'error');
  }
}
