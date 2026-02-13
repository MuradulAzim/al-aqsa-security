/**
 * Authentication module for Al Aksha Security Management System
 * Handles login, logout, and session management
 */

// Hardcoded users (will move to Google Sheets later)
const USERS = [
  { username: "admin", pin: "1234", role: "admin", name: "Admin User" },
  { username: "supervisor", pin: "5678", role: "supervisor", name: "Supervisor" },
  { username: "employee", pin: "0000", role: "employee", name: "Test Employee" }
];

/**
 * Validates username and PIN, creates session if valid
 * @param {string} username - The username to validate
 * @param {string} pin - The PIN to validate
 * @returns {object} - { success: boolean, message: string, user?: object }
 */
function login(username, pin) {
  // Find user with matching credentials
  const user = USERS.find(u => 
    u.username.toLowerCase() === username.toLowerCase() && 
    u.pin === pin
  );
  
  if (!user) {
    return { success: false, message: "Invalid username or PIN" };
  }
  
  // Create session object
  const session = {
    username: user.username,
    name: user.name,
    role: user.role,
    loginTime: new Date().toISOString()
  };
  
  // Store session in localStorage
  localStorage.setItem(CONFIG.SESSION_KEY, JSON.stringify(session));
  
  return { 
    success: true, 
    message: "Login successful", 
    user: session 
  };
}

/**
 * Clears session and redirects to login page
 */
function logout() {
  localStorage.removeItem(CONFIG.SESSION_KEY);
  window.location.href = "index.html";
}

/**
 * Checks if a valid session exists
 * @returns {boolean} - True if user is logged in with valid session
 */
function isLoggedIn() {
  const session = getSession();
  
  if (!session) {
    return false;
  }
  
  // Check if session has expired
  const loginTime = parseDate(session.loginTime);
  const now = new Date();
  const elapsed = now - loginTime;
  
  if (elapsed > CONFIG.SESSION_DURATION) {
    // Session expired, clear it
    localStorage.removeItem(CONFIG.SESSION_KEY);
    return false;
  }
  
  return true;
}

/**
 * Gets the current session from localStorage
 * @returns {object|null} - Session object or null
 */
function getSession() {
  const sessionStr = localStorage.getItem(CONFIG.SESSION_KEY);
  
  if (!sessionStr) {
    return null;
  }
  
  try {
    return JSON.parse(sessionStr);
  } catch (e) {
    return null;
  }
}

/**
 * Gets the current logged-in user
 * @returns {object|null} - User object or null
 */
function getCurrentUser() {
  return getSession();
}

/**
 * Checks authentication on page load, redirects to login if not authenticated
 * Call this function at the start of every protected page
 */
function checkAuth() {
  if (!isLoggedIn()) {
    window.location.href = "index.html";
    return false;
  }
  return true;
}

/**
 * Gets the current user's role
 * @returns {string|null} - Role string or null
 */
function getRole() {
  const session = getSession();
  return session ? session.role : null;
}

/**
 * Checks if current user has admin role
 * @returns {boolean}
 */
function isAdmin() {
  return getRole() === CONFIG.ROLES.ADMIN;
}

/**
 * Checks if current user has supervisor role
 * @returns {boolean}
 */
function isSupervisor() {
  return getRole() === CONFIG.ROLES.SUPERVISOR;
}

/**
 * Checks if current user has at least supervisor privileges
 * @returns {boolean}
 */
function hasAdminAccess() {
  const role = getRole();
  return role === CONFIG.ROLES.ADMIN || role === CONFIG.ROLES.SUPERVISOR;
}

/**
 * Checks if user can access a specific page based on role
 * @param {string} page - The page name to check access for
 * @returns {boolean}
 */
function canAccessPage(page) {
  const role = getRole();
  
  // Admin can access everything
  if (role === CONFIG.ROLES.ADMIN) {
    return true;
  }
  
  // Supervisor access
  if (role === CONFIG.ROLES.SUPERVISOR) {
    const supervisorPages = [
      'dashboard', 'guard-duty', 'vessel-orders', 
      'day-labor', 'employees'
    ];
    return supervisorPages.includes(page);
  }
  
  // Employee can only access dashboard
  if (role === CONFIG.ROLES.EMPLOYEE) {
    return page === 'dashboard';
  }
  
  return false;
}
