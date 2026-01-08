import axios from 'axios';

// Create axios instance
const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || 'http://localhost:5000/api',
  headers: {
    'Content-Type': 'application/json'
  }
});

// Request interceptor - Add auth token
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response interceptor - Handle errors
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      // Token expired or invalid
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

// Auth API
export const authAPI = {
  register: (data) => api.post('/auth/register', data),
  login: (data) => api.post('/auth/login', data),
  getMe: () => api.get('/auth/me'),
  updateProfile: (data) => api.put('/auth/profile', data),
  changePassword: (data) => api.put('/auth/change-password', data)
};

// Books API
export const booksAPI = {
  getAll: (params) => api.get('/books', { params }),
  getById: (id) => api.get(`/books/${id}`),
  getCategories: () => api.get('/books/categories'),
  create: (data) => api.post('/books', data),
  update: (id, data) => api.put(`/books/${id}`, data),
  delete: (id) => api.delete(`/books/${id}`),
  addCopies: (id, quantity) => api.post(`/books/${id}/add-copies`, { quantity })
};

// Loans API
export const loansAPI = {
  getAll: (params) => api.get('/loans', { params }),
  getMy: (params) => api.get('/loans/my', { params }),
  getOverdue: () => api.get('/loans/overdue'),
  getStats: () => api.get('/loans/stats'),
  getById: (id) => api.get(`/loans/${id}`),
  create: (data) => api.post('/loans', data),
  return: (id) => api.put(`/loans/${id}/return`)
};

// Users API
export const usersAPI = {
  getAll: (params) => api.get('/users', { params }),
  getById: (id) => api.get(`/users/${id}`),
  getStats: () => api.get('/users/stats'),
  update: (id, data) => api.put(`/users/${id}`, data),
  delete: (id) => api.delete(`/users/${id}`),
  toggleActive: (id) => api.put(`/users/${id}/toggle-active`),
  changeRole: (id, role) => api.put(`/users/${id}/role`, { role })
};

export default api;
