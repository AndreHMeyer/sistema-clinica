import axios from 'axios';

const adminApi = axios.create({
  baseURL: 'http://localhost:3001/api/admin',
  headers: {
    'Content-Type': 'application/json'
  }
});

// Interceptor para adicionar token
adminApi.interceptors.request.use(
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

// Interceptor para tratar erros
adminApi.interceptors.response.use(
  (response) => response,
  (error) => {
    // Não redireciona se for erro de login (credenciais inválidas)
    const isLoginRequest = error.config?.url?.includes('/login');
    
    if (error.response?.status === 401 && !isLoginRequest) {
      localStorage.removeItem('adminToken');
      localStorage.removeItem('admin');
      window.location.href = '/admin/login';
    }
    return Promise.reject(error);
  }
);

export default adminApi;
