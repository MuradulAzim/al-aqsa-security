/**
 * Al Aksha Security Management System - Google Apps Script Backend
 * 
 * SETUP INSTRUCTIONS:
 * 1. Create a new Google Spreadsheet
 * 2. Go to Extensions > Apps Script
 * 3. Copy this entire code into the script editor
 * 4. Run the initSpreadsheet() function once to create all sheets
 * 5. Deploy > New deployment > Web App
 *    - Execute as: Me
 *    - Who has access: Anyone
 * 6. Copy the web app URL and update CONFIG.API_URL in your app
 * 
 * SHEET STRUCTURE:
 * The system creates these sheets automatically:
 * - employees: id, name, pin, role, phone, nid, salary, status, createdAt
 * - clients: id, name, address, phone, email, contactPerson, rate, status, createdAt
 * - guardDuty: id, employeeId, employeeName, clientId, date, status, checkIn, checkOut, notes
 * - vesselOrders: id, clientId, clientName, motherVessel, lighterVessel, employeeId, employeeName, dutyStartDate, dutyStartShift, dutyEndDate, dutyEndShift, dutyDays, ratePerDay, revenue, conveyance, totalAmount, status, notes, createdAt
 * - dayLabor: id, employeeId, employeeName, date, hours, rate, amount, clientId, clientName, notes
 * - advances: id, employeeId, employeeName, amount, date, reason, status, approvedBy
 * - salary: id, employeeId, employeeName, month, year, daysWorked, grossSalary, advances, netPay, status, paidDate
 * - invoices: id, invoiceNumber, clientId, clientName, date, dueDate, description, amount, taxPercent, taxAmount, total, status, notes, createdBy
 */

const SPREADSHEET_ID = SpreadsheetApp.getActiveSpreadsheet().getId();

// Sheet names
const SHEETS = {
  EMPLOYEES: 'employees',
  CLIENTS: 'clients',
  GUARD_DUTY: 'guardDuty',
  VESSEL_ORDERS: 'vesselOrders',
  DAY_LABOR: 'dayLabor',
  ADVANCES: 'advances',
  SALARY: 'salary',
  INVOICES: 'invoices'
};

// Initialize spreadsheet with all required sheets
function initSpreadsheet() {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  
  const sheetConfigs = [
    { name: SHEETS.EMPLOYEES, headers: ['id', 'name', 'pin', 'role', 'phone', 'nid', 'salary', 'status', 'createdAt'] },
    { name: SHEETS.CLIENTS, headers: ['id', 'name', 'address', 'phone', 'email', 'contactPerson', 'rate', 'status', 'createdAt'] },
    { name: SHEETS.GUARD_DUTY, headers: ['id', 'employeeId', 'employeeName', 'clientId', 'clientName', 'date', 'shift', 'status', 'notes'] },
    { name: SHEETS.VESSEL_ORDERS, headers: ['id', 'clientId', 'clientName', 'motherVessel', 'lighterVessel', 'employeeId', 'employeeName', 'dutyStartDate', 'dutyStartShift', 'dutyEndDate', 'dutyEndShift', 'dutyDays', 'ratePerDay', 'revenue', 'conveyance', 'totalAmount', 'status', 'notes', 'createdAt'] },
    { name: SHEETS.DAY_LABOR, headers: ['id', 'employeeId', 'employeeName', 'date', 'hours', 'rate', 'amount', 'clientId', 'clientName', 'notes'] },
    { name: SHEETS.ADVANCES, headers: ['id', 'employeeId', 'employeeName', 'amount', 'date', 'reason', 'status', 'approvedBy'] },
    { name: SHEETS.SALARY, headers: ['id', 'employeeId', 'employeeName', 'month', 'year', 'daysWorked', 'grossSalary', 'advances', 'netPay', 'status', 'paidDate'] },
    { name: SHEETS.INVOICES, headers: ['id', 'invoiceNumber', 'clientId', 'clientName', 'date', 'dueDate', 'description', 'amount', 'taxPercent', 'taxAmount', 'total', 'status', 'notes', 'createdBy'] }
  ];
  
  sheetConfigs.forEach(config => {
    let sheet = ss.getSheetByName(config.name);
    if (!sheet) {
      sheet = ss.insertSheet(config.name);
      sheet.appendRow(config.headers);
      sheet.getRange(1, 1, 1, config.headers.length).setFontWeight('bold');
    }
  });
  
  Logger.log('Spreadsheet initialized successfully!');
}

// Handle GET requests (read operations)
function doGet(e) {
  const params = e.parameter;
  const action = params.action;
  
  try {
    let result;
    
    switch (action) {
      case 'getEmployees':
        result = getAll(SHEETS.EMPLOYEES);
        break;
      case 'getClients':
        result = getAll(SHEETS.CLIENTS);
        break;
      case 'getGuardDuty':
        result = params.date ? getByDate(SHEETS.GUARD_DUTY, params.date) : getAll(SHEETS.GUARD_DUTY);
        break;
      case 'getVesselOrders':
        result = getAll(SHEETS.VESSEL_ORDERS);
        break;
      case 'getDayLabor':
        result = params.date ? getByDate(SHEETS.DAY_LABOR, params.date) : getAll(SHEETS.DAY_LABOR);
        break;
      case 'getAdvances':
        result = getAll(SHEETS.ADVANCES);
        break;
      case 'getSalary':
        result = getSalaryByMonthYear(params.month, params.year);
        break;
      case 'getInvoices':
        result = getAll(SHEETS.INVOICES);
        break;
      case 'getDashboardStats':
        result = getDashboardStats();
        break;
      default:
        result = { error: 'Invalid action' };
    }
    
    return ContentService.createTextOutput(JSON.stringify({ success: true, data: result }))
      .setMimeType(ContentService.MimeType.JSON);
  } catch (error) {
    return ContentService.createTextOutput(JSON.stringify({ success: false, error: error.toString() }))
      .setMimeType(ContentService.MimeType.JSON);
  }
}

// Handle POST requests (write operations)
function doPost(e) {
  let params;
  try {
    params = JSON.parse(e.postData.contents);
  } catch (error) {
    return ContentService.createTextOutput(JSON.stringify({ success: false, error: 'Invalid JSON' }))
      .setMimeType(ContentService.MimeType.JSON);
  }
  
  const action = params.action;
  const data = params.data;
  
  try {
    let result;
    
    switch (action) {
      // Employee operations
      case 'addEmployee':
        result = addRow(SHEETS.EMPLOYEES, data);
        break;
      case 'updateEmployee':
        result = updateRow(SHEETS.EMPLOYEES, data);
        break;
      case 'deleteEmployee':
        result = deleteRow(SHEETS.EMPLOYEES, data.id);
        break;
      
      // Client operations
      case 'addClient':
        result = addRow(SHEETS.CLIENTS, data);
        break;
      case 'updateClient':
        result = updateRow(SHEETS.CLIENTS, data);
        break;
      case 'deleteClient':
        result = deleteRow(SHEETS.CLIENTS, data.id);
        break;
      
      // Guard Duty operations
      case 'addGuardDuty':
        result = addRow(SHEETS.GUARD_DUTY, data);
        break;
      case 'updateGuardDuty':
        result = updateRow(SHEETS.GUARD_DUTY, data);
        break;
      case 'deleteGuardDuty':
        result = deleteRow(SHEETS.GUARD_DUTY, data.id);
        break;
      
      // Vessel Orders operations
      case 'addVesselOrder':
        result = addRow(SHEETS.VESSEL_ORDERS, data);
        break;
      case 'updateVesselOrder':
        result = updateRow(SHEETS.VESSEL_ORDERS, data);
        break;
      case 'deleteVesselOrder':
        result = deleteRow(SHEETS.VESSEL_ORDERS, data.id);
        break;
      
      // Day Labor operations
      case 'addDayLabor':
        result = addRow(SHEETS.DAY_LABOR, data);
        break;
      case 'updateDayLabor':
        result = updateRow(SHEETS.DAY_LABOR, data);
        break;
      case 'deleteDayLabor':
        result = deleteRow(SHEETS.DAY_LABOR, data.id);
        break;
      
      // Advances operations
      case 'addAdvance':
        result = addRow(SHEETS.ADVANCES, data);
        break;
      case 'updateAdvance':
        result = updateRow(SHEETS.ADVANCES, data);
        break;
      case 'deleteAdvance':
        result = deleteRow(SHEETS.ADVANCES, data.id);
        break;
      
      // Salary operations
      case 'processSalary':
        result = addRow(SHEETS.SALARY, data);
        break;
      case 'updateSalary':
        result = updateRow(SHEETS.SALARY, data);
        break;
      
      // Invoice operations
      case 'addInvoice':
        result = addRow(SHEETS.INVOICES, data);
        break;
      case 'updateInvoice':
        result = updateRow(SHEETS.INVOICES, data);
        break;
      case 'deleteInvoice':
        result = deleteRow(SHEETS.INVOICES, data.id);
        break;
      
      // Login
      case 'login':
        result = authenticateUser(data.pin);
        break;
      
      default:
        result = { error: 'Invalid action' };
    }
    
    return ContentService.createTextOutput(JSON.stringify({ success: true, data: result }))
      .setMimeType(ContentService.MimeType.JSON);
  } catch (error) {
    return ContentService.createTextOutput(JSON.stringify({ success: false, error: error.toString() }))
      .setMimeType(ContentService.MimeType.JSON);
  }
}

// Helper: Get all rows from a sheet
function getAll(sheetName) {
  const sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName(sheetName);
  if (!sheet) return [];
  
  const data = sheet.getDataRange().getValues();
  if (data.length <= 1) return [];
  
  const headers = data[0];
  const rows = data.slice(1);
  
  return rows.map(row => {
    const obj = {};
    headers.forEach((header, index) => {
      let value = row[index];
      // Normalize Date objects to ISO string format (yyyy-MM-dd)
      if (value instanceof Date) {
        value = Utilities.formatDate(value, Session.getScriptTimeZone(), 'yyyy-MM-dd');
      }
      obj[header] = value;
    });
    return obj;
  }).filter(row => row.id); // Filter out empty rows
}

// Helper: Get rows by date
function getByDate(sheetName, date) {
  const all = getAll(sheetName);
  return all.filter(row => row.date === date);
}

// Helper: Get salary by month and year
function getSalaryByMonthYear(month, year) {
  const all = getAll(SHEETS.SALARY);
  return all.filter(row => row.month == month && row.year == year);
}

// Helper: Add a new row
function addRow(sheetName, data) {
  const sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName(sheetName);
  if (!sheet) throw new Error('Sheet not found: ' + sheetName);
  
  const headers = sheet.getRange(1, 1, 1, sheet.getLastColumn()).getValues()[0];
  
  // Generate ID if not provided
  if (!data.id) {
    data.id = Utilities.getUuid();
  }
  
  // Add createdAt if in headers and not provided
  if (headers.includes('createdAt') && !data.createdAt) {
    data.createdAt = new Date().toISOString();
  }
  
  const row = headers.map(header => data[header] !== undefined ? data[header] : '');
  sheet.appendRow(row);
  
  return { id: data.id };
}

// Helper: Update a row by ID
function updateRow(sheetName, data) {
  const sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName(sheetName);
  if (!sheet) throw new Error('Sheet not found: ' + sheetName);
  
  const headers = sheet.getRange(1, 1, 1, sheet.getLastColumn()).getValues()[0];
  const idCol = headers.indexOf('id') + 1;
  
  const values = sheet.getDataRange().getValues();
  for (let i = 1; i < values.length; i++) {
    if (values[i][idCol - 1] === data.id) {
      const row = headers.map(header => data[header] !== undefined ? data[header] : values[i][headers.indexOf(header)]);
      sheet.getRange(i + 1, 1, 1, row.length).setValues([row]);
      return { id: data.id };
    }
  }
  
  throw new Error('Record not found');
}

// Helper: Delete a row by ID
function deleteRow(sheetName, id) {
  const sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName(sheetName);
  if (!sheet) throw new Error('Sheet not found: ' + sheetName);
  
  const headers = sheet.getRange(1, 1, 1, sheet.getLastColumn()).getValues()[0];
  const idCol = headers.indexOf('id') + 1;
  
  const values = sheet.getDataRange().getValues();
  for (let i = 1; i < values.length; i++) {
    if (values[i][idCol - 1] === id) {
      sheet.deleteRow(i + 1);
      return { deleted: true };
    }
  }
  
  throw new Error('Record not found');
}

// Authenticate user by PIN
function authenticateUser(pin) {
  const employees = getAll(SHEETS.EMPLOYEES);
  const user = employees.find(e => e.pin === pin && e.status === 'active');
  
  if (user) {
    return {
      authenticated: true,
      user: {
        id: user.id,
        name: user.name,
        role: user.role
      }
    };
  }
  
  return { authenticated: false };
}

// Get dashboard statistics
function getDashboardStats() {
  const employees = getAll(SHEETS.EMPLOYEES);
  const clients = getAll(SHEETS.CLIENTS);
  const today = Utilities.formatDate(new Date(), Session.getScriptTimeZone(), 'yyyy-MM-dd');
  const guardDuty = getByDate(SHEETS.GUARD_DUTY, today);
  const dayLabor = getByDate(SHEETS.DAY_LABOR, today);
  
  const activeEmployees = employees.filter(e => e.status === 'active').length;
  const activeClients = clients.filter(c => c.status === 'active').length;
  const presentGuards = guardDuty.filter(g => g.status === 'present').length;
  const todayDayLabor = dayLabor.length;
  
  // Calculate monthly totals
  const now = new Date();
  const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);
  const monthEnd = new Date(now.getFullYear(), now.getMonth() + 1, 0);
  
  // Vessel orders this month (uses dutyStartDate from new schema)
  const vesselOrders = getAll(SHEETS.VESSEL_ORDERS);
  const monthlyVesselOrders = vesselOrders.filter(vo => {
    const date = new Date(vo.dutyStartDate);
    return !isNaN(date) && date >= monthStart && date <= monthEnd;
  }).length;
  
  Logger.log('[PHASE4] monthlyVesselOrders: ' + monthlyVesselOrders + ' (total records: ' + vesselOrders.length + ')');
  
  // Revenue is calculated ONLY from invoices (Invoice-Only Revenue Model)
  const invoices = getAll(SHEETS.INVOICES);
  const monthlyInvoices = invoices.filter(inv => {
    const date = new Date(inv.date);
    return date >= monthStart && date <= monthEnd;
  });
  const monthlyRevenue = monthlyInvoices.reduce((sum, inv) => sum + (parseFloat(inv.total) || 0), 0);
  
  Logger.log('[PHASE4] monthlyRevenue (invoice-only): ' + monthlyRevenue + ' (invoices count: ' + monthlyInvoices.length + ')');
  
  const advances = getAll(SHEETS.ADVANCES);
  const monthlyAdvances = advances.filter(adv => {
    const date = new Date(adv.date);
    return date >= monthStart && date <= monthEnd && adv.status === 'approved';
  });
  const totalAdvances = monthlyAdvances.reduce((sum, adv) => sum + (parseFloat(adv.amount) || 0), 0);
  
  // Count pending advances
  const pendingAdvances = advances.filter(adv => adv.status === 'pending').length;
  
  return {
    activeEmployees,
    activeClients,
    presentGuards,
    todayDayLabor,
    monthlyVesselOrders,
    monthlyRevenue,
    totalAdvances,
    pendingAdvances
  };
}

// Test function - can be run manually to test the setup
function testSetup() {
  initSpreadsheet();
  
  // Add a test employee
  const testEmployee = {
    name: 'Test Admin',
    pin: '1234',
    role: 'admin',
    phone: '01700000000',
    nid: '1234567890',
    salary: 30000,
    status: 'active'
  };
  
  const result = addRow(SHEETS.EMPLOYEES, testEmployee);
  Logger.log('Test employee added: ' + JSON.stringify(result));
  
  // Get all employees
  const employees = getAll(SHEETS.EMPLOYEES);
  Logger.log('All employees: ' + JSON.stringify(employees));
}
