## PROJECT SETUP: Al-Aqsa Security Management System

### OVERVIEW
Build a simple, lightweight security company management web app.
- Pure HTML + Vanilla JavaScript + Tailwind CSS (CDN)
- Google Sheets as database (via Google Apps Script Web App API)
- Simple PIN/password login (no Firebase, no complex auth)
- Hosted on Hostinger shared hosting (subdomain)
- No frameworks. No React. No Node.js. No build tools.
- Just plain HTML files that work when opened in browser.

### FOLDER STRUCTURE
Create this exact folder structure:

```
al-aksha-app/
│
├── index.html              (Login page - entry point)
├── dashboard.html          (Dashboard - main page after login)
├── employees.html          (Employee list + add/edit)
├── clients.html            (Client list + add/edit)
├── guard-duty.html         (Guard daily attendance)
├── vessel-orders.html      (Vessel escort orders)
├── day-labor.html          (Day labor attendance)
├── advances.html           (Advance payments)
├── salary.html             (Monthly salary payments)
├── invoices.html           (Invoice generator)
│
├── css/
│   └── style.css           (Custom styles beyond Tailwind)
│
├── js/
│   ├── config.js           (Google Sheets API URL + app settings)
│   ├── auth.js             (Login/logout/session management)
│   ├── api.js              (All Google Sheets API calls)
│   ├── utils.js            (Helper functions - dates, formatting)
│   ├── dashboard.js        (Dashboard logic)
│   ├── employees.js        (Employee CRUD logic)
│   ├── clients.js          (Client CRUD logic)
│   ├── guard-duty.js       (Guard duty logic)
│   ├── vessel-orders.js    (Vessel orders logic)
│   ├── day-labor.js        (Day labor logic)
│   ├── advances.js         (Advances logic)
│   ├── salary.js           (Salary logic)
│   └── invoices.js         (Invoice logic)
│
├── components/
│   ├── navbar.html         (Reusable navigation bar)
│   ├── sidebar.html        (Reusable sidebar menu)
│   └── modal.html          (Reusable modal template)
│
├── assets/
│   ├── logo.png            (Company logo)
│   └── favicon.ico         (Browser tab icon)
│
└── google-apps-script/
    └── Code.gs             (Google Apps Script code - paste into Google)
```

### STEP 1: Create index.html (Login Page)

Create a clean login page with:
- Company name: "Al Aksha Security Management System"
- Company logo placeholder (just a div with text "LOGO" for now)
- Simple login form:
  - Username field (text input)
  - PIN/Password field (password input, 4-6 digits)
  - "Login" button
  - Error message area (hidden by default)
- Use Tailwind CSS via CDN (no install needed)
- Mobile-first responsive design
- Center the login card on screen
- Color scheme: Dark blue (#1e3a5f) primary, White background, 
  Light gray (#f3f4f6) cards
- On login: check credentials against a hardcoded users 
  array in auth.js (for now)
- On success: save user info in localStorage and 
  redirect to dashboard.html
- On failure: show error message "Invalid username or PIN"

Hardcoded users for now (will move to Google Sheets later):
```javascript
const USERS = [
  { username: "admin", pin: "1234", role: "admin", name: "Admin User" },
  { username: "supervisor", pin: "5678", role: "supervisor", name: "Supervisor" },
  { username: "employee", pin: "0000", role: "employee", name: "Test Employee" }
];
```

### STEP 2: Create auth.js

Create authentication module with these functions:
- login(username, pin) - validates and stores session
- logout() - clears session and redirects to index.html
- isLoggedIn() - checks if valid session exists in localStorage
- getCurrentUser() - returns current user object from localStorage
- checkAuth() - call on every page load, redirects to 
  index.html if not logged in
- getRole() - returns current user role

Session storage format in localStorage:
```javascript
{
  key: "al_aksha_session",
  value: {
    username: "admin",
    name: "Admin User",
    role: "admin",
    loginTime: "2026-02-11T08:00:00Z"
  }
}
```

Session expires after 8 hours (configurable in config.js).

### STEP 3: Create config.js

Create configuration file with:
```javascript
const CONFIG = {
  APP_NAME: "Al Aksha Security Management System",
  APP_VERSION: "1.0.0",
  
  // Google Sheets API URL (will be filled after Apps Script deployment)
  API_URL: "", // Leave empty for now
  
  // Session settings
  SESSION_KEY: "al_aksha_session",
  SESSION_DURATION: 8 * 60 * 60 * 1000, // 8 hours in milliseconds
  
  // Date format
  DATE_FORMAT: "YYYY-MM-DD",
  CURRENCY: "৳", // Bangladeshi Taka
  
  // Company info (for invoices)
  COMPANY: {
    name: "Al Aksha Security Services",
    address: "Chattogram, Bangladesh",
    phone: "+880-XXXX-XXXXXX",
    email: "info@alaksha.com"
  },

  // Roles
  ROLES: {
    ADMIN: "admin",
    SUPERVISOR: "supervisor",
    EMPLOYEE: "employee"
  }
};
```

### STEP 4: Create utils.js

Create helper functions:
- formatDate(date) - returns "DD/MM/YYYY"
- formatDateTime(date) - returns "DD/MM/YYYY hh:mm AM/PM"
- formatCurrency(number) - returns "৳ 1,234"
- generateId(prefix) - returns "prefix-timestamp" (e.g., "EMP-1707600000")
- showToast(message, type) - shows success/error notification 
  (green/red bar at top, auto-hide after 3 seconds)
- showLoading() - shows loading spinner overlay
- hideLoading() - hides loading spinner
- confirmDelete(message) - shows confirm dialog, returns true/false
- loadComponent(elementId, filePath) - loads HTML component 
  into element (for navbar/sidebar reuse)
- debounce(func, delay) - prevents rapid API calls
- validatePhone(phone) - checks Bangladesh phone format
- getMonthName(monthNumber) - returns "January", "February", etc.
- getDaysInMonth(year, month) - returns number of days

### STEP 5: Create api.js

Create API module (Google Sheets communication):
```javascript
const API = {
  // Base function to call Google Apps Script
  async call(action, data = {}) {
    // If API_URL is empty, use local storage as fallback
    if (!CONFIG.API_URL) {
      return this.localFallback(action, data);
    }
    
    try {
      const response = await fetch(CONFIG.API_URL, {
        method: "POST",
        body: JSON.stringify({ action, ...data }),
        headers: { "Content-Type": "text/plain" }
      });
      const result = await response.json();
      return result;
    } catch (error) {
      console.error("API Error:", error);
      // Fallback to localStorage if API fails
      return this.localFallback(action, data);
    }
  },

  // localStorage fallback (works without Google Sheets)
  localFallback(action, data) {
    // Implement basic CRUD using localStorage
    // This allows the app to work even without 
    // Google Sheets connected
  },

  // Employee functions
  async getEmployees() { return this.call("getEmployees"); },
  async addEmployee(emp) { return this.call("addEmployee", emp); },
  async updateEmployee(emp) { return this.call("updateEmployee", emp); },
  async deleteEmployee(id) { return this.call("deleteEmployee", { id }); },

  // Client functions  
  async getClients() { return this.call("getClients"); },
  async addClient(client) { return this.call("addClient", client); },
  async updateClient(client) { return this.call("updateClient", client); },
  async deleteClient(id) { return this.call("deleteClient", { id }); },

  // Guard Duty functions
  async getGuardDuty(date) { return this.call("getGuardDuty", { date }); },
  async addGuardDuty(duty) { return this.call("addGuardDuty", duty); },
  async updateGuardDuty(duty) { return this.call("updateGuardDuty", duty); },

  // Vessel Order functions
  async getVesselOrders() { return this.call("getVesselOrders"); },
  async addVesselOrder(order) { return this.call("addVesselOrder", order); },
  async updateVesselOrder(order) { return this.call("updateVesselOrder", order); },

  // Day Labor functions
  async getDayLabor(date) { return this.call("getDayLabor", { date }); },
  async addDayLabor(labor) { return this.call("addDayLabor", labor); },

  // Advance functions
  async getAdvances(employeeId) { return this.call("getAdvances", { employeeId }); },
  async addAdvance(advance) { return this.call("addAdvance", advance); },
  async updateAdvance(advance) { return this.call("updateAdvance", advance); },

  // Salary functions
  async getSalary(month, year) { return this.call("getSalary", { month, year }); },
  async processSalary(salary) { return this.call("processSalary", salary); },

  // Invoice functions
  async getInvoices() { return this.call("getInvoices"); },
  async addInvoice(invoice) { return this.call("addInvoice", invoice); },
  async updateInvoice(invoice) { return this.call("updateInvoice", invoice); },

  // Dashboard
  async getDashboardData() { return this.call("getDashboardData"); }
};
```

### STEP 6: Create Reusable Navigation

Create navbar.html component:
- Top bar with:
  - Company name (left)
  - Current user name + role (right)
  - Logout button (right)
- Mobile hamburger menu
- Color: Dark blue (#1e3a5f) background, white text

Create sidebar.html component:
- Vertical menu with icons (use emoji as icons for simplicity):
  - 📊 Dashboard
  - 👥 Employees
  - 🏢 Clients
  - 🛡️ Guard Duty
  - 🚢 Vessel Orders
  - 👷 Day Labor
  - 💰 Advances
  - 💵 Salary
  - 📄 Invoices
- Highlight current page
- Collapsible on mobile
- Role-based menu visibility:
  - Admin: sees all
  - Supervisor: sees Guard Duty, Vessel Orders, 
    Day Labor, Employees (view only)
  - Employee: sees Dashboard only (own info)

### STEP 7: Create dashboard.html

Simple dashboard with 6 stat cards:
- Total Active Employees (count)
- Total Active Clients (count)
- Guards On Duty Today (count)
- Vessel Orders This Month (count)
- Pending Advances (count)
- This Month Revenue (sum of paid invoices)

Each card:
- Emoji icon
- Label
- Number (large, bold)
- Background: white
- Border-left: colored (different color per card)

Below cards: 
- "Quick Actions" section with buttons:
  - "Mark Guard Attendance" → goes to guard-duty.html
  - "Create Vessel Order" → goes to vessel-orders.html
  - "Record Day Labor" → goes to day-labor.html

Data source: localStorage for now (will connect to Google Sheets later)

### STEP 8: Create Google Apps Script (Code.gs)

Create the Google Apps Script that will serve as backend:

```javascript
// This file goes into Google Apps Script editor
// (script.google.com)

// Spreadsheet ID (will be filled after creating the Google Sheet)
const SPREADSHEET_ID = "YOUR_SPREADSHEET_ID_HERE";

// Sheet names
const SHEETS = {
  EMPLOYEES: "Employees",
  CLIENTS: "Clients",
  GUARD_DUTY: "GuardDuty",
  VESSEL_ORDERS: "VesselOrders",
  VESSEL_PERSONNEL: "VesselPersonnel",
  DAY_LABOR: "DayLabor",
  DAY_LABOR_WORKERS: "DayLaborWorkers",
  ADVANCES: "Advances",
  SALARY: "Salary",
  INVOICES: "Invoices",
  USERS: "Users"
};

// Handle POST requests from the web app
function doPost(e) {
  try {
    const data = JSON.parse(e.postData.contents);
    const action = data.action;
    
    let result;
    
    switch(action) {
      case "getEmployees": result = getAll(SHEETS.EMPLOYEES); break;
      case "addEmployee": result = addRow(SHEETS.EMPLOYEES, data); break;
      case "updateEmployee": result = updateRow(SHEETS.EMPLOYEES, data); break;
      case "deleteEmployee": result = deleteRow(SHEETS.EMPLOYEES, data.id); break;
      case "getClients": result = getAll(SHEETS.CLIENTS); break;
      case "addClient": result = addRow(SHEETS.CLIENTS, data); break;
      case "getGuardDuty": result = getByDate(SHEETS.GUARD_DUTY, data.date); break;
      case "addGuardDuty": result = addRow(SHEETS.GUARD_DUTY, data); break;
      case "getDashboardData": result = getDashboardData(); break;
      // ... add more cases for each action
      default: result = { error: "Unknown action: " + action };
    }
    
    return ContentService
      .createTextOutput(JSON.stringify(result))
      .setMimeType(ContentService.MimeType.JSON);
      
  } catch(error) {
    return ContentService
      .createTextOutput(JSON.stringify({ error: error.toString() }))
      .setMimeType(ContentService.MimeType.JSON);
  }
}

// Handle GET requests (for CORS preflight)
function doGet(e) {
  return ContentService
    .createTextOutput(JSON.stringify({ status: "API is running" }))
    .setMimeType(ContentService.MimeType.JSON);
}

// Generic: Get all rows from a sheet
function getAll(sheetName) {
  const sheet = SpreadsheetApp.openById(SPREADSHEET_ID)
    .getSheetByName(sheetName);
  const data = sheet.getDataRange().getValues();
  const headers = data[0];
  const rows = data.slice(1).map(row => {
    const obj = {};
    headers.forEach((header, i) => obj[header] = row[i]);
    return obj;
  });
  return { success: true, data: rows };
}

// Generic: Add a row to a sheet
function addRow(sheetName, data) {
  const sheet = SpreadsheetApp.openById(SPREADSHEET_ID)
    .getSheetByName(sheetName);
  const headers = sheet.getRange(1, 1, 1, sheet.getLastColumn())
    .getValues()[0];
  const row = headers.map(header => data[header] || "");
  sheet.appendRow(row);
  return { success: true, message: "Added successfully" };
}

// Generic: Update a row by ID (first column)
function updateRow(sheetName, data) {
  const sheet = SpreadsheetApp.openById(SPREADSHEET_ID)
    .getSheetByName(sheetName);
  const allData = sheet.getDataRange().getValues();
  const headers = allData[0];
  
  for (let i = 1; i < allData.length; i++) {
    if (allData[i][0] === data.id) {
      const row = headers.map(header => data[header] || allData[i][headers.indexOf(header)]);
      sheet.getRange(i + 1, 1, 1, row.length).setValues([row]);
      return { success: true, message: "Updated successfully" };
    }
  }
  return { success: false, message: "Record not found" };
}

// Generic: Delete a row by ID
function deleteRow(sheetName, id) {
  const sheet = SpreadsheetApp.openById(SPREADSHEET_ID)
    .getSheetByName(sheetName);
  const allData = sheet.getDataRange().getValues();
  
  for (let i = 1; i < allData.length; i++) {
    if (allData[i][0] === id) {
      sheet.deleteRow(i + 1);
      return { success: true, message: "Deleted successfully" };
    }
  }
  return { success: false, message: "Record not found" };
}

// Get rows by date
function getByDate(sheetName, date) {
  const sheet = SpreadsheetApp.openById(SPREADSHEET_ID)
    .getSheetByName(sheetName);
  const data = sheet.getDataRange().getValues();
  const headers = data[0];
  const dateCol = headers.indexOf("date");
  
  const rows = data.slice(1)
    .filter(row => row[dateCol] === date)
    .map(row => {
      const obj = {};
      headers.forEach((header, i) => obj[header] = row[i]);
      return obj;
    });
  return { success: true, data: rows };
}

// Dashboard summary
function getDashboardData() {
  const ss = SpreadsheetApp.openById(SPREADSHEET_ID);
  
  const employees = ss.getSheetByName(SHEETS.EMPLOYEES);
  const clients = ss.getSheetByName(SHEETS.CLIENTS);
  const guardDuty = ss.getSheetByName(SHEETS.GUARD_DUTY);
  const advances = ss.getSheetByName(SHEETS.ADVANCES);
  const invoices = ss.getSheetByName(SHEETS.INVOICES);
  
  const today = new Date().toISOString().split('T')[0];
  
  return {
    success: true,
    data: {
      totalEmployees: Math.max(0, employees.getLastRow() - 1),
      totalClients: Math.max(0, clients.getLastRow() - 1),
      guardsToday: 0, // will calculate from guard duty
      vesselOrdersThisMonth: 0,
      pendingAdvances: 0,
      monthRevenue: 0
    }
  };
}
```

### STEP 9: Google Sheet Template

Create instructions for setting up the Google Sheet with these tabs/sheets:

**Sheet 1: Employees**
Headers: id | name | phone | nid | role | salary | dailyRate | paymentMethod | accountNumber | photo | status | createdAt

**Sheet 2: Clients**  
Headers: id | name | contactPerson | phone | serviceType | guardRate | vesselRate | laborRate | paymentTerms | status | createdAt

**Sheet 3: GuardDuty**
Headers: id | date | clientId | clientName | employeeId | employeeName | shift | status | notes | createdAt

**Sheet 4: VesselOrders**
Headers: id | clientId | clientName | vesselName | cargoType | startDate | endDate | conveyance | totalAmount | status | createdAt

**Sheet 5: VesselPersonnel**
Headers: id | orderId | employeeId | employeeName | role | startDate | endDate | days | rate | amount

**Sheet 6: DayLabor**
Headers: id | date | clientId | clientName | workType | supervisor | totalWorkers | totalPresent | totalPay | createdAt

**Sheet 7: DayLaborWorkers**
Headers: id | dayLaborId | name | phone | present | rate | pay

**Sheet 8: Advances**
Headers: id | employeeId | employeeName | amount | date | reason | approvedBy | status | createdAt

**Sheet 9: Salary**
Headers: id | employeeId | employeeName | month | year | daysWorked | grossSalary | advances | netPay | status | paidDate

**Sheet 10: Invoices**
Headers: id | clientId | clientName | periodFrom | periodTo | serviceType | subtotal | discount | total | status | createdAt

**Sheet 11: Users**
Headers: username | pin | role | name | status

### STEP 10: Create base HTML template

Every page (except index.html) should follow this template:

```html
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>PAGE_TITLE - Al Aksha Security</title>
  <script src="https://cdn.tailwindcss.com"></script>
  <link rel="stylesheet" href="css/style.css">
</head>
<body class="bg-gray-100 min-h-screen">
  
  <!-- Navbar (loaded dynamically) -->
  <div id="navbar"></div>
  
  <div class="flex">
    <!-- Sidebar (loaded dynamically) -->
    <div id="sidebar"></div>
    
    <!-- Main Content -->
    <main class="flex-1 p-4 md:p-6 md:ml-64">
      <h1 class="text-2xl font-bold text-gray-800 mb-6">
        PAGE_TITLE
      </h1>
      
      <!-- Page content goes here -->
      
    </main>
  </div>

  <!-- Toast notification container -->
  <div id="toast-container" class="fixed top-4 right-4 z-50"></div>
  
  <!-- Loading overlay -->
  <div id="loading" class="hidden fixed inset-0 bg-black 
    bg-opacity-50 flex items-center justify-center z-50">
    <div class="bg-white p-4 rounded-lg">
      <p>Loading...</p>
    </div>
  </div>

  <!-- Scripts -->
  <script src="js/config.js"></script>
  <script src="js/utils.js"></script>
  <script src="js/auth.js"></script>
  <script src="js/api.js"></script>
  <script src="js/PAGE_SCRIPT.js"></script>
  
  <script>
    // Check authentication on page load
    checkAuth();
    // Load reusable components
    loadComponent('navbar', 'components/navbar.html');
    loadComponent('sidebar', 'components/sidebar.html');
  </script>
</body>
</html>
```

### IMPORTANT RULES:
1. NO npm, NO node_modules, NO package.json
2. NO React, NO Vue, NO Angular, NO frameworks
3. Tailwind CSS via CDN only (<script src="https://cdn.tailwindcss.com"></script>)
4. ALL JavaScript is vanilla JS (plain JavaScript)
5. ALL files are static HTML/CSS/JS
6. App must work when files are uploaded to any web hosting via FTP
7. Mobile-first design (works on phone screens)
8. Use localStorage as fallback when Google Sheets API is not connected
9. Keep code simple and readable
10. Add comments explaining what each function does

### GENERATE ALL FILES NOW
Please create all the files listed in the folder structure above with complete, working code. Start with:
1. index.html (login page)
2. js/config.js
3. js/auth.js  
4. js/utils.js
5. js/api.js
6. components/navbar.html
7. components/sidebar.html
8. dashboard.html + js/dashboard.js
9. css/style.css
10. google-apps-script/Code.gs

