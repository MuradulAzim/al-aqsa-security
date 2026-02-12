/**
 * API module for Al Aksha Security Management System
 * Handles all data operations with Google Sheets and localStorage fallback
 */

const API = {
  /**
   * GET request for read operations
   * @param {string} action - The action to perform
   * @param {object} params - Query parameters
   * @returns {Promise<object>} - Response from the API
   */
  async get(action, params = {}) {
    // If API_URL is empty, use local storage as fallback
    if (!CONFIG.API_URL) {
      return this.localFallback(action, params);
    }
    
    try {
      showLoading();
      const queryParams = new URLSearchParams({ action, ...params });
      const response = await fetch(`${CONFIG.API_URL}?${queryParams}`, {
        method: "GET"
      });
      const result = await response.json();
      hideLoading();
      return result;
    } catch (error) {
      console.error("API GET Error:", error);
      hideLoading();
      // Fallback to localStorage if API fails
      return this.localFallback(action, params);
    }
  },

  /**
   * POST request for write operations (add, update, delete)
   * @param {string} action - The action to perform
   * @param {object} data - Data to send with the request
   * @returns {Promise<object>} - Response from the API
   */
  async call(action, data = {}) {
    // If API_URL is empty, use local storage as fallback
    if (!CONFIG.API_URL) {
      return this.localFallback(action, data);
    }
    
    try {
      showLoading();
      const response = await fetch(CONFIG.API_URL, {
        method: "POST",
        body: JSON.stringify({ action, data }),
        headers: { "Content-Type": "text/plain" }
      });
      const result = await response.json();
      hideLoading();
      return result;
    } catch (error) {
      console.error("API POST Error:", error);
      hideLoading();
      // Fallback to localStorage if API fails
      return this.localFallback(action, data);
    }
  },

  /**
   * LocalStorage fallback for when API is not available
   * Implements basic CRUD operations using localStorage
   * @param {string} action - The action to perform
   * @param {object} data - Data for the operation
   * @returns {object} - Result object
   */
  localFallback(action, data) {
    try {
      switch (action) {
        // Employee operations
        case "getEmployees":
          return { success: true, data: getFromStorage(CONFIG.STORAGE_KEYS.EMPLOYEES, []) };
        case "addEmployee":
          return this.localAdd(CONFIG.STORAGE_KEYS.EMPLOYEES, data);
        case "updateEmployee":
          return this.localUpdate(CONFIG.STORAGE_KEYS.EMPLOYEES, data);
        case "deleteEmployee":
          return this.localDelete(CONFIG.STORAGE_KEYS.EMPLOYEES, data.id);
        
        // Client operations
        case "getClients":
          return { success: true, data: getFromStorage(CONFIG.STORAGE_KEYS.CLIENTS, []) };
        case "addClient":
          return this.localAdd(CONFIG.STORAGE_KEYS.CLIENTS, data);
        case "updateClient":
          return this.localUpdate(CONFIG.STORAGE_KEYS.CLIENTS, data);
        case "deleteClient":
          return this.localDelete(CONFIG.STORAGE_KEYS.CLIENTS, data.id);
        
        // Guard Duty operations
        case "getGuardDuty":
          return this.localGetByDate(CONFIG.STORAGE_KEYS.GUARD_DUTY, data.date);
        case "getAllGuardDuty":
          return { success: true, data: getFromStorage(CONFIG.STORAGE_KEYS.GUARD_DUTY, []) };
        case "addGuardDuty":
          return this.localAdd(CONFIG.STORAGE_KEYS.GUARD_DUTY, data);
        case "updateGuardDuty":
          return this.localUpdate(CONFIG.STORAGE_KEYS.GUARD_DUTY, data);
        case "deleteGuardDuty":
          return this.localDelete(CONFIG.STORAGE_KEYS.GUARD_DUTY, data.id);
        
        // Vessel Order operations
        case "getVesselOrders":
          return { success: true, data: getFromStorage(CONFIG.STORAGE_KEYS.VESSEL_ORDERS, []) };
        case "addVesselOrder":
          return this.localAdd(CONFIG.STORAGE_KEYS.VESSEL_ORDERS, data);
        case "updateVesselOrder":
          return this.localUpdate(CONFIG.STORAGE_KEYS.VESSEL_ORDERS, data);
        case "deleteVesselOrder":
          return this.localDelete(CONFIG.STORAGE_KEYS.VESSEL_ORDERS, data.id);
        
        // Vessel Personnel operations
        case "getVesselPersonnel":
          return this.localGetByField(CONFIG.STORAGE_KEYS.VESSEL_PERSONNEL, 'orderId', data.orderId);
        case "addVesselPersonnel":
          return this.localAdd(CONFIG.STORAGE_KEYS.VESSEL_PERSONNEL, data);
        case "deleteVesselPersonnel":
          return this.localDelete(CONFIG.STORAGE_KEYS.VESSEL_PERSONNEL, data.id);
        
        // Day Labor operations
        case "getDayLabor":
          return this.localGetByDate(CONFIG.STORAGE_KEYS.DAY_LABOR, data.date);
        case "getAllDayLabor":
          return { success: true, data: getFromStorage(CONFIG.STORAGE_KEYS.DAY_LABOR, []) };
        case "addDayLabor":
          return this.localAdd(CONFIG.STORAGE_KEYS.DAY_LABOR, data);
        case "updateDayLabor":
          return this.localUpdate(CONFIG.STORAGE_KEYS.DAY_LABOR, data);
        case "deleteDayLabor":
          return this.localDelete(CONFIG.STORAGE_KEYS.DAY_LABOR, data.id);
        
        // Day Labor Workers
        case "getDayLaborWorkers":
          return this.localGetByField(CONFIG.STORAGE_KEYS.DAY_LABOR_WORKERS, 'dayLaborId', data.dayLaborId);
        case "addDayLaborWorker":
          return this.localAdd(CONFIG.STORAGE_KEYS.DAY_LABOR_WORKERS, data);
        case "deleteDayLaborWorker":
          return this.localDelete(CONFIG.STORAGE_KEYS.DAY_LABOR_WORKERS, data.id);
        
        // Advance operations
        case "getAdvances":
          if (data.employeeId) {
            return this.localGetByField(CONFIG.STORAGE_KEYS.ADVANCES, 'employeeId', data.employeeId);
          }
          return { success: true, data: getFromStorage(CONFIG.STORAGE_KEYS.ADVANCES, []) };
        case "addAdvance":
          return this.localAdd(CONFIG.STORAGE_KEYS.ADVANCES, data);
        case "updateAdvance":
          return this.localUpdate(CONFIG.STORAGE_KEYS.ADVANCES, data);
        case "deleteAdvance":
          return this.localDelete(CONFIG.STORAGE_KEYS.ADVANCES, data.id);
        
        // Salary operations
        case "getSalary":
          return this.localGetByMonthYear(CONFIG.STORAGE_KEYS.SALARY, data.month, data.year);
        case "getAllSalary":
          return { success: true, data: getFromStorage(CONFIG.STORAGE_KEYS.SALARY, []) };
        case "processSalary":
          return this.localAdd(CONFIG.STORAGE_KEYS.SALARY, data);
        case "updateSalary":
          return this.localUpdate(CONFIG.STORAGE_KEYS.SALARY, data);
        
        // Invoice operations
        case "getInvoices":
          return { success: true, data: getFromStorage(CONFIG.STORAGE_KEYS.INVOICES, []) };
        case "addInvoice":
          return this.localAdd(CONFIG.STORAGE_KEYS.INVOICES, data);
        case "updateInvoice":
          return this.localUpdate(CONFIG.STORAGE_KEYS.INVOICES, data);
        case "deleteInvoice":
          return this.localDelete(CONFIG.STORAGE_KEYS.INVOICES, data.id);
        
        // Dashboard
        case "getDashboardData":
          return this.localGetDashboardData();
        
        default:
          return { success: false, message: "Unknown action: " + action };
      }
    } catch (error) {
      console.error("Local fallback error:", error);
      return { success: false, message: error.message };
    }
  },

  /**
   * Adds a new item to local storage
   */
  localAdd(storageKey, data) {
    const items = getFromStorage(storageKey, []);
    const newItem = {
      ...data,
      id: data.id || generateId(storageKey.split('_').pop().substring(0, 3).toUpperCase()),
      createdAt: new Date().toISOString()
    };
    items.push(newItem);
    saveToStorage(storageKey, items);
    return { success: true, data: newItem, message: "Added successfully" };
  },

  /**
   * Updates an item in local storage
   */
  localUpdate(storageKey, data) {
    const items = getFromStorage(storageKey, []);
    const index = items.findIndex(item => item.id === data.id);
    if (index === -1) {
      return { success: false, message: "Record not found" };
    }
    items[index] = { ...items[index], ...data, updatedAt: new Date().toISOString() };
    saveToStorage(storageKey, items);
    return { success: true, data: items[index], message: "Updated successfully" };
  },

  /**
   * Deletes an item from local storage
   */
  localDelete(storageKey, id) {
    const items = getFromStorage(storageKey, []);
    const filtered = items.filter(item => item.id !== id);
    if (filtered.length === items.length) {
      return { success: false, message: "Record not found" };
    }
    saveToStorage(storageKey, filtered);
    return { success: true, message: "Deleted successfully" };
  },

  /**
   * Gets items by date
   */
  localGetByDate(storageKey, date) {
    const items = getFromStorage(storageKey, []);
    const filtered = items.filter(item => item.date === date);
    return { success: true, data: filtered };
  },

  /**
   * Gets items by a specific field value
   */
  localGetByField(storageKey, field, value) {
    const items = getFromStorage(storageKey, []);
    const filtered = items.filter(item => item[field] === value);
    return { success: true, data: filtered };
  },

  /**
   * Gets items by month and year
   */
  localGetByMonthYear(storageKey, month, year) {
    const items = getFromStorage(storageKey, []);
    const filtered = items.filter(item => 
      item.month === month && item.year === year
    );
    return { success: true, data: filtered };
  },

  /**
   * Gets dashboard summary data
   */
  localGetDashboardData() {
    const employees = getFromStorage(CONFIG.STORAGE_KEYS.EMPLOYEES, []);
    const clients = getFromStorage(CONFIG.STORAGE_KEYS.CLIENTS, []);
    const guardDuty = getFromStorage(CONFIG.STORAGE_KEYS.GUARD_DUTY, []);
    const vesselOrders = getFromStorage(CONFIG.STORAGE_KEYS.VESSEL_ORDERS, []);
    const advances = getFromStorage(CONFIG.STORAGE_KEYS.ADVANCES, []);
    const invoices = getFromStorage(CONFIG.STORAGE_KEYS.INVOICES, []);
    
    const today = getToday();
    const { month, year } = getCurrentMonthYear();
    
    // Count guards on duty today
    const guardsToday = guardDuty.filter(d => d.date === today).length;
    
    // Count vessel orders this month
    const vesselOrdersThisMonth = vesselOrders.filter(o => {
      const orderDate = new Date(o.startDate);
      return orderDate.getMonth() + 1 === month && orderDate.getFullYear() === year;
    }).length;
    
    // Count pending advances
    const pendingAdvances = advances.filter(a => a.status === 'pending').length;
    
    // Calculate this month's revenue from paid invoices
    const monthRevenue = invoices
      .filter(i => {
        const invoiceDate = new Date(i.createdAt);
        return i.status === 'paid' && 
               invoiceDate.getMonth() + 1 === month && 
               invoiceDate.getFullYear() === year;
      })
      .reduce((sum, i) => sum + (Number(i.total) || 0), 0);
    
    return {
      success: true,
      data: {
        totalEmployees: employees.filter(e => e.status === 'active').length,
        totalClients: clients.filter(c => c.status === 'active').length,
        guardsToday,
        vesselOrdersThisMonth,
        pendingAdvances,
        monthRevenue
      }
    };
  },

  // ===================
  // API Helper Methods
  // ===================

  // Employee functions (GET for read, POST for write)
  async getEmployees() { return this.get("getEmployees"); },
  async addEmployee(emp) { return this.call("addEmployee", emp); },
  async updateEmployee(emp) { return this.call("updateEmployee", emp); },
  async deleteEmployee(id) { return this.call("deleteEmployee", { id }); },

  // Client functions  
  async getClients() { return this.get("getClients"); },
  async addClient(client) { return this.call("addClient", client); },
  async updateClient(client) { return this.call("updateClient", client); },
  async deleteClient(id) { return this.call("deleteClient", { id }); },

  // Guard Duty functions
  async getGuardDuty(date) { return this.get("getGuardDuty", { date }); },
  async getAllGuardDuty() { return this.get("getGuardDuty"); },
  async addGuardDuty(duty) { return this.call("addGuardDuty", duty); },
  async updateGuardDuty(duty) { return this.call("updateGuardDuty", duty); },
  async deleteGuardDuty(id) { return this.call("deleteGuardDuty", { id }); },

  // Vessel Order functions
  async getVesselOrders() { return this.get("getVesselOrders"); },
  async addVesselOrder(order) { return this.call("addVesselOrder", order); },
  async updateVesselOrder(order) { return this.call("updateVesselOrder", order); },
  async deleteVesselOrder(id) { return this.call("deleteVesselOrder", { id }); },
  
  // Vessel Personnel functions
  async getVesselPersonnel(orderId) { return this.get("getVesselPersonnel", { orderId }); },
  async addVesselPersonnel(personnel) { return this.call("addVesselPersonnel", personnel); },
  async deleteVesselPersonnel(id) { return this.call("deleteVesselPersonnel", { id }); },

  // Day Labor functions
  async getDayLabor(date) { return this.get("getDayLabor", { date }); },
  async getAllDayLabor() { return this.get("getDayLabor"); },
  async addDayLabor(labor) { return this.call("addDayLabor", labor); },
  async updateDayLabor(labor) { return this.call("updateDayLabor", labor); },
  async deleteDayLabor(id) { return this.call("deleteDayLabor", { id }); },
  
  // Day Labor Workers
  async getDayLaborWorkers(dayLaborId) { return this.get("getDayLaborWorkers", { dayLaborId }); },
  async addDayLaborWorker(worker) { return this.call("addDayLaborWorker", worker); },
  async deleteDayLaborWorker(id) { return this.call("deleteDayLaborWorker", { id }); },

  // Advance functions
  async getAdvances(employeeId = null) { return this.get("getAdvances", employeeId ? { employeeId } : {}); },
  async addAdvance(advance) { return this.call("addAdvance", advance); },
  async updateAdvance(advance) { return this.call("updateAdvance", advance); },
  async deleteAdvance(id) { return this.call("deleteAdvance", { id }); },

  // Salary functions
  async getSalary(month, year) { return this.get("getSalary", { month, year }); },
  async getAllSalary() { return this.get("getSalary"); },
  async processSalary(salary) { return this.call("processSalary", salary); },
  async updateSalary(salary) { return this.call("updateSalary", salary); },

  // Invoice functions
  async getInvoices() { return this.get("getInvoices"); },
  async addInvoice(invoice) { return this.call("addInvoice", invoice); },
  async updateInvoice(invoice) { return this.call("updateInvoice", invoice); },
  async deleteInvoice(id) { return this.call("deleteInvoice", { id }); },

  // Dashboard
  async getDashboardData() { return this.get("getDashboardStats"); }
};
