/**
 * Invoices module
 */

let allInvoices = [];
let filteredInvoices = [];
let clients = [];
let editingId = null;

async function initInvoices() {
  await loadClients();
  await loadInvoices();
  
  // Add event listeners for total calculation
  document.getElementById('invoice-amount').addEventListener('input', calculateTotal);
  document.getElementById('invoice-tax').addEventListener('input', calculateTotal);
}

async function loadClients() {
  const result = await API.getClients();
  if (result.success) {
    clients = (result.data || []).filter(c => c.status === 'active');
    
    const clientSelect = document.getElementById('invoice-client');
    const filterSelect = document.getElementById('client-filter');
    
    clientSelect.innerHTML = '<option value="">Select Client</option>' + 
      clients.map(c => `<option value="${c.id}" data-name="${escapeHtml(c.name)}">${escapeHtml(c.name)}</option>`).join('');
    
    filterSelect.innerHTML = '<option value="">All Clients</option>' + 
      clients.map(c => `<option value="${c.id}">${escapeHtml(c.name)}</option>`).join('');
  }
}

async function loadInvoices() {
  try {
    showLoading();
    const result = await API.getInvoices();
    if (result.success) {
      allInvoices = result.data || [];
      filteredInvoices = [...allInvoices];
      renderTable();
      updateSummary();
    }
    hideLoading();
  } catch (error) {
    hideLoading();
    showToast('Error loading invoices', 'error');
  }
}

function renderTable() {
  const tbody = document.getElementById('invoices-table');
  const emptyState = document.getElementById('empty-state');
  
  if (filteredInvoices.length === 0) {
    tbody.innerHTML = '';
    emptyState.classList.remove('hidden');
    return;
  }
  
  emptyState.classList.add('hidden');
  tbody.innerHTML = filteredInvoices.map(inv => {
    const status = formatInvoiceStatus(inv.status);
    return `
      <tr>
        <td><div class="font-medium">${escapeHtml(inv.invoiceNumber || '-')}</div></td>
        <td>${escapeHtml(inv.clientName || '-')}</td>
        <td>${inv.date ? formatDate(inv.date) : '-'}</td>
        <td>${inv.dueDate ? formatDate(inv.dueDate) : '-'}</td>
        <td class="font-semibold">${formatCurrency(inv.total || 0)}</td>
        <td><span class="badge ${status.class}">${status.text}</span></td>
        <td class="text-center">
          <button onclick="previewInvoice('${inv.id}')" class="p-2 text-blue-600 hover:bg-blue-50 rounded-lg" title="Preview">👁️</button>
          <button onclick="editInvoice('${inv.id}')" class="p-2 text-green-600 hover:bg-green-50 rounded-lg" title="Edit">✏️</button>
          <button onclick="deleteInvoice('${inv.id}')" class="p-2 text-red-600 hover:bg-red-50 rounded-lg" title="Delete">🗑️</button>
        </td>
      </tr>
    `;
  }).join('');
}

function formatInvoiceStatus(status) {
  const map = {
    draft: { text: 'Draft', class: 'badge-gray' },
    sent: { text: 'Sent', class: 'badge-blue' },
    paid: { text: 'Paid', class: 'badge-green' },
    overdue: { text: 'Overdue', class: 'badge-red' }
  };
  return map[status] || { text: status || 'Draft', class: 'badge-gray' };
}

function updateSummary() {
  const total = allInvoices.length;
  const pending = allInvoices.filter(i => i.status !== 'paid').length;
  const paidAmount = allInvoices.filter(i => i.status === 'paid').reduce((sum, i) => sum + (i.total || 0), 0);
  const totalAmount = allInvoices.reduce((sum, i) => sum + (i.total || 0), 0);
  
  document.getElementById('total-invoices').textContent = total;
  document.getElementById('pending-count').textContent = pending;
  document.getElementById('paid-amount').textContent = formatCurrency(paidAmount);
  document.getElementById('total-amount').textContent = formatCurrency(totalAmount);
}

function calculateTotal() {
  const amount = Number(document.getElementById('invoice-amount').value) || 0;
  const taxPercent = Number(document.getElementById('invoice-tax').value) || 0;
  const taxAmount = Math.round(amount * taxPercent / 100);
  const total = amount + taxAmount;
  
  document.getElementById('subtotal').textContent = formatCurrency(amount);
  document.getElementById('tax-amount').textContent = formatCurrency(taxAmount);
  document.getElementById('total-display').textContent = formatCurrency(total);
}

function generateInvoiceNumber() {
  const count = allInvoices.length + 1;
  return `INV-${String(count).padStart(4, '0')}`;
}

function openAddModal() {
  editingId = null;
  document.getElementById('modal-title').textContent = 'New Invoice';
  clearForm('invoice-form');
  document.getElementById('invoice-number').value = generateInvoiceNumber();
  document.getElementById('invoice-date').value = getToday();
  
  // Set due date to 30 days from now
  const dueDate = new Date();
  dueDate.setDate(dueDate.getDate() + 30);
  document.getElementById('invoice-due').value = dueDate.toISOString().split('T')[0];
  
  document.getElementById('invoice-status').value = 'draft';
  document.getElementById('invoice-tax').value = '0';
  calculateTotal();
  openModal('invoice-modal');
}

function editInvoice(id) {
  const inv = allInvoices.find(i => i.id === id);
  if (!inv) return;
  
  editingId = id;
  document.getElementById('modal-title').textContent = 'Edit Invoice';
  document.getElementById('invoice-id').value = inv.id;
  document.getElementById('invoice-number').value = inv.invoiceNumber || '';
  document.getElementById('invoice-client').value = inv.clientId || '';
  document.getElementById('invoice-date').value = inv.date || '';
  document.getElementById('invoice-due').value = inv.dueDate || '';
  document.getElementById('invoice-description').value = inv.description || '';
  document.getElementById('invoice-amount').value = inv.amount || 0;
  document.getElementById('invoice-tax').value = inv.taxPercent || 0;
  document.getElementById('invoice-status').value = inv.status || 'draft';
  document.getElementById('invoice-notes').value = inv.notes || '';
  calculateTotal();
  openModal('invoice-modal');
}

async function handleSubmit(event) {
  event.preventDefault();
  
  const clientSelect = document.getElementById('invoice-client');
  const amount = Number(document.getElementById('invoice-amount').value) || 0;
  const taxPercent = Number(document.getElementById('invoice-tax').value) || 0;
  const taxAmount = Math.round(amount * taxPercent / 100);
  
  const data = {
    invoiceNumber: document.getElementById('invoice-number').value.trim(),
    clientId: clientSelect.value,
    clientName: clientSelect.options[clientSelect.selectedIndex]?.dataset?.name || '',
    date: document.getElementById('invoice-date').value,
    dueDate: document.getElementById('invoice-due').value,
    description: document.getElementById('invoice-description').value.trim(),
    amount,
    taxPercent,
    taxAmount,
    total: amount + taxAmount,
    status: document.getElementById('invoice-status').value,
    notes: document.getElementById('invoice-notes').value.trim(),
    createdBy: getCurrentUser()?.name || ''
  };
  
  try {
    showLoading();
    let result;
    if (editingId) {
      data.id = editingId;
      result = await API.updateInvoice(data);
    } else {
      result = await API.addInvoice(data);
    }
    
    if (result.success) {
      showToast(editingId ? 'Invoice updated' : 'Invoice created', 'success');
      closeModal('invoice-modal');
      await loadInvoices();
    }
    hideLoading();
  } catch (error) {
    hideLoading();
    showToast('Error saving invoice', 'error');
  }
}

async function deleteInvoice(id) {
  if (!confirmDelete('Delete this invoice?')) return;
  try {
    showLoading();
    const result = await API.deleteInvoice(id);
    if (result.success) {
      showToast('Invoice deleted', 'success');
      await loadInvoices();
    }
    hideLoading();
  } catch (error) {
    hideLoading();
    showToast('Error deleting invoice', 'error');
  }
}

function previewInvoice(id) {
  const inv = allInvoices.find(i => i.id === id);
  if (!inv) return;
  
  const client = clients.find(c => c.id === inv.clientId) || {};
  
  document.getElementById('print-content').innerHTML = `
    <div id="printable-invoice" class="font-sans">
      <div class="flex justify-between items-start border-b pb-4 mb-4">
        <div>
          <h1 class="text-2xl font-bold text-primary">${CONFIG.COMPANY.name}</h1>
          <p class="text-sm text-gray-500">${CONFIG.COMPANY.address}</p>
          <p class="text-sm text-gray-500">${CONFIG.COMPANY.phone}</p>
        </div>
        <div class="text-right">
          <h2 class="text-xl font-bold">INVOICE</h2>
          <p class="text-lg font-medium">${escapeHtml(inv.invoiceNumber)}</p>
          <p class="text-sm text-gray-500">Date: ${formatDate(inv.date)}</p>
          <p class="text-sm text-gray-500">Due: ${formatDate(inv.dueDate)}</p>
        </div>
      </div>
      
      <div class="mb-6">
        <h3 class="font-semibold text-gray-600 mb-1">Bill To:</h3>
        <p class="font-medium">${escapeHtml(inv.clientName)}</p>
        ${client.address ? `<p class="text-sm text-gray-500">${escapeHtml(client.address)}</p>` : ''}
        ${client.phone ? `<p class="text-sm text-gray-500">${escapeHtml(client.phone)}</p>` : ''}
      </div>
      
      <div class="mb-6">
        <table class="w-full text-left border-collapse">
          <thead>
            <tr class="bg-gray-100">
              <th class="border p-2">Description</th>
              <th class="border p-2 text-right">Amount</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td class="border p-2">${escapeHtml(inv.description || 'Security Services')}</td>
              <td class="border p-2 text-right">${formatCurrency(inv.amount)}</td>
            </tr>
          </tbody>
        </table>
      </div>
      
      <div class="flex justify-end mb-6">
        <div class="w-64">
          <div class="flex justify-between py-1">
            <span>Subtotal:</span>
            <span>${formatCurrency(inv.amount)}</span>
          </div>
          <div class="flex justify-between py-1">
            <span>Tax (${inv.taxPercent}%):</span>
            <span>${formatCurrency(inv.taxAmount)}</span>
          </div>
          <div class="flex justify-between py-2 border-t font-bold text-lg">
            <span>Total:</span>
            <span>${formatCurrency(inv.total)}</span>
          </div>
        </div>
      </div>
      
      ${inv.notes ? `
        <div class="text-sm text-gray-500">
          <h4 class="font-medium text-gray-700">Notes:</h4>
          <p>${escapeHtml(inv.notes)}</p>
        </div>
      ` : ''}
      
      <div class="mt-8 pt-4 border-t text-center text-sm text-gray-500">
        <p>Thank you for your business!</p>
      </div>
    </div>
  `;
  openModal('print-modal');
}

function printInvoice() {
  const content = document.getElementById('printable-invoice').innerHTML;
  const printWindow = window.open('', '_blank');
  printWindow.document.write(`
    <!DOCTYPE html>
    <html>
      <head>
        <title>Invoice</title>
        <script src="https://cdn.tailwindcss.com"><\/script>
        <style>
          @media print { body { padding: 20px; } }
        </style>
      </head>
      <body class="p-8">${content}</body>
      <script>window.onload = function() { window.print(); }<\/script>
    </html>
  `);
  printWindow.document.close();
}

const handleSearch = debounce(() => filterInvoices(), 300);
function handleFilter() { filterInvoices(); }

function filterInvoices() {
  const search = document.getElementById('search-input').value.toLowerCase();
  const clientFilter = document.getElementById('client-filter').value;
  const statusFilter = document.getElementById('status-filter').value;
  
  filteredInvoices = allInvoices.filter(inv => {
    const matchesSearch = !search || 
      (inv.invoiceNumber && inv.invoiceNumber.toLowerCase().includes(search)) ||
      (inv.clientName && inv.clientName.toLowerCase().includes(search));
    const matchesClient = !clientFilter || inv.clientId === clientFilter;
    const matchesStatus = !statusFilter || inv.status === statusFilter;
    return matchesSearch && matchesClient && matchesStatus;
  });
  renderTable();
}
