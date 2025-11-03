import axios from 'axios';

const api = axios.create({
  baseURL: '/api',
  headers: {
    'Content-Type': 'application/json',
  },
});

api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('adminToken');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem('adminToken');
      localStorage.removeItem('adminUser');
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

export const authAPI = {
  login: (credentials) => api.post('/auth/login', credentials),
  register: (userData) => api.post('/auth/register', userData),
  getProfile: () => api.get('/auth/profile'),
};

export const adminAPI = {
  getStats: () => api.get('/admin/stats'),
  getAnalytics: (period = '7') => api.get(`/admin/analytics?period=${period}`),
  getUsers: (params) => api.get('/admin/users', { params }),
  getUserDetails: (userId) => api.get(`/admin/users/${userId}`),
  updateUserWallet: (userId, data) => api.put(`/admin/users/${userId}/wallet`, data),
  updateUserStatus: (userId, status) => api.put(`/admin/users/${userId}/status`, { status }),

  cleanupUnverifiedUsers: (daysOld = 1) =>
    api.post('/admin/security/cleanup-unverified', { daysOld }),
  
  testEmail: (data) => api.post('/admin/security/test-email', data),
  getUnverifiedUsers: (params) => api.get('/admin/security/unverified-users', { params }),
  manualVerifyEmail: (email, reason) => api.post('/admin/security/manual-verify-email', { email, reason }),
};

export const serviceAPI = {
  payElectricity: (data) => api.post('/services/electricity', data),
  subscribeTV: (data) => api.post('/services/tv', data),
};

export const supportAPI = {
  getTickets: (params) => api.get('/admin/support', { params }),
  getTicketDetails: (ticketId) => api.get(`/admin/support/${ticketId}`),
  updateTicketStatus: (ticketId, status) => api.put(`/admin/support/${ticketId}/status`, { status }),
  replyToTicket: (ticketId, response) => api.post(`/admin/support/${ticketId}/response`, { response }),
};

export const cashbackAPI = {
  getCashbackSettings: () => api.get('/admin/cashback/settings'),
  updateCashbackSettings: (data) => api.put('/admin/cashback/settings', data),
  getUserCashback: (params) => api.get('/admin/cashback', { params }),
};

export const settingsAPI = {
  getSystemSettings: () => api.get('/admin/settings'),
  updateSystemSettings: (data) => api.put('/admin/settings', data),
};

export const paymentAPI = {
  initializePayment: (data) => api.post('/payment/initialize', data),
  verifyPayment: (reference) => api.get(`/payment/verify/${reference}`),
  getPaymentHistory: (params) => api.get('/payment/history', { params }),
};

export default api;