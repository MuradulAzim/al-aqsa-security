/**
 * Utility functions for Al Aksha Security Management System
 * Contains helper functions for dates, formatting, UI, etc.
 */

/**
 * Safely converts a date input to a Date object (locale-independent).
 * Explicitly parses YYYY-MM-DD and ISO datetime formats.
 * @param {Date|string|null|undefined} input - Date object or string
 * @returns {Date} - Valid Date object (defaults to current date on invalid input)
 */
function toDateObject(input) {
  // Already a valid Date object
  if (input instanceof Date && !isNaN(input.getTime())) {
    return input;
  }
  
  // Handle null/undefined/empty
  if (!input) {
    return new Date();
  }
  
  // Convert to string and trim
  const str = String(input).trim();
  if (!str) {
    return new Date();
  }
  
  // Try YYYY-MM-DD format (most common from backend)
  const isoDateMatch = str.match(/^(\d{4})-(\d{2})-(\d{2})$/);
  if (isoDateMatch) {
    const [, year, month, day] = isoDateMatch;
    return new Date(parseInt(year), parseInt(month) - 1, parseInt(day));
  }
  
  // Try ISO datetime format (YYYY-MM-DDTHH:MM:SS)
  const isoDateTimeMatch = str.match(/^(\d{4})-(\d{2})-(\d{2})T(\d{2}):(\d{2}):(\d{2})/);
  if (isoDateTimeMatch) {
    const [, year, month, day, hour, min, sec] = isoDateTimeMatch;
    return new Date(parseInt(year), parseInt(month) - 1, parseInt(day), parseInt(hour), parseInt(min), parseInt(sec));
  }
  
  // Try DD/MM/YYYY format (display format used in this system)
  const ddmmyyyyMatch = str.match(/^(\d{2})\/(\d{2})\/(\d{4})$/);
  if (ddmmyyyyMatch) {
    const [, day, month, year] = ddmmyyyyMatch;
    return new Date(parseInt(year), parseInt(month) - 1, parseInt(day));
  }
  
  // Fallback: return current date (safer than locale-sensitive parsing)
  console.warn('toDateObject: Unrecognized date format, using current date:', input);
  return new Date();
}

/**
 * Formats a date to DD/MM/YYYY format
 * @param {Date|string} date - Date to format
 * @returns {string} - Formatted date string
 */
function formatDate(date) {
  const d = toDateObject(date);
  const day = String(d.getDate()).padStart(2, '0');
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const year = d.getFullYear();
  return `${day}/${month}/${year}`;
}

/**
 * Formats a date to YYYY-MM-DD format (for inputs)
 * @param {Date|string} date - Date to format
 * @returns {string} - Formatted date string
 */
function formatDateISO(date) {
  const d = toDateObject(date);
  const day = String(d.getDate()).padStart(2, '0');
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const year = d.getFullYear();
  return `${year}-${month}-${day}`;
}

/**
 * Formats a date to DD/MM/YYYY hh:mm AM/PM format
 * @param {Date|string} date - Date to format
 * @returns {string} - Formatted date/time string
 */
function formatDateTime(date) {
  const d = toDateObject(date);
  const dateStr = formatDate(d);
  let hours = d.getHours();
  const minutes = String(d.getMinutes()).padStart(2, '0');
  const ampm = hours >= 12 ? 'PM' : 'AM';
  hours = hours % 12;
  hours = hours ? hours : 12;
  return `${dateStr} ${hours}:${minutes} ${ampm}`;
}

/**
 * Formats a number as currency with Bangladeshi Taka symbol
 * @param {number} number - Number to format
 * @returns {string} - Formatted currency string
 */
function formatCurrency(number) {
  const num = Number(number) || 0;
  return `${CONFIG.CURRENCY} ${num.toLocaleString('en-IN')}`;
}

/**
 * Generates a unique ID with a prefix
 * @param {string} prefix - Prefix for the ID (e.g., 'EMP', 'CLT')
 * @returns {string} - Generated ID
 */
function generateId(prefix = 'ID') {
  const timestamp = Date.now();
  const random = Math.floor(Math.random() * 1000);
  return `${prefix}-${timestamp}-${random}`;
}

/**
 * Shows a toast notification
 * @param {string} message - Message to display
 * @param {string} type - Type of toast: 'success', 'error', 'warning', 'info'
 * @param {number} duration - Duration in milliseconds (default: 3000)
 */
function showToast(message, type = 'info', duration = 3000) {
  const container = document.getElementById('toast-container');
  if (!container) return;
  
  // Create toast element
  const toast = document.createElement('div');
  toast.className = `toast-notification p-4 rounded-lg shadow-lg mb-2 text-white transform transition-all duration-300 translate-x-full`;
  
  // Set background color based on type
  const colors = {
    success: 'bg-green-500',
    error: 'bg-red-500',
    warning: 'bg-yellow-500',
    info: 'bg-blue-500'
  };
  toast.classList.add(colors[type] || colors.info);
  
  // Set content
  toast.innerHTML = `
    <div class="flex items-center gap-2">
      <span>${getToastIcon(type)}</span>
      <span>${message}</span>
    </div>
  `;
  
  // Add to container
  container.appendChild(toast);
  
  // Animate in
  setTimeout(() => {
    toast.classList.remove('translate-x-full');
    toast.classList.add('translate-x-0');
  }, 10);
  
  // Remove after duration
  setTimeout(() => {
    toast.classList.remove('translate-x-0');
    toast.classList.add('translate-x-full');
    setTimeout(() => toast.remove(), 300);
  }, duration);
}

/**
 * Gets the icon for a toast type
 * @param {string} type - Toast type
 * @returns {string} - Emoji icon
 */
function getToastIcon(type) {
  const icons = {
    success: '✓',
    error: '✕',
    warning: '⚠',
    info: 'ℹ'
  };
  return icons[type] || icons.info;
}

/**
 * Shows the loading overlay
 */
function showLoading() {
  const loading = document.getElementById('loading');
  if (loading) {
    loading.classList.remove('hidden');
  }
}

/**
 * Hides the loading overlay
 */
function hideLoading() {
  const loading = document.getElementById('loading');
  if (loading) {
    loading.classList.add('hidden');
  }
}

/**
 * Shows a confirmation dialog
 * @param {string} message - Message to display
 * @returns {Promise<boolean>} - True if confirmed, false otherwise
 */
function confirmDelete(message = 'Are you sure you want to delete this item?') {
  return confirm(message);
}

/**
 * Loads an HTML component into an element
 * @param {string} elementId - ID of the element to load into
 * @param {string} filePath - Path to the HTML file
 */
async function loadComponent(elementId, filePath) {
  const element = document.getElementById(elementId);
  if (!element) return;
  
  try {
    const response = await fetch(filePath);
    if (response.ok) {
      const html = await response.text();
      element.innerHTML = html;
      
      // Execute any scripts in the loaded component
      const scripts = element.querySelectorAll('script');
      scripts.forEach(script => {
        const newScript = document.createElement('script');
        if (script.src) {
          newScript.src = script.src;
        } else {
          newScript.textContent = script.textContent;
        }
        document.body.appendChild(newScript);
      });
    }
  } catch (error) {
    console.error(`Error loading component ${filePath}:`, error);
  }
}

/**
 * Creates a debounced version of a function
 * @param {Function} func - Function to debounce
 * @param {number} delay - Delay in milliseconds
 * @returns {Function} - Debounced function
 */
function debounce(func, delay = 300) {
  let timeoutId;
  return function (...args) {
    clearTimeout(timeoutId);
    timeoutId = setTimeout(() => func.apply(this, args), delay);
  };
}

/**
 * Validates a Bangladesh phone number
 * @param {string} phone - Phone number to validate
 * @returns {boolean} - True if valid
 */
function validatePhone(phone) {
  // Bangladesh phone: starts with 01, followed by 9 digits
  const pattern = /^01[3-9]\d{8}$/;
  return pattern.test(phone.replace(/[-\s]/g, ''));
}

/**
 * Gets month name from month number (1-12)
 * @param {number} monthNumber - Month number (1-12)
 * @returns {string} - Month name
 */
function getMonthName(monthNumber) {
  const months = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December'
  ];
  return months[monthNumber - 1] || '';
}

/**
 * Gets the number of days in a specific month
 * @param {number} year - Year
 * @param {number} month - Month (1-12)
 * @returns {number} - Number of days
 */
function getDaysInMonth(year, month) {
  return new Date(year, month, 0).getDate();
}

/**
 * Gets today's date in YYYY-MM-DD format
 * @returns {string}
 */
function getToday() {
  return formatDateISO(new Date());
}

/**
 * Gets current month and year
 * @returns {object} - { month: number, year: number }
 */
function getCurrentMonthYear() {
  const now = new Date();
  return {
    month: now.getMonth() + 1,
    year: now.getFullYear()
  };
}

/**
 * Parses a date string to Date object (locale-independent)
 * @param {string} dateStr - Date string in various formats
 * @returns {Date}
 */
function parseDate(dateStr) {
  return toDateObject(dateStr);
}

/**
 * Escapes HTML to prevent XSS
 * @param {string} str - String to escape
 * @returns {string} - Escaped string
 */
function escapeHtml(str) {
  const div = document.createElement('div');
  div.textContent = str;
  return div.innerHTML;
}

/**
 * Truncates text to a specified length
 * @param {string} text - Text to truncate
 * @param {number} length - Maximum length
 * @returns {string} - Truncated text
 */
function truncateText(text, length = 50) {
  if (!text || text.length <= length) return text;
  return text.substring(0, length) + '...';
}

/**
 * Capitalizes the first letter of a string
 * @param {string} str - String to capitalize
 * @returns {string}
 */
function capitalize(str) {
  if (!str) return '';
  return str.charAt(0).toUpperCase() + str.slice(1);
}

/**
 * Formats a status with appropriate color class
 * @param {string} status - Status string
 * @returns {object} - { text: string, class: string }
 */
function formatStatus(status) {
  const statusMap = {
    active: { text: 'Active', class: 'bg-green-100 text-green-800' },
    inactive: { text: 'Inactive', class: 'bg-gray-100 text-gray-800' },
    pending: { text: 'Pending', class: 'bg-yellow-100 text-yellow-800' },
    approved: { text: 'Approved', class: 'bg-green-100 text-green-800' },
    rejected: { text: 'Rejected', class: 'bg-red-100 text-red-800' },
    paid: { text: 'Paid', class: 'bg-green-100 text-green-800' },
    unpaid: { text: 'Unpaid', class: 'bg-red-100 text-red-800' },
    present: { text: 'Present', class: 'bg-green-100 text-green-800' },
    absent: { text: 'Absent', class: 'bg-red-100 text-red-800' }
  };
  
  return statusMap[status?.toLowerCase()] || { text: status, class: 'bg-gray-100 text-gray-800' };
}

/**
 * Gets data from localStorage
 * @param {string} key - Storage key
 * @param {any} defaultValue - Default value if not found
 * @returns {any}
 */
function getFromStorage(key, defaultValue = []) {
  try {
    const data = localStorage.getItem(key);
    return data ? JSON.parse(data) : defaultValue;
  } catch (e) {
    console.error('Error reading from storage:', e);
    return defaultValue;
  }
}

/**
 * Saves data to localStorage
 * @param {string} key - Storage key
 * @param {any} data - Data to save
 */
function saveToStorage(key, data) {
  try {
    localStorage.setItem(key, JSON.stringify(data));
  } catch (e) {
    console.error('Error writing to storage:', e);
  }
}

/**
 * Opens a modal by ID
 * @param {string} modalId - ID of the modal element
 */
function openModal(modalId) {
  const modal = document.getElementById(modalId);
  if (modal) {
    modal.classList.remove('hidden');
    document.body.classList.add('overflow-hidden');
  }
}

/**
 * Closes a modal by ID
 * @param {string} modalId - ID of the modal element
 */
function closeModal(modalId) {
  const modal = document.getElementById(modalId);
  if (modal) {
    modal.classList.add('hidden');
    document.body.classList.remove('overflow-hidden');
  }
}

/**
 * Clears form inputs
 * @param {string} formId - ID of the form element
 */
function clearForm(formId) {
  const form = document.getElementById(formId);
  if (form) {
    form.reset();
  }
}
