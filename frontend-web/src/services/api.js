import axios from 'axios';

// Configurar base URL da API 
// Em desenvolvimento, usar proxy local. Em produção, usar variável de ambiente ou fallback
const API_BASE_URL = process.env.NODE_ENV === 'development' ? '' : (process.env.REACT_APP_API_URL || 'http://10.0.50.79:8089');

export const api = axios.create({
  baseURL: `${API_BASE_URL}/api`,
  headers: {
    'Content-Type': 'application/json'
  },
  withCredentials: false
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
  login: (credentials) => api.post('/auth/login', credentials),
  register: (userData) => api.post('/auth/register', userData),
  getProfile: () => api.get('/auth/me'),
  updateProfile: (profileData) => api.put('/auth/profile', profileData),
  changePassword: (passwordData) => api.put('/auth/change-password', passwordData),
  refreshToken: () => api.post('/auth/refresh')
};

// Serviços de usuários
export const userService = {
  getUsers: (params) => api.get('/users', { params }),
  getUserById: (id) => api.get(`/users/${id}`),
  createUser: (userData) => api.post('/users', userData),
  updateUser: (id, userData) => api.put(`/users/${id}`, userData),
  deleteUser: (id) => api.delete(`/users/${id}`),
  toggleUserStatus: (id) => api.put(`/users/${id}/toggle-status`)
};

// Serviços de veículos
export const vehicleService = {
  getVehicles: (params) => api.get('/vehicles', { params }),
  getVehicleById: (id) => api.get(`/vehicles/${id}`),
  createVehicle: (vehicleData) => api.post('/vehicles', vehicleData),
  updateVehicle: (id, vehicleData) => api.put(`/vehicles/${id}`, vehicleData),
  deleteVehicle: (id) => api.delete(`/vehicles/${id}`),
  updateVehicleStatus: (id, status) => api.put(`/vehicles/${id}/status`, { status }),
  updateVehicleLocation: (id, location) => api.put(`/vehicles/${id}/location`, location),
  getAvailableVehicles: () => api.get('/vehicles/available')
};

// Serviços de corridas
export const rideService = {
  getRides: (params) => api.get('/rides', { params }),
  getRideById: (id) => api.get(`/rides/${id}`),
  createRide: (rideData) => api.post('/rides', rideData),
  updateRide: (id, rideData) => api.put(`/rides/${id}`, rideData),
  cancelRide: (id, reason) => api.put(`/rides/${id}/cancel`, { reason }),
  assignDriver: (id, driverId) => api.put(`/rides/${id}/assign`, { driverId }),
  startRide: (id) => api.put(`/rides/${id}/start`),
  finishRide: (id, notes) => api.put(`/rides/${id}/finish`, { notes }),
  getRideHistory: (params) => api.get('/rides/history', { params }),
  getRideStatistics: (params) => api.get('/rides/statistics', { params })
};

// Serviços de localização
export const locationService = {
  getLocations: (params) => api.get('/locations', { params }),
  createLocation: (locationData) => api.post('/locations', locationData),
  updateLocation: (id, locationData) => api.put(`/locations/${id}`, locationData),
  getNearbyVehicles: (lat, lng, radius) => 
    api.get(`/locations/nearby?lat=${lat}&lng=${lng}&radius=${radius}`),
  getLocationHistory: (entityId, entityType, params) => 
    api.get(`/locations/history/${entityType}/${entityId}`, { params })
};

// Serviços de mensagens
export const messageService = {
  getMessages: (rideId, params) => api.get(`/messages/ride/${rideId}`, { params }),
  sendMessage: (messageData) => api.post('/messages', messageData),
  markMessageAsRead: (id) => api.put(`/messages/${id}/read`),
  getUnreadCount: () => api.get('/messages/unread-count')
};

// Serviços de notificações
export const notificationService = {
  getNotifications: (params) => api.get('/notifications', { params }),
  markAsRead: (id) => api.put(`/notifications/${id}/read`),
  markAllAsRead: () => api.put('/notifications/read-all'),
  getUnreadCount: () => api.get('/notifications/unread-count'),
  deleteNotification: (id) => api.delete(`/notifications/${id}`)
};

// Serviços de relatórios
export const reportService = {
  getDashboardStats: (params) => api.get('/reports/dashboard', { params }),
  getRideReports: (params) => api.get('/reports/rides', { params }),
  getVehicleReports: (params) => api.get('/reports/vehicles', { params }),
  getDriverReports: (params) => api.get('/reports/drivers', { params }),
  exportReport: (type, params) => api.get(`/reports/export/${type}`, { 
    params, 
    responseType: 'blob' 
  })
};

// Serviços de upload
export const uploadService = {
  uploadFile: (file, folder = 'general') => {
    const formData = new FormData();
    formData.append('file', file);
    formData.append('folder', folder);
    
    return api.post('/upload', formData, {
      headers: {
        'Content-Type': 'multipart/form-data'
      }
    });
  }
};

export default api;