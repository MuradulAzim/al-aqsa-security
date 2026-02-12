/**
 * Day Labor module
 */

let laborRecords = [];
let clients = [];
let editingId = null;

async function initDayLabor() {
  document.getElementById('labor-date').value = getToday();
  await loadClients();
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
      <td><div class="font-medium">${escapeHtml(record.clientName || '-')}</div></td>
      <td>${escapeHtml(record.workType || '-')}</td>
      <td>${record.totalWorkers || 0}</td>
      <td>${record.totalPresent || 0}</td>
      <td>${formatCurrency(record.totalPay || 0)}</td>
      <td class="text-center">
        <button onclick="editRecord('${record.id}')" class="p-2 text-green-600 hover:bg-green-50 rounded-lg">✏️</button>
        <button onclick="deleteRecord('${record.id}')" class="p-2 text-red-600 hover:bg-red-50 rounded-lg">🗑️</button>
      </td>
    </tr>
  `).join('');
}

function updateSummary() {
  document.getElementById('total-records').textContent = laborRecords.length;
  document.getElementById('total-workers').textContent = laborRecords.reduce((sum, r) => sum + (r.totalWorkers || 0), 0);
  document.getElementById('total-pay').textContent = formatCurrency(laborRecords.reduce((sum, r) => sum + (r.totalPay || 0), 0));
  document.getElementById('total-clients').textContent = new Set(laborRecords.map(r => r.clientId)).size;
}

function changeDate(days) {
  const dateInput = document.getElementById('labor-date');
  const current = new Date(dateInput.value);
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
  openModal('labor-modal');
}

function editRecord(id) {
  const record = laborRecords.find(r => r.id === id);
  if (!record) return;
  
  editingId = id;
  document.getElementById('modal-title').textContent = 'Edit Record';
  document.getElementById('labor-id').value = record.id;
  document.getElementById('labor-client').value = record.clientId || '';
  document.getElementById('labor-work').value = record.workType || '';
  document.getElementById('labor-supervisor').value = record.supervisor || '';
  document.getElementById('labor-workers').value = record.totalWorkers || 0;
  document.getElementById('labor-present').value = record.totalPresent || 0;
  document.getElementById('labor-pay').value = record.totalPay || 0;
  openModal('labor-modal');
}

async function handleSubmit(event) {
  event.preventDefault();
  
  const clientSelect = document.getElementById('labor-client');
  const data = {
    date: document.getElementById('labor-date').value,
    clientId: clientSelect.value,
    clientName: clientSelect.options[clientSelect.selectedIndex]?.dataset?.name || '',
    workType: document.getElementById('labor-work').value.trim(),
    supervisor: document.getElementById('labor-supervisor').value.trim(),
    totalWorkers: Number(document.getElementById('labor-workers').value) || 0,
    totalPresent: Number(document.getElementById('labor-present').value) || 0,
    totalPay: Number(document.getElementById('labor-pay').value) || 0
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
