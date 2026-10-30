// frontend/js/api.js

const API_BASE_URL = window.location.origin.includes('localhost') || window.location.origin.includes('127.0.0.1')
  ? `${window.location.origin}/api`
  : 'http://localhost:5000/api';

async function apiRequest(endpoint, method = 'GET', data = null, isMultipart = false) {
  const headers = {};
  const token = localStorage.getItem('token');
  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  const options = { method, headers };

  if (data) {
    if (isMultipart) {
      options.body = data; // FormData instance
    } else {
      headers['Content-Type'] = 'application/json';
      options.body = JSON.stringify(data);
    }
  }

  const res = await fetch(`${API_BASE_URL}${endpoint}`, options);
  let result;
  try {
    result = await res.json();
  } catch (err) {
    result = { success: false, message: res.statusText };
  }

  if (!res.ok) {
    throw new Error(result.message || `Request failed with status ${res.status}`);
  }
  return result;
}

const api = {
  request: apiRequest,

  auth: {
    loginStudent: (data) => apiRequest('/auth/student/login', 'POST', data),
    registerStudent: (data) => apiRequest('/auth/student/register', 'POST', data),
    loginHost: (data) => apiRequest('/auth/host/login', 'POST', data),
    registerHost: (data) => apiRequest('/auth/host/register', 'POST', data),
    loginAdmin: (data) => apiRequest('/auth/admin/login', 'POST', data),
    getMe: () => apiRequest('/auth/me', 'GET'),
  },

  public: {
    getEvents: (params = '') => apiRequest(`/public/events${params ? '?' + params : ''}`, 'GET'),
    getEvent: (id) => apiRequest(`/public/events/${id}`, 'GET'),
    getDepartments: () => apiRequest('/public/departments', 'GET'),
    getClubs: () => apiRequest('/public/clubs', 'GET'),
    getCategories: () => apiRequest('/public/categories', 'GET'),
    getStats: () => apiRequest('/public/stats', 'GET'),
  },

  admin: {
    getDashboard: () => apiRequest('/admin/dashboard', 'GET'),
    getAnalytics: () => apiRequest('/admin/analytics', 'GET'),
    getStudents: (params = '') => apiRequest(`/admin/students${params ? '?' + params : ''}`, 'GET'),
    getStudent: (id) => apiRequest(`/admin/students/${id}`, 'GET'),
    updateStudentStatus: (id, data) => apiRequest(`/admin/students/${id}/status`, 'PATCH', data),
    getHosts: (params = '') => apiRequest(`/admin/hosts${params ? '?' + params : ''}`, 'GET'),
    getHost: (id) => apiRequest(`/admin/hosts/${id}`, 'GET'),
    updateHostStatus: (id, data) => apiRequest(`/admin/hosts/${id}/status`, 'PATCH', data),
    getEvents: (params = '') => apiRequest(`/admin/events${params ? '?' + params : ''}`, 'GET'),
    getEvent: (id) => apiRequest(`/admin/events/${id}`, 'GET'),
    createEvent: (data, isMultipart) => apiRequest('/admin/events', 'POST', data, isMultipart),
    updateEvent: (id, data, isMultipart) => apiRequest(`/admin/events/${id}`, 'PUT', data, isMultipart),
    deleteEvent: (id) => apiRequest(`/admin/events/${id}`, 'DELETE'),
    updateEventStatus: (id, data) => apiRequest(`/admin/events/${id}/status`, 'PATCH', data),
    getDepartments: () => apiRequest('/admin/departments', 'GET'),
    createDepartment: (data) => apiRequest('/admin/departments', 'POST', data),
    updateDepartment: (id, data) => apiRequest(`/admin/departments/${id}`, 'PUT', data),
    deleteDepartment: (id) => apiRequest(`/admin/departments/${id}`, 'DELETE'),
    getClubs: () => apiRequest('/admin/clubs', 'GET'),
    createClub: (data) => apiRequest('/admin/clubs', 'POST', data),
    updateClub: (id, data) => apiRequest(`/admin/clubs/${id}`, 'PUT', data),
    deleteClub: (id) => apiRequest(`/admin/clubs/${id}`, 'DELETE'),
    getCategories: () => apiRequest('/admin/categories', 'GET'),
    createCategory: (data) => apiRequest('/admin/categories', 'POST', data),
    updateCategory: (id, data) => apiRequest(`/admin/categories/${id}`, 'PUT', data),
    deleteCategory: (id) => apiRequest(`/admin/categories/${id}`, 'DELETE'),
    getRegistrations: () => apiRequest('/admin/registrations', 'GET'),
  },

  host: {
    getDashboard: () => apiRequest('/host/dashboard', 'GET'),
    getAnalytics: () => apiRequest('/host/analytics', 'GET'),
    getEvents: () => apiRequest('/host/events', 'GET'),
    getEvent: (id) => apiRequest(`/public/events/${id}`, 'GET'),
    createEvent: (data, isMultipart) => apiRequest('/host/events', 'POST', data, isMultipart),
    updateEvent: (id, data, isMultipart) => apiRequest(`/host/events/${id}`, 'PUT', data, isMultipart),
    deleteEvent: (id) => apiRequest(`/host/events/${id}`, 'DELETE'),
    submitEvent: (id) => apiRequest(`/host/events/${id}/submit`, 'PATCH'),
    cancelEvent: (id) => apiRequest(`/host/events/${id}/cancel`, 'PATCH'),
    getParticipants: (id) => apiRequest(`/host/events/${id}/participants`, 'GET'),
    markAttendance: (id, data) => apiRequest(`/host/events/${id}/attendance`, 'PATCH', data),
    markCertificates: (id, data) => apiRequest(`/host/events/${id}/certificates`, 'POST', data),
    updateProfile: (data) => apiRequest('/host/profile', 'PUT', data),
  },

  student: {
    getDashboard: () => apiRequest('/student/dashboard', 'GET'),
    discoverEvents: (params = '') => apiRequest(`/student/events${params ? '?' + params : ''}`, 'GET'),
    getEvent: (id) => apiRequest(`/student/events/${id}`, 'GET'),
    registerForEvent: (id) => apiRequest(`/student/events/${id}/register`, 'POST'),
    cancelRegistration: (id) => apiRequest(`/student/events/${id}/register`, 'DELETE'),
    saveEvent: (id) => apiRequest(`/student/events/${id}/save`, 'POST'),
    unsaveEvent: (id) => apiRequest(`/student/events/${id}/save`, 'DELETE'),
    getMyEvents: () => apiRequest('/student/my-events', 'GET'),
    getSavedEvents: () => apiRequest('/student/saved-events', 'GET'),
    getActivity: () => apiRequest('/student/activity', 'GET'),
    getCertificates: () => apiRequest('/student/certificates', 'GET'),
    getNotifications: () => apiRequest('/student/notifications', 'GET'),
    markNotificationRead: (id) => apiRequest(`/student/notifications/${id}/read`, 'PATCH'),
    markAllRead: () => apiRequest('/student/notifications/read-all', 'PATCH'),
    getProfile: () => apiRequest('/student/profile', 'GET'),
    updateProfile: (data, isMultipart) => apiRequest('/student/profile', 'PUT', data, isMultipart),
  }
};

window.api = api;
window.apiRequest = apiRequest;
