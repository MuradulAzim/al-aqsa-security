/**
 * Dashboard logic for Al Aksha Security Management System
 * Handles dashboard data loading and display
 */

/**
 * Initializes the dashboard page
 */
async function initDashboard() {
  // Set user info
  const user = getCurrentUser();
  if (user) {
    document.getElementById('user-name').textContent = user.name;
    document.getElementById('user-role').textContent = user.role;
  }
  
  // Set today's date info
  setTodayInfo();
  
  // Set system info
  setSystemInfo();
  
  // Hide quick actions for employees
  if (getRole() === CONFIG.ROLES.EMPLOYEE) {
    document.getElementById('quick-actions').style.display = 'none';
  }
  
  // Load dashboard data
  await loadDashboardData();
}

/**
 * Sets today's date information
 */
function setTodayInfo() {
  const today = new Date();
  const days = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
  
  document.getElementById('today-date').textContent = formatDate(today);
  document.getElementById('today-day').textContent = days[today.getDay()];
}

/**
 * Sets system information
 */
function setSystemInfo() {
  // App version
  document.getElementById('app-version').textContent = CONFIG.APP_VERSION;
  
  // Data storage type
  const storageType = CONFIG.API_URL ? 'Google Sheets' : 'Local Storage';
  document.getElementById('data-storage').textContent = storageType;
  
  // Session expiry
  const session = getCurrentUser();
  if (session && session.loginTime) {
    const loginTime = new Date(session.loginTime);
    const expiryTime = new Date(loginTime.getTime() + CONFIG.SESSION_DURATION);
    document.getElementById('session-expires').textContent = formatDateTime(expiryTime);
  }
}

/**
 * Loads and displays dashboard data
 */
async function loadDashboardData() {
  try {
    showLoading();
    
    const result = await API.getDashboardData();
    
    if (result.success) {
      const data = result.data;
      
      // Update stat cards with animation
      // Backend returns: activeEmployees, activeClients, presentGuards, todayDayLabor, monthlyRevenue, totalAdvances
      animateNumber('stat-employees', data.activeEmployees || 0);
      animateNumber('stat-clients', data.activeClients || 0);
      animateNumber('stat-guards', data.presentGuards || 0);
      animateNumber('stat-vessels', data.todayDayLabor || 0);
      animateNumber('stat-advances', data.totalAdvances || 0);
      
      // Format revenue with currency
      const revenue = data.monthlyRevenue || 0;
      document.getElementById('stat-revenue').textContent = formatCurrency(revenue);
    } else {
      showToast('Failed to load dashboard data', 'error');
    }
    
    hideLoading();
  } catch (error) {
    console.error('Error loading dashboard:', error);
    hideLoading();
    showToast('Error loading dashboard data', 'error');
  }
}

/**
 * Animates a number from 0 to target value
 * @param {string} elementId - ID of the element to animate
 * @param {number} targetValue - Target number to animate to
 */
function animateNumber(elementId, targetValue) {
  const element = document.getElementById(elementId);
  if (!element) return;
  
  const duration = 500; // milliseconds
  const startValue = 0;
  const startTime = Date.now();
  
  function update() {
    const elapsed = Date.now() - startTime;
    const progress = Math.min(elapsed / duration, 1);
    
    // Ease out calculation
    const easeOut = 1 - Math.pow(1 - progress, 3);
    const currentValue = Math.round(startValue + (targetValue - startValue) * easeOut);
    
    element.textContent = currentValue;
    
    if (progress < 1) {
      requestAnimationFrame(update);
    }
  }
  
  requestAnimationFrame(update);
}

/**
 * Refreshes dashboard data
 */
async function refreshDashboard() {
  await loadDashboardData();
  showToast('Dashboard refreshed', 'success');
}
