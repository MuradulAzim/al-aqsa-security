/**
 * Vessel Orders module - Enhanced with Client → Mother Vessel → Lighter Vessel hierarchy
 * Includes duty tracking, auto-revenue calculation, and grouped reporting
 */

let allOrders = [];
let filteredOrders = [];
let clients = [];
let employees = [];
let editingId = null;

// ===== INITIALIZATION =====
async function initVesselOrders() {
  await Promise.all([loadClients(), loadEmployees()]);
  await loadOrders();
  populateClientFilter();
}

async function loadClients() {
  const result = await API.getClients();
  if (result.success) {
    clients = (result.data || []).filter(c => c.status === 'active');
  }
}

async function loadEmployees() {
  const result = await API.getEmployees();
  if (result.success) {
    employees = (result.data || []).filter(e => e.status === 'active');
  }
}

async function loadOrders() {
  try {
    showLoading();
    const result = await API.getVesselOrders();
    if (result.success) {
      allOrders = result.data || [];
      filteredOrders = [...allOrders];
      renderOrders();
      updateSummary();
    }
    hideLoading();
  } catch (error) {
    hideLoading();
    showToast('Error loading orders', 'error');
  }
}

// ===== CLIENT FILTER DROPDOWN =====
function populateClientFilter() {
  const select = document.getElementById('client-filter');
  select.innerHTML = '<option value="">All Clients</option>' + 
    clients.map(c => `<option value="${c.id}">${escapeHtml(c.name)}</option>`).join('');
}

// ===== SEARCHABLE CLIENT DROPDOWN (Form) =====
function showOrderClientDropdown() {
  renderOrderClientDropdown(clients);
  document.getElementById('order-client-dropdown').classList.remove('hidden');
}

function filterOrderClients(searchText) {
  const search = searchText.toLowerCase();
  const filtered = clients.filter(c => 
    c.name.toLowerCase().includes(search) || 
    (c.contact && c.contact.toLowerCase().includes(search))
  );
  renderOrderClientDropdown(filtered);
  document.getElementById('order-client-dropdown').classList.remove('hidden');
}

function renderOrderClientDropdown(filteredClients) {
  const dropdown = document.getElementById('order-client-dropdown');
  if (filteredClients.length === 0) {
    dropdown.innerHTML = '<div class="px-3 py-2 text-gray-500">No clients found</div>';
  } else {
    dropdown.innerHTML = filteredClients.map(c => 
      `<div class="px-3 py-2 hover:bg-blue-50 cursor-pointer" data-id="${c.id}" data-name="${escapeHtml(c.name)}" onclick="selectOrderClient(this)">${escapeHtml(c.name)}</div>`
    ).join('');
  }
}

function selectOrderClient(element) {
  document.getElementById('order-client-id').value = element.dataset.id;
  document.getElementById('order-client').value = element.dataset.name;
  hideDropdown('order-client-dropdown');
}

// ===== SEARCHABLE EMPLOYEE DROPDOWN (Form) =====
function showOrderEmployeeDropdown() {
  renderOrderEmployeeDropdown(employees);
  document.getElementById('order-employee-dropdown').classList.remove('hidden');
}

function filterOrderEmployees(searchText) {
  const search = searchText.toLowerCase();
  const filtered = employees.filter(e => 
    e.name.toLowerCase().includes(search) || 
    (e.role && e.role.toLowerCase().includes(search)) ||
    (e.phone && e.phone.includes(search))
  );
  renderOrderEmployeeDropdown(filtered);
  document.getElementById('order-employee-dropdown').classList.remove('hidden');
}

function renderOrderEmployeeDropdown(filteredEmployees) {
  const dropdown = document.getElementById('order-employee-dropdown');
  if (filteredEmployees.length === 0) {
    dropdown.innerHTML = '<div class="px-3 py-2 text-gray-500">No employees found</div>';
  } else {
    dropdown.innerHTML = filteredEmployees.map(e => 
      `<div class="px-3 py-2 hover:bg-blue-50 cursor-pointer" data-id="${e.id}" data-name="${escapeHtml(e.name)}" onclick="selectOrderEmployee(this)">${escapeHtml(e.name)} <span class="text-gray-400 text-sm">(${e.role || ''})</span></div>`
    ).join('');
  }
}

function selectOrderEmployee(element) {
  document.getElementById('order-employee-id').value = element.dataset.id;
  document.getElementById('order-employee').value = element.dataset.name;
  hideDropdown('order-employee-dropdown');
}

function hideDropdown(id) {
  document.getElementById(id).classList.add('hidden');
}

// ===== DUTY DAYS CALCULATION =====
function calculateDutyDays() {
  const startDate = document.getElementById('order-start-date').value;
  const startShift = document.getElementById('order-start-shift').value;
  const endDate = document.getElementById('order-end-date').value;
  const endShift = document.getElementById('order-end-shift').value;
  
  if (!startDate) {
    document.getElementById('calculated-days').textContent = '0';
    return 0;
  }
  
  // If no end date, duty is ongoing - calculate from start to today
  const start = new Date(startDate);
  const end = endDate ? new Date(endDate) : new Date();
  
  // Calculate base days
  let days = Math.ceil((end - start) / (1000 * 60 * 60 * 24));
  
  // Adjust for shifts (each shift = 0.5 day)
  // Day shift starts at 0.5, Night shift starts at 1.0
  // Day shift ends at 0.5, Night shift ends at 1.0
  if (startShift === 'night') {
    days -= 0.5; // Started later in the day
  }
  if (endDate && endShift === 'day') {
    days -= 0.5; // Ended earlier in the day
  }
  if (endDate && endShift === 'night') {
    days += 0.5; // Full day including night
  }
  
  // Minimum 0.5 day
  days = Math.max(days, 0.5);
  
  console.log('[PHASE2] calculateDutyDays:', {
    startDate, startShift, endDate, endShift,
    calculatedDays: days
  });
  
  document.getElementById('calculated-days').textContent = days;
  calculateRevenue();
  return days;
}

// ===== REVENUE CALCULATION =====
function calculateRevenue() {
  const days = parseFloat(document.getElementById('calculated-days').textContent) || 0;
  const rate = parseFloat(document.getElementById('order-rate').value) || 0;
  const revenue = days * rate;
  
  console.log('[PHASE2] calculateRevenue:', {
    dutyDays: days,
    ratePerDay: rate,
    revenue: revenue,
    formula: `${days} × ${rate} = ${revenue}`
  });
  
  document.getElementById('order-revenue').value = revenue;
  calculateTotal();
}

function calculateTotal() {
  const revenue = parseFloat(document.getElementById('order-revenue').value) || 0;
  const conveyance = parseFloat(document.getElementById('order-conveyance').value) || 0;
  const total = revenue + conveyance;
  
  console.log('[PHASE2] calculateTotal:', {
    revenue: revenue,
    conveyance: conveyance,
    totalAmount: total,
    formula: `${revenue} + ${conveyance} = ${total}`
  });
  
  document.getElementById('order-total').value = total;
}

// ===== TABLE RENDERING =====
function renderOrders() {
  const tbody = document.getElementById('orders-table');
  const emptyState = document.getElementById('empty-state');
  
  if (filteredOrders.length === 0) {
    tbody.innerHTML = '';
    emptyState.classList.remove('hidden');
    return;
  }
  
  emptyState.classList.add('hidden');
  
  // Group orders by client, then by mother vessel
  const grouped = groupOrdersByClientAndVessel(filteredOrders);
  
  let html = '';
  for (const [clientName, vessels] of Object.entries(grouped)) {
    // Client header row
    html += `<tr class="bg-blue-50">
      <td colspan="10" class="font-bold text-blue-800">🏢 ${escapeHtml(clientName)}</td>
    </tr>`;
    
    for (const [motherVessel, orders] of Object.entries(vessels)) {
      // Mother vessel subheader
      html += `<tr class="bg-gray-50">
        <td class="pl-8 font-medium text-gray-700">🚢 ${escapeHtml(motherVessel)}</td>
        <td colspan="9"></td>
      </tr>`;
      
      // Individual orders (lighter vessels)
      orders.forEach(order => {
        const status = formatStatus(order.status);
        const dutyPeriod = formatDutyPeriod(order);
        html += `
          <tr>
            <td class="pl-12 text-gray-400 text-sm">↳</td>
            <td>${escapeHtml(order.lighterVessel || '-')}</td>
            <td>${escapeHtml(order.employeeName || '-')}</td>
            <td class="text-sm">${dutyPeriod}</td>
            <td class="text-center">${order.dutyDays || '-'}</td>
            <td>${order.revenue ? formatCurrency(order.revenue) : '-'}</td>
            <td>${order.conveyance ? formatCurrency(order.conveyance) : '-'}</td>
            <td class="font-medium">${order.totalAmount ? formatCurrency(order.totalAmount) : '-'}</td>
            <td><span class="badge ${status.class}">${status.text}</span></td>
            <td class="text-center">
              <button onclick="editOrder('${order.id}')" class="p-2 text-green-600 hover:bg-green-50 rounded-lg">✏️</button>
              <button onclick="deleteOrder('${order.id}')" class="p-2 text-red-600 hover:bg-red-50 rounded-lg">🗑️</button>
            </td>
          </tr>
        `;
      });
    }
  }
  
  tbody.innerHTML = html;
}

function groupOrdersByClientAndVessel(orders) {
  const grouped = {};
  orders.forEach(order => {
    const clientName = order.clientName || 'Unknown Client';
    const motherVessel = order.motherVessel || order.vesselName || 'Unknown Vessel';
    
    if (!grouped[clientName]) {
      grouped[clientName] = {};
    }
    if (!grouped[clientName][motherVessel]) {
      grouped[clientName][motherVessel] = [];
    }
    grouped[clientName][motherVessel].push(order);
  });
  return grouped;
}

function formatDutyPeriod(order) {
  const start = order.dutyStartDate || order.startDate;
  const end = order.dutyEndDate || order.endDate;
  const startShift = order.dutyStartShift ? ` (${order.dutyStartShift})` : '';
  const endShift = order.dutyEndShift ? ` (${order.dutyEndShift})` : '';
  
  if (!start) return '-';
  let period = formatDate(start) + startShift;
  if (end) {
    period += ' → ' + formatDate(end) + endShift;
  } else {
    period += ' → ongoing';
  }
  return period;
}

// ===== SUMMARY UPDATE =====
function updateSummary() {
  const activeAssignments = filteredOrders.filter(o => o.status === 'active').length;
  const totalDutyDays = filteredOrders.reduce((sum, o) => sum + (parseFloat(o.dutyDays) || 0), 0);
  const totalRevenue = filteredOrders.reduce((sum, o) => sum + (parseFloat(o.totalAmount) || 0), 0);
  const uniqueClients = new Set(filteredOrders.map(o => o.clientId)).size;
  
  document.getElementById('total-assignments').textContent = activeAssignments;
  document.getElementById('total-duty-days').textContent = totalDutyDays;
  document.getElementById('total-revenue').textContent = '৳' + totalRevenue.toLocaleString();
  document.getElementById('total-clients').textContent = uniqueClients;
}

// ===== MODAL FUNCTIONS =====
function openAddModal() {
  editingId = null;
  document.getElementById('modal-title').textContent = 'New Duty Assignment';
  clearForm('order-form');
  document.getElementById('order-client-id').value = '';
  document.getElementById('order-employee-id').value = '';
  document.getElementById('order-start-date').value = getToday();
  document.getElementById('order-start-shift').value = 'day';
  document.getElementById('order-status').value = 'active';
  document.getElementById('order-conveyance').value = '0';
  document.getElementById('calculated-days').textContent = '0';
  openModal('order-modal');
}

function editOrder(id) {
  const order = allOrders.find(o => o.id === id);
  if (!order) return;
  
  editingId = id;
  document.getElementById('modal-title').textContent = 'Edit Duty Assignment';
  document.getElementById('order-id').value = order.id;
  
  // Client
  document.getElementById('order-client-id').value = order.clientId || '';
  document.getElementById('order-client').value = order.clientName || '';
  
  // Vessels
  document.getElementById('order-mother-vessel').value = order.motherVessel || order.vesselName || '';
  document.getElementById('order-lighter-vessel').value = order.lighterVessel || '';
  
  // Employee
  document.getElementById('order-employee-id').value = order.employeeId || '';
  document.getElementById('order-employee').value = order.employeeName || '';
  
  // Duty period
  document.getElementById('order-start-date').value = order.dutyStartDate || order.startDate || '';
  document.getElementById('order-start-shift').value = order.dutyStartShift || 'day';
  document.getElementById('order-end-date').value = order.dutyEndDate || order.endDate || '';
  document.getElementById('order-end-shift').value = order.dutyEndShift || '';
  
  // Billing
  document.getElementById('order-rate').value = order.ratePerDay || '';
  document.getElementById('order-revenue').value = order.revenue || '';
  document.getElementById('order-conveyance').value = order.conveyance || 0;
  document.getElementById('order-total').value = order.totalAmount || '';
  document.getElementById('calculated-days').textContent = order.dutyDays || '0';
  
  // Status & notes
  document.getElementById('order-status').value = order.status || 'active';
  document.getElementById('order-notes').value = order.notes || '';
  
  openModal('order-modal');
}

// ===== FORM SUBMISSION =====
async function handleSubmit(event) {
  event.preventDefault();
  
  const clientId = document.getElementById('order-client-id').value;
  const employeeId = document.getElementById('order-employee-id').value;
  
  if (!clientId) {
    showToast('Please select a client from the dropdown', 'error');
    return;
  }
  if (!employeeId) {
    showToast('Please select an employee from the dropdown', 'error');
    return;
  }
  
  const data = {
    clientId: clientId,
    clientName: document.getElementById('order-client').value,
    motherVessel: document.getElementById('order-mother-vessel').value.trim(),
    lighterVessel: document.getElementById('order-lighter-vessel').value.trim(),
    employeeId: employeeId,
    employeeName: document.getElementById('order-employee').value,
    dutyStartDate: document.getElementById('order-start-date').value,
    dutyStartShift: document.getElementById('order-start-shift').value,
    dutyEndDate: document.getElementById('order-end-date').value,
    dutyEndShift: document.getElementById('order-end-shift').value,
    dutyDays: parseFloat(document.getElementById('calculated-days').textContent) || 0,
    ratePerDay: parseFloat(document.getElementById('order-rate').value) || 0,
    revenue: parseFloat(document.getElementById('order-revenue').value) || 0,
    conveyance: parseFloat(document.getElementById('order-conveyance').value) || 0,
    totalAmount: parseFloat(document.getElementById('order-total').value) || 0,
    status: document.getElementById('order-status').value,
    notes: document.getElementById('order-notes').value.trim()
  };
  
  console.log('[PHASE2] ===== FINAL PAYLOAD BEFORE API SUBMISSION =====');
  console.log('[PHASE2] Mode:', editingId ? 'UPDATE' : 'CREATE');
  console.log('[PHASE2] Payload:', JSON.stringify(data, null, 2));
  console.table(data);
  
  try {
    showLoading();
    let result;
    if (editingId) {
      data.id = editingId;
      result = await API.updateVesselOrder(data);
    } else {
      result = await API.addVesselOrder(data);
    }
    
    if (result.success) {
      showToast(editingId ? 'Assignment updated' : 'Assignment created', 'success');
      closeModal('order-modal');
      await loadOrders();
    } else {
      showToast(result.message || 'Operation failed', 'error');
    }
    hideLoading();
  } catch (error) {
    hideLoading();
    showToast('Error saving assignment', 'error');
  }
}

async function deleteOrder(id) {
  if (!confirmDelete('Delete this duty assignment?')) return;
  try {
    showLoading();
    const result = await API.deleteVesselOrder(id);
    if (result.success) {
      showToast('Assignment deleted', 'success');
      await loadOrders();
    }
    hideLoading();
  } catch (error) {
    hideLoading();
    showToast('Error deleting assignment', 'error');
  }
}

// ===== FILTERING =====
const handleSearch = debounce(() => filterOrders(), 300);
function handleFilter() { filterOrders(); }

function filterOrders() {
  const search = document.getElementById('search-input').value.toLowerCase();
  const statusFilter = document.getElementById('status-filter').value;
  const clientFilter = document.getElementById('client-filter').value;
  
  filteredOrders = allOrders.filter(order => {
    const matchesSearch = !search || 
      (order.motherVessel && order.motherVessel.toLowerCase().includes(search)) ||
      (order.lighterVessel && order.lighterVessel.toLowerCase().includes(search)) ||
      (order.vesselName && order.vesselName.toLowerCase().includes(search)) ||
      (order.employeeName && order.employeeName.toLowerCase().includes(search)) ||
      (order.clientName && order.clientName.toLowerCase().includes(search));
    const matchesStatus = !statusFilter || order.status === statusFilter;
    const matchesClient = !clientFilter || order.clientId === clientFilter;
    return matchesSearch && matchesStatus && matchesClient;
  });
  
  renderOrders();
  updateSummary();
}
