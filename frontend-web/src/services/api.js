import axios from 'axios';

// Configurar base URL da API 
// Em desenvolvimento, usar proxy local. Em produção, usar variável de ambiente
const API_BASE_URL = process.env.REACT_APP_API_URL || '';

export const api = axios.create({
  baseURL: `${API_BASE_URL}/api`,
  headers: {
    'Content-Type': 'application/json'
  },
  withCredentials: true
});

// Interceptor para adicionar token automaticamente
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

// Interceptor para tratar respostas e erros
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      // Token expirado ou inválido
      localStorage.removeItem('token');
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

// Serviços de autenticação
export const authService = {
  login: (credentials) => api.post('/api/auth/login', credentials),
  register: (userData) => api.post('/api/auth/register', userData),
  getProfile: () => api.get('/api/auth/me'),
  updateProfile: (profileData) => api.put('/api/auth/profile', profileData),
  changePassword: (passwordData) => api.put('/api/auth/change-password', passwordData),
  refreshToken: () => api.post('/api/auth/refresh')
};

// Serviços de usuários
export const userService = {
  getUsers: (params) => api.get('/api/users', { params }),
  getUserById: (id) => api.get(`/api/users/${id}`),
  createUser: (userData) => api.post('/api/users', userData),
  updateUser: (id, userData) => api.put(`/api/users/${id}`, userData),
  deleteUser: (id) => api.delete(`/api/users/${id}`),
  toggleUserStatus: (id) => api.put(`/api/users/${id}/toggle-status`)
};

// Serviços de veículos
export const vehicleService = {
  getVehicles: (params) => api.get('/api/vehicles', { params }),
  getVehicleById: (id) => api.get(`/api/vehicles/${id}`),
  createVehicle: (vehicleData) => api.post('/api/vehicles', vehicleData),
  updateVehicle: (id, vehicleData) => api.put(`/api/vehicles/${id}`, vehicleData),
  deleteVehicle: (id) => api.delete(`/api/vehicles/${id}`),
  updateVehicleStatus: (id, status) => api.put(`/api/vehicles/${id}/status`, { status }),
  updateVehicleLocation: (id, location) => api.put(`/api/vehicles/${id}/location`, location),
  getAvailableVehicles: () => api.get('/api/vehicles/available')
};

// Serviços de corridas
export const rideService = {
  getRides: (params) => api.get('/api/rides', { params }),
  getRideById: (id) => api.get(`/api/rides/${id}`),
  createRide: (rideData) => api.post('/api/rides', rideData),
  updateRide: (id, rideData) => api.put(`/api/rides/${id}`, rideData),
  cancelRide: (id, reason) => api.put(`/api/rides/${id}/cancel`, { reason }),
  assignDriver: (id, driverId) => api.put(`/api/rides/${id}/assign`, { driverId }),
  startRide: (id) => api.put(`/api/rides/${id}/start`),
  finishRide: (id, notes) => api.put(`/api/rides/${id}/finish`, { notes }),
  getRideHistory: (params) => api.get('/api/rides/history', { params }),
  getRideStatistics: (params) => api.get('/api/rides/statistics', { params })
};

// Serviços de localização
export const locationService = {
  getLocations: (params) => api.get('/api/gps', { params }),
  createLocation: (locationData) => api.post('/api/gps', locationData),
  updateLocation: (id, locationData) => api.put(`/api/gps/${id}`, locationData),
  getNearbyVehicles: (lat, lng, radius) => 
    api.get(`/api/gps/nearby?lat=${lat}&lng=${lng}&radius=${radius}`),
  getLocationHistory: (entityId, entityType, params) => 
    api.get(`/api/gps/history/${entityType}/${entityId}`, { params })
};

// Serviços de mensagens
export const messageService = {
  getMessages: (rideId, params) => api.get(`/api/rides/${rideId}/messages`, { params }),
  sendMessage: (messageData) => api.post('/api/rides/messages', messageData),
  markMessageAsRead: (id) => api.put(`/api/rides/messages/${id}/read`),
  getUnreadCount: () => api.get('/api/rides/messages/unread-count')
};

// Serviços de notificações
export const notificationService = {
  getNotifications: (params) => api.get('/api/notifications', { params }),
  markAsRead: (id) => api.put(`/api/notifications/${id}/read`),
  markAllAsRead: () => api.put('/api/notifications/read-all'),
  getUnreadCount: () => api.get('/api/notifications/unread-count'),
  deleteNotification: (id) => api.delete(`/api/notifications/${id}`)
};

// Serviços de relatórios (desabilitado temporariamente)
export const reportService = {
  getDashboardStats: (params) => api.get('/api/reports/dashboard', { params }),
  getRideReports: (params) => api.get('/api/reports/rides', { params }),
  getVehicleReports: (params) => api.get('/api/reports/vehicles', { params }),
  getDriverReports: (params) => api.get('/api/reports/drivers', { params }),
  exportReport: (type, params) => api.get(`/api/reports/export/${type}`, { 
    params, 
    responseType: 'blob' 
  })
};

// Serviços de upload (desabilitado temporariamente)
export const uploadService = {
  uploadFile: (file, folder = 'general') => {
    const formData = new FormData();
    formData.append('file', file);
    formData.append('folder', folder);
    
    return api.post('/api/upload', formData, {
      headers: {
        'Content-Type': 'multipart/form-data'
      }
    });
  }
};

export default api;