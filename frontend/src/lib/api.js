import axios from 'axios';

const API_BASE_URL = process.env.REACT_APP_BACKEND_URL;
const API = `${API_BASE_URL}/api`;

// Create axios instance
const api = axios.create({
  baseURL: API,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor to add auth token
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Response interceptor for error handling
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

// Auth
export const login = (email, password) => api.post('/auth/login', { email, password });
export const getMe = () => api.get('/auth/me');

// Users
export const getUsers = (params) => api.get('/users', { params });
export const getUser = (id) => api.get(`/users/${id}`);
export const createUser = (data) => api.post('/users', data);
export const updateUser = (id, data) => api.put(`/users/${id}`, data);
export const deleteUser = (id) => api.delete(`/users/${id}`);

// Teams
export const getTeams = () => api.get('/teams');
export const getTeam = (id) => api.get(`/teams/${id}`);
export const createTeam = (data) => api.post('/teams', data);
export const updateTeam = (id, data) => api.put(`/teams/${id}`, data);
export const deleteTeam = (id) => api.delete(`/teams/${id}`);

// Feedbacks
export const getFeedbacks = (params) => api.get('/feedbacks', { params });
export const getFeedback = (id) => api.get(`/feedbacks/${id}`);
export const createFeedback = (data) => api.post('/feedbacks', data);
export const updateFeedback = (id, data) => api.put(`/feedbacks/${id}`, data);
export const deleteFeedback = (id) => api.delete(`/feedbacks/${id}`);
export const acknowledgeFeedback = (id) => api.post(`/feedbacks/${id}/acknowledge`);

// Action Plans
export const getActionPlans = (params) => api.get('/action-plans', { params });
export const getActionPlan = (id) => api.get(`/action-plans/${id}`);
export const createActionPlan = (data) => api.post('/action-plans', data);
export const updateActionPlan = (id, data) => api.put(`/action-plans/${id}`, data);
export const deleteActionPlan = (id) => api.delete(`/action-plans/${id}`);

// Action Plan Items
export const getActionPlanItems = (planoDeAcaoId) => api.get('/action-plan-items', { params: { plano_de_acao_id: planoDeAcaoId } });
export const createActionPlanItem = (data) => api.post('/action-plan-items', data);
export const updateActionPlanItem = (id, data) => api.put(`/action-plan-items/${id}`, data);
export const deleteActionPlanItem = (id) => api.delete(`/action-plan-items/${id}`);

// Check-ins
export const getCheckins = (planoDeAcaoId) => api.get('/checkins', { params: { plano_de_acao_id: planoDeAcaoId } });
export const createCheckin = (data) => api.post('/checkins', data);

// Notifications
export const getNotifications = () => api.get('/notifications');
export const markNotificationRead = (id) => api.put(`/notifications/${id}/read`);
export const markAllNotificationsRead = () => api.put('/notifications/read-all');

// Dashboards
export const getGestorDashboard = () => api.get('/dashboard/gestor');
export const getColaboradorDashboard = () => api.get('/dashboard/colaborador');
export const getAdminDashboard = () => api.get('/dashboard/admin');

// Collaborator Profile
export const getCollaboratorProfile = (id) => api.get(`/collaborator-profile/${id}`);

// Seed data
export const seedData = () => api.post('/seed');

// Health check
export const healthCheck = () => api.get('/health');

export default api;
