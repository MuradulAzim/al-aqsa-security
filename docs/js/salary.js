/**
 * Salary module
 */

let salaryRecords = [];
let employees = [];
let editingId = null;

async function initSalary() {
  // Set current month and year
  const { month, year } = getCurrentMonthYear();
  document.getElementById('salary-month').value = month;
  
  // Populate year dropdown
  const yearSelect = document.getElementById('salary-year');
  const currentYear = new Date().getFullYear();
  for (let y = currentYear - 2; y <= currentYear + 1; y++) {
    const option = document.createElement('option');
    option.value = y;
    option.textContent = y;
    if (y === year) option.selected = true;
    yearSelect.appendChild(option);
  }
  
  await loadEmployees();
  await loadSalary();
  
  // Add event listeners for net pay calculation
  document.getElementById('process-gross').addEventListener('input', calculateNetPay);
  document.getElementById('process-advances').addEventListener('input', calculateNetPay);
}

async function loadEmployees() {
  const result = await API.getEmployees();
  if (result.success) {
    employees = (result.data || []).filter(e => e.status === 'active');
    const select = document.getElementById('process-employee');
    select.innerHTML = '<option value="">Select Employee</option>' + 
      employees.map(e => `<option value="${e.id}" data-name="${escapeHtml(e.name)}" data-salary="${e.salary || 0}">${escapeHtml(e.name)}</option>`).join('');
  }
}

async function loadSalary() {
  const month = parseInt(document.getElementById('salary-month').value);
  const year = parseInt(document.getElementById('salary-year').value);
  
  try {
    showLoading();
    const result = await API.getSalary(month, year);
    if (result.success) {
      salaryRecords = result.data || [];
      renderTable();
      updateSummary();
    }
    hideLoading();
  } catch (error) {
    hideLoading();
    showToast('Error loading salary records', 'error');
  }
}

function renderTable() {
  const tbody = document.getElementById('salary-table');
  const emptyState = document.getElementById('empty-state');
  
  if (salaryRecords.length === 0) {
    tbody.innerHTML = '';
    emptyState.classList.remove('hidden');
    return;
  }
  
  emptyState.classList.add('hidden');
  tbody.innerHTML = salaryRecords.map(record => {
    const status = formatStatus(record.status);
    return `
      <tr>
        <td><div class="font-medium">${escapeHtml(record.employeeName || '-')}</div></td>
        <td>${record.daysWorked || 0}</td>
        <td>${formatCurrency(record.grossSalary || 0)}</td>
        <td class="text-red-600">${formatCurrency(record.advances || 0)}</td>
        <td class="font-semibold">${formatCurrency(record.netPay || 0)}</td>
        <td><span class="badge ${status.class}">${status.text}</span></td>
        <td class="text-center">
          <button onclick="editSalary('${record.id}')" class="p-2 text-green-600 hover:bg-green-50 rounded-lg">✏️</button>
          ${record.status !== 'paid' ? `<button onclick="markPaid('${record.id}')" class="p-2 text-blue-600 hover:bg-blue-50 rounded-lg" title="Mark as Paid">💵</button>` : ''}
        </td>
      </tr>
    `;
  }).join('');
}

function updateSummary() {
  const total = salaryRecords.length;
  const paid = salaryRecords.filter(r => r.status === 'paid').length;
  const pending = salaryRecords.filter(r => r.status === 'pending').length;
  const totalAmount = salaryRecords.reduce((sum, r) => sum + (r.netPay || 0), 0);
  
  document.getElementById('total-employees').textContent = total;
  document.getElementById('total-paid').textContent = paid;
  document.getElementById('total-pending').textContent = pending;
  document.getElementById('total-amount').textContent = formatCurrency(totalAmount);
}

function calculateNetPay() {
  const gross = Number(document.getElementById('process-gross').value) || 0;
  const advances = Number(document.getElementById('process-advances').value) || 0;
  document.getElementById('process-net').value = gross - advances;
}

function openProcessModal() {
  editingId = null;
  document.getElementById('modal-title').textContent = 'Process Salary';
  clearForm('salary-form');
  document.getElementById('process-status').value = 'pending';
  openModal('salary-modal');
}

function editSalary(id) {
  const record = salaryRecords.find(r => r.id === id);
  if (!record) return;
  
  editingId = id;
  document.getElementById('modal-title').textContent = 'Edit Salary';
  document.getElementById('record-id').value = record.id;
  document.getElementById('process-employee').value = record.employeeId || '';
  document.getElementById('process-days').value = record.daysWorked || 0;
  document.getElementById('process-gross').value = record.grossSalary || 0;
  document.getElementById('process-advances').value = record.advances || 0;
  document.getElementById('process-net').value = record.netPay || 0;
  document.getElementById('process-status').value = record.status || 'pending';
  openModal('salary-modal');
}

async function handleSubmit(event) {
  event.preventDefault();
  
  const employeeSelect = document.getElementById('process-employee');
  const month = parseInt(document.getElementById('salary-month').value);
  const year = parseInt(document.getElementById('salary-year').value);
  
  const data = {
    employeeId: employeeSelect.value,
    employeeName: employeeSelect.options[employeeSelect.selectedIndex]?.dataset?.name || '',
    month,
    year,
    daysWorked: Number(document.getElementById('process-days').value) || 0,
    grossSalary: Number(document.getElementById('process-gross').value) || 0,
    advances: Number(document.getElementById('process-advances').value) || 0,
    netPay: Number(document.getElementById('process-net').value) || 0,
    status: document.getElementById('process-status').value,
    paidDate: document.getElementById('process-status').value === 'paid' ? getToday() : ''
  };
  
  try {
    showLoading();
    let result;
    if (editingId) {
      data.id = editingId;
      result = await API.updateSalary(data);
    } else {
      result = await API.processSalary(data);
    }
    
    if (result.success) {
      showToast(editingId ? 'Salary updated' : 'Salary processed', 'success');
      closeModal('salary-modal');
      await loadSalary();
    }
    hideLoading();
  } catch (error) {
    hideLoading();
    showToast('Error saving salary', 'error');
  }
}

async function markPaid(id) {
  const record = salaryRecords.find(r => r.id === id);
  if (!record) return;
  
  if (!confirm(`Mark salary for ${record.employeeName} as paid?`)) return;
  
  try {
    showLoading();
    record.status = 'paid';
    record.paidDate = getToday();
    const result = await API.updateSalary(record);
    if (result.success) {
      showToast('Salary marked as paid', 'success');
      await loadSalary();
    }
    hideLoading();
  } catch (error) {
    hideLoading();
    showToast('Error updating salary', 'error');
  }
}
