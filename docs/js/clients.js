/**
 * Clients module for Al Aksha Security Management System
 */

let allClients = [];
let filteredClients = [];
let editingId = null;

async function initClients() {
  await loadClients();
}

async function loadClients() {
  try {
    showLoading();
    const result = await API.getClients();
    
    if (result.success) {
      allClients = result.data || [];
      filteredClients = [...allClients];
      renderClients();
    } else {
      showToast('Failed to load clients', 'error');
    }
    hideLoading();
  } catch (error) {
    console.error('Error loading clients:', error);
    hideLoading();
    showToast('Error loading clients', 'error');
  }
}

function renderClients() {
  const grid = document.getElementById('clients-grid');
  const emptyState = document.getElementById('empty-state');
  
  if (filteredClients.length === 0) {
    grid.innerHTML = '';
    emptyState.classList.remove('hidden');
    return;
  }
  
  emptyState.classList.add('hidden');
  
  grid.innerHTML = filteredClients.map(client => {
    const status = formatStatus(client.status);
    return `
      <div class="bg-white rounded-lg shadow p-5 card-hover">
        <div class="flex justify-between items-start mb-4">
          <div class="flex items-center gap-3">
            <div class="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
              <span class="text-2xl">🏢</span>
            </div>
            <div>
              <h3 class="font-semibold text-gray-800">${escapeHtml(client.name)}</h3>
              <p class="text-sm text-gray-500">${client.contactPerson || '-'}</p>
            </div>
          </div>
          <span class="badge ${status.class}">${status.text}</span>
        </div>
        
        <div class="space-y-2 text-sm text-gray-600 mb-4">
          <div class="flex items-center gap-2">
            <span>📞</span>
            <span>${client.phone || '-'}</span>
          </div>
          <div class="flex items-center gap-2">
            <span>💰</span>
            <span>Rate: ${client.rate ? formatCurrency(client.rate) : '-'}</span>
          </div>
        </div>
        
        <div class="flex justify-end gap-2 pt-3 border-t">
          <button onclick="editClient('${client.id}')" class="p-2 text-green-600 hover:bg-green-50 rounded-lg" title="Edit">✏️</button>
          <button onclick="deleteClient('${client.id}')" class="p-2 text-red-600 hover:bg-red-50 rounded-lg" title="Delete">🗑️</button>
        </div>
      </div>
    `;
  }).join('');
}

function openAddModal() {
  editingId = null;
  document.getElementById('modal-title').textContent = 'Add Client';
  document.getElementById('submit-btn').textContent = 'Save Client';
  clearForm('client-form');
  document.getElementById('client-status').value = 'active';
  openModal('client-modal');
}

function editClient(id) {
  const client = allClients.find(c => c.id === id);
  if (!client) return;
  
  editingId = id;
  document.getElementById('modal-title').textContent = 'Edit Client';
  document.getElementById('submit-btn').textContent = 'Update Client';
  
  // Fill form with backend-supported fields only
  document.getElementById('client-id').value = client.id;
  document.getElementById('client-name').value = client.name || '';
  document.getElementById('client-contact').value = client.contactPerson || '';
  document.getElementById('client-phone').value = client.phone || '';
  document.getElementById('client-guard-rate').value = client.rate || '';
  document.getElementById('client-status').value = client.status || 'active';
  // Note: serviceType, vesselRate, laborRate, paymentTerms are not persisted
  document.getElementById('client-service').value = 'all';
  document.getElementById('client-vessel-rate').value = '';
  document.getElementById('client-labor-rate').value = '';
  document.getElementById('client-payment').value = 'monthly';
  
  openModal('client-modal');
}

async function handleSubmit(event) {
  event.preventDefault();
  
  // Only include fields supported by backend schema:
  // id, name, address, phone, email, contactPerson, rate, status, createdAt
  const clientData = {
    name: document.getElementById('client-name').value.trim(),
    contactPerson: document.getElementById('client-contact').value.trim(),
    phone: document.getElementById('client-phone').value.trim(),
    rate: Number(document.getElementById('client-guard-rate').value) || 0,
    status: document.getElementById('client-status').value
  };
  // Note: serviceType, vesselRate, laborRate, paymentTerms are NOT supported by backend
  
  if (!clientData.name || !clientData.phone) {
    showToast('Please fill in all required fields', 'error');
    return;
  }
  
  try {
    showLoading();
    let result;
    
    if (editingId) {
      clientData.id = editingId;
      result = await API.updateClient(clientData);
    } else {
      result = await API.addClient(clientData);
    }
    
    if (result.success) {
      showToast(editingId ? 'Client updated successfully' : 'Client added successfully', 'success');
      closeModal('client-modal');
      await loadClients();
    } else {
      showToast(result.message || 'Operation failed', 'error');
    }
    hideLoading();
  } catch (error) {
    console.error('Error saving client:', error);
    hideLoading();
    showToast('Error saving client', 'error');
  }
}

async function deleteClient(id) {
  const client = allClients.find(c => c.id === id);
  if (!client) return;
  
  if (!confirmDelete(`Are you sure you want to delete ${client.name}?`)) return;
  
  try {
    showLoading();
    const result = await API.deleteClient(id);
    
    if (result.success) {
      showToast('Client deleted successfully', 'success');
      await loadClients();
    } else {
      showToast(result.message || 'Delete failed', 'error');
    }
    hideLoading();
  } catch (error) {
    console.error('Error deleting client:', error);
    hideLoading();
    showToast('Error deleting client', 'error');
  }
}

const handleSearch = debounce(() => filterClients(), 300);

function handleFilter() {
  filterClients();
}

function filterClients() {
  const search = document.getElementById('search-input').value.toLowerCase();
  const statusFilter = document.getElementById('status-filter').value;
  
  filteredClients = allClients.filter(client => {
    const matchesSearch = !search || 
      (client.name && client.name.toLowerCase().includes(search)) ||
      (client.phone && client.phone.includes(search)) ||
      (client.contactPerson && client.contactPerson.toLowerCase().includes(search));
    
    const matchesStatus = !statusFilter || client.status === statusFilter;
    
    return matchesSearch && matchesStatus;
  });
  
  renderClients();
}
