/**
 * Configuration file for Al Aksha Security Management System
 * Contains global settings and constants
 */

const CONFIG = {
  APP_NAME: "Al Aksha Security Management System",
  APP_VERSION: "1.1.0",
  
  // Google Sheets API URL (will be filled after Apps Script deployment)
  API_URL: "https://script.google.com/macros/s/AKfycbyeO26S4ATkaLjWwSq7CD_ZCHfbKd23ZgQHxmTpBMGPeNEfDVhdvL3GZsbjBiMCyAYt/exec", // Leave empty for now - will use localStorage fallback
  
  // Session settings
  SESSION_KEY: "al_aksha_session",
  SESSION_DURATION: 8 * 60 * 60 * 1000, // 8 hours in milliseconds
  
  // Local storage keys for data
  STORAGE_KEYS: {
    EMPLOYEES: "al_aksha_employees",
    CLIENTS: "al_aksha_clients",
    GUARD_DUTY: "al_aksha_guard_duty",
    VESSEL_ORDERS: "al_aksha_vessel_orders",
    VESSEL_PERSONNEL: "al_aksha_vessel_personnel",
    DAY_LABOR: "al_aksha_day_labor",
    DAY_LABOR_WORKERS: "al_aksha_day_labor_workers",
    ADVANCES: "al_aksha_advances",
    SALARY: "al_aksha_salary",
    INVOICES: "al_aksha_invoices"
  },
  
  // Date format
  DATE_FORMAT: "YYYY-MM-DD",
  CURRENCY: "৳", // Bangladeshi Taka
  
  // Company info (for invoices)
  COMPANY: {
    name: "Al Aksha Security Services",
    address: "Chattogram, Bangladesh",
    phone: "+880-1958-122300",
    email: "admin@al-aqsasecurity.com"
  },

  // Roles
  ROLES: {
    ADMIN: "admin",
    SUPERVISOR: "supervisor",
    EMPLOYEE: "employee"
  },

  // Service types
  SERVICE_TYPES: {
    GUARD: "guard",
    VESSEL: "vessel",
    DAY_LABOR: "day_labor"
  },

  // Status options
  STATUS: {
    ACTIVE: "active",
    INACTIVE: "inactive",
    PENDING: "pending",
    APPROVED: "approved",
    REJECTED: "rejected",
    PAID: "paid",
    UNPAID: "unpaid"
  },

  // Shift options for guard duty
  SHIFTS: {
    DAY: "day",
    NIGHT: "night",
    FULL: "full"
  }
};

// Freeze config to prevent modifications
Object.freeze(CONFIG);
Object.freeze(CONFIG.COMPANY);
Object.freeze(CONFIG.ROLES);
Object.freeze(CONFIG.STORAGE_KEYS);
Object.freeze(CONFIG.SERVICE_TYPES);
Object.freeze(CONFIG.STATUS);
Object.freeze(CONFIG.SHIFTS);
