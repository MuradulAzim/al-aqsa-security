/**
 * Vessel Orders module
 */

let allOrders = [];
let filteredOrders = [];
let clients = [];
let editingId = null;

async function initVesselOrders() {
  await loadClients();
  await loadOrders();
}

async function loadClients() {
  const result = await API.getClients();
  if (result.success) {
    clients = (result.data || []).filter(c => c.status === 'active');
    const select = document.getElementById('order-client');
    select.innerHTML = '<option value="">Select Client</option>' + 
      clients.map(c => `<option value="${c.id}" data-name="${escapeHtml(c.name)}">${escapeHtml(c.name)}</option>`).join('');
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
    }
    hideLoading();
  } catch (error) {
    hideLoading();
    showToast('Error loading orders', 'error');
  }
}

function renderOrders() {
  const tbody = document.getElementById('orders-table');
  const emptyState = document.getElementById('empty-state');
  
  if (filteredOrders.length === 0) {
    tbody.innerHTML = '';
    emptyState.classList.remove('hidden');
    return;
  }
  
  emptyState.classList.add('hidden');
  tbody.innerHTML = filteredOrders.map(order => {
    const status = formatStatus(order.status);
    return `
      <tr>
        <td><div class="font-medium">${escapeHtml(order.vesselName || '-')}</div></td>
        <td>${escapeHtml(order.clientName || '-')}</td>
        <td class="text-sm">
          ${order.startDate ? formatDate(order.startDate) : '-'}
          ${order.endDate ? ' → ' + formatDate(order.endDate) : ''}
        </td>
        <td>${escapeHtml(order.cargoType || '-')}</td>
        <td>${order.totalAmount ? formatCurrency(order.totalAmount) : '-'}</td>
        <td><span class="badge ${status.class}">${status.text}</span></td>
        <td class="text-center">
          <button onclick="editOrder('${order.id}')" class="p-2 text-green-600 hover:bg-green-50 rounded-lg">✏️</button>
          <button onclick="deleteOrder('${order.id}')" class="p-2 text-red-600 hover:bg-red-50 rounded-lg">🗑️</button>
        </td>
      </tr>
    `;
  }).join('');
}

function openAddModal() {
  editingId = null;
  document.getElementById('modal-title').textContent = 'New Vessel Order';
  clearForm('order-form');
  document.getElementById('order-start').value = getToday();
  document.getElementById('order-status').value = 'pending';
  openModal('order-modal');
}

function editOrder(id) {
  const order = allOrders.find(o => o.id === id);
  if (!order) return;
  
  editingId = id;
  document.getElementById('modal-title').textContent = 'Edit Order';
  document.getElementById('order-id').value = order.id;
  document.getElementById('order-client').value = order.clientId || '';
  document.getElementById('order-vessel').value = order.vesselName || '';
  document.getElementById('order-cargo').value = order.cargoType || '';
  document.getElementById('order-start').value = order.startDate || '';
  document.getElementById('order-end').value = order.endDate || '';
  document.getElementById('order-conveyance').value = order.conveyance || '';
  document.getElementById('order-amount').value = order.totalAmount || '';
  document.getElementById('order-status').value = order.status || 'pending';
  openModal('order-modal');
}

async function handleSubmit(event) {
  event.preventDefault();
  
  const clientSelect = document.getElementById('order-client');
  const data = {
    clientId: clientSelect.value,
    clientName: clientSelect.options[clientSelect.selectedIndex]?.dataset?.name || '',
    vesselName: document.getElementById('order-vessel').value.trim(),
    cargoType: document.getElementById('order-cargo').value.trim(),
    startDate: document.getElementById('order-start').value,
    endDate: document.getElementById('order-end').value,
    conveyance: Number(document.getElementById('order-conveyance').value) || 0,
    totalAmount: Number(document.getElementById('order-amount').value) || 0,
    status: document.getElementById('order-status').value
  };
  
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
      showToast(editingId ? 'Order updated' : 'Order created', 'success');
      closeModal('order-modal');
      await loadOrders();
    }
    hideLoading();
  } catch (error) {
    hideLoading();
    showToast('Error saving order', 'error');
  }
}

async function deleteOrder(id) {
  if (!confirmDelete('Delete this order?')) return;
  try {
    showLoading();
    const result = await API.deleteVesselOrder(id);
    if (result.success) {
      showToast('Order deleted', 'success');
      await loadOrders();
    }
    hideLoading();
  } catch (error) {
    hideLoading();
    showToast('Error deleting order', 'error');
  }
}

const handleSearch = debounce(() => filterOrders(), 300);
function handleFilter() { filterOrders(); }

function filterOrders() {
  const search = document.getElementById('search-input').value.toLowerCase();
  const statusFilter = document.getElementById('status-filter').value;
  
  filteredOrders = allOrders.filter(order => {
    const matchesSearch = !search || 
      (order.vesselName && order.vesselName.toLowerCase().includes(search)) ||
      (order.clientName && order.clientName.toLowerCase().includes(search));
    const matchesStatus = !statusFilter || order.status === statusFilter;
    return matchesSearch && matchesStatus;
  });
  renderOrders();
}
