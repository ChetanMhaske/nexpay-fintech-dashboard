import axios from 'axios';

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || 'http://localhost:5000/api',
  withCredentials: true,
});

api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

api.interceptors.response.use(
  (response) => response,
  async (error) => {
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
  createTransaction: (data) => api.post('/transactions', data).then(res => res.data),
  getTransactions: (params) => api.get('/transactions', { params }).then(res => res.data),
  getTransaction: (id) => api.get(`/transactions/${id}`).then(res => res.data),
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
