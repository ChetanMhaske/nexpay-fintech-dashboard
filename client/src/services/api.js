import axios from 'axios';

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || 'http://localhost:5000/api',
  withCredentials: true,
});

let activeRequests = 0;
let wakeupTimer = null;

api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  
  activeRequests++;
  if (activeRequests === 1) {
    wakeupTimer = setTimeout(() => {
      let overlay = document.getElementById('wakeup-overlay');
      if (!overlay) {
        overlay = document.createElement('div');
        overlay.id = 'wakeup-overlay';
        overlay.innerHTML = '<div style="position:fixed;top:0;left:0;width:100%;height:100%;background:rgba(0,0,0,0.8);z-index:9999;display:flex;flex-direction:column;align-items:center;justify-content:center;color:white;font-family:sans-serif;"><div style="width:40px;height:40px;border:4px solid transparent;border-top-color:#3b82f6;border-radius:50%;animation:spin 1s linear infinite;margin-bottom:16px;"></div><style>@keyframes spin { 0% { transform: rotate(0deg); } 100% { transform: rotate(360deg); } }</style><h2 style="font-size:1.5rem;font-weight:bold;margin:0;">Waking up server...</h2><p style="color:#9ca3af;margin-top:8px;">Render free-tier cold start (takes ~50s)</p></div>';
        document.body.appendChild(overlay);
      }
      overlay.style.display = 'flex';
    }, 5000);
  }
  
  return config;
});

api.interceptors.response.use(
  (response) => {
    activeRequests--;
    if (activeRequests === 0) {
      clearTimeout(wakeupTimer);
      const overlay = document.getElementById('wakeup-overlay');
      if (overlay) overlay.style.display = 'none';
    }
    return response;
  },
  async (error) => {
    activeRequests--;
    if (activeRequests === 0) {
      clearTimeout(wakeupTimer);
      const overlay = document.getElementById('wakeup-overlay');
      if (overlay) overlay.style.display = 'none';
    }
    const originalRequest = error.config;
    if (error.response?.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true;
      try {
        const { data } = await axios.post(`${api.defaults.baseURL}/auth/refresh`, {}, { withCredentials: true });
        const newToken = data.data?.accessToken || data.accessToken;
        localStorage.setItem('token', newToken);
        originalRequest.headers.Authorization = `Bearer ${newToken}`;
        return api(originalRequest);
      } catch (err) {
        localStorage.removeItem('token');
        if (window.location.pathname !== '/login') {
          window.location.href = '/login';
        }
        return Promise.reject(err);
      }
    }
    return Promise.reject(error);
  }
);

export const authService = {
  register: (data) => api.post('/auth/register', data).then(res => res.data),
  login: (data) => api.post('/auth/login', data).then(res => res.data),
  logout: () => api.post('/auth/logout').then(res => res.data),
  getMe: () => api.get('/auth/me').then(res => res.data),
};

export const walletService = {
  getWallets: () => api.get('/wallets').then(res => res.data),
  getWallet: (currency) => api.get(`/wallets/${currency}`).then(res => res.data),
};

export const transactionService = {
  createTransaction: (data, config) => api.post('/transactions', data, config).then(res => res.data),
  getTransactions: (params) => api.get('/transactions', { params }).then(res => res.data),
  getTransaction: (id) => api.get(`/transactions/${id}`).then(res => res.data),
  reverseTransaction: (id) => api.post(`/transactions/${id}/reverse`).then(res => res.data),
};

export const userService = {
  getUsers: (params) => api.get('/users', { params }).then(res => res.data),
  getUser: (id) => api.get(`/users/${id}`).then(res => res.data),
  updateRole: (id, role) => api.patch(`/users/${id}/role`, { role }).then(res => res.data),
  freezeUser: (id, isFrozen) => api.patch(`/users/${id}/freeze`, { isFrozen }).then(res => res.data),
  getAllTransactions: (params) => api.get('/users/all-transactions', { params }).then(res => res.data),
};

export const auditService = {
  getAuditLogs: (params) => api.get('/audit', { params }).then(res => res.data),
  getAuditorTransactions: (params) => api.get('/audit/transactions', { params }).then(res => res.data),
};

export default api;
