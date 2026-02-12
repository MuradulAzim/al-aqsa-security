/**
 * Advances module
 */

let allAdvances = [];
let filteredAdvances = [];
let employees = [];
let editingId = null;

async function initAdvances() {
  await loadEmployees();
  await loadAdvances();
}

async function loadEmployees() {
  const result = await API.getEmployees();
  if (result.success) {
    employees = (result.data || []).filter(e => e.status === 'active');
    const select = document.getElementById('advance-employee');
    select.innerHTML = '<option value="">Select Employee</option>' + 
      employees.map(e => `<option value="${e.id}" data-name="${escapeHtml(e.name)}">${escapeHtml(e.name)}</option>`).join('');
  }
}

async function loadAdvances() {
  try {
    showLoading();
    const result = await API.getAdvances();
    if (result.success) {
      allAdvances = result.data || [];
      filteredAdvances = [...allAdvances];
      renderTable();
      updateSummary();
    }
    hideLoading();
  } catch (error) {
    hideLoading();
    showToast('Error loading advances', 'error');
  }
}

function renderTable() {
  const tbody = document.getElementById('advances-table');
  const emptyState = document.getElementById('empty-state');
  
  if (filteredAdvances.length === 0) {
    tbody.innerHTML = '';
    emptyState.classList.remove('hidden');
    return;
  }
  
  emptyState.classList.add('hidden');
  tbody.innerHTML = filteredAdvances.map(adv => {
    const status = formatStatus(adv.status);
    return `
      <tr>
        <td><div class="font-medium">${escapeHtml(adv.employeeName || '-')}</div></td>
        <td class="font-semibold">${formatCurrency(adv.amount || 0)}</td>
        <td>${adv.date ? formatDate(adv.date) : '-'}</td>
        <td class="text-sm text-gray-500">${escapeHtml(truncateText(adv.reason, 30) || '-')}</td>
        <td><span class="badge ${status.class}">${status.text}</span></td>
        <td class="text-center">
          <button onclick="editAdvance('${adv.id}')" class="p-2 text-green-600 hover:bg-green-50 rounded-lg">✏️</button>
          <button onclick="deleteAdvance('${adv.id}')" class="p-2 text-red-600 hover:bg-red-50 rounded-lg">🗑️</button>
        </td>
      </tr>
    `;
  }).join('');
}

function updateSummary() {
  const total = allAdvances.length;
  const pending = allAdvances.filter(a => a.status === 'pending').length;
  const approvedAmount = allAdvances.filter(a => a.status === 'approved').reduce((sum, a) => sum + (a.amount || 0), 0);
  const totalAmount = allAdvances.reduce((sum, a) => sum + (a.amount || 0), 0);
  
  document.getElementById('total-advances').textContent = total;
  document.getElementById('pending-count').textContent = pending;
  document.getElementById('approved-amount').textContent = formatCurrency(approvedAmount);
  document.getElementById('total-amount').textContent = formatCurrency(totalAmount);
}

function openAddModal() {
  editingId = null;
  document.getElementById('modal-title').textContent = 'New Advance';
  clearForm('advance-form');
  document.getElementById('advance-date').value = getToday();
  document.getElementById('advance-status').value = 'pending';
  openModal('advance-modal');
}

function editAdvance(id) {
  const adv = allAdvances.find(a => a.id === id);
  if (!adv) return;
  
  editingId = id;
  document.getElementById('modal-title').textContent = 'Edit Advance';
  document.getElementById('advance-id').value = adv.id;
  document.getElementById('advance-employee').value = adv.employeeId || '';
  document.getElementById('advance-amount').value = adv.amount || '';
  document.getElementById('advance-date').value = adv.date || '';
  document.getElementById('advance-reason').value = adv.reason || '';
  document.getElementById('advance-status').value = adv.status || 'pending';
  openModal('advance-modal');
}

async function handleSubmit(event) {
  event.preventDefault();
  
  const employeeSelect = document.getElementById('advance-employee');
  const data = {
    employeeId: employeeSelect.value,
    employeeName: employeeSelect.options[employeeSelect.selectedIndex]?.dataset?.name || '',
    amount: Number(document.getElementById('advance-amount').value) || 0,
    date: document.getElementById('advance-date').value,
    reason: document.getElementById('advance-reason').value.trim(),
    status: document.getElementById('advance-status').value,
    approvedBy: getCurrentUser()?.name || ''
  };
  
  try {
    showLoading();
    let result;
    if (editingId) {
      data.id = editingId;
      result = await API.updateAdvance(data);
    } else {
      result = await API.addAdvance(data);
    }
    
    if (result.success) {
      showToast(editingId ? 'Advance updated' : 'Advance added', 'success');
      closeModal('advance-modal');
      await loadAdvances();
    }
    hideLoading();
  } catch (error) {
    hideLoading();
    showToast('Error saving advance', 'error');
  }
}

async function deleteAdvance(id) {
  if (!confirmDelete('Delete this advance record?')) return;
  try {
    showLoading();
    const result = await API.deleteAdvance(id);
    if (result.success) {
      showToast('Advance deleted', 'success');
      await loadAdvances();
    }
    hideLoading();
  } catch (error) {
    hideLoading();
    showToast('Error deleting advance', 'error');
  }
}

const handleSearch = debounce(() => filterAdvances(), 300);
function handleFilter() { filterAdvances(); }

function filterAdvances() {
  const search = document.getElementById('search-input').value.toLowerCase();
  const statusFilter = document.getElementById('status-filter').value;
  
  filteredAdvances = allAdvances.filter(adv => {
    const matchesSearch = !search || (adv.employeeName && adv.employeeName.toLowerCase().includes(search));
    const matchesStatus = !statusFilter || adv.status === statusFilter;
    return matchesSearch && matchesStatus;
  });
  renderTable();
}
