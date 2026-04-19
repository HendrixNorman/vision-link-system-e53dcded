import axios from 'axios';
import { User, Student, Result, Message, ApiResponse, PaginatedResponse, RegisterData } from '../types';

const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000/api';

// Create axios instance with default config
const api = axios.create({
  baseURL: API_BASE_URL,
  timeout: 10000,
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
  (error) => {
    return Promise.reject(error);
  }
);

// Response interceptor to handle errors
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
  login: async (email: string, password: string): Promise<ApiResponse<{ token: string; user: User }>> => {
    const response = await api.post('/auth/login', { email, password });
    return response.data;
  },

  register: async (userData: RegisterData): Promise<ApiResponse<{ token: string; user: User }>> => {
    const response = await api.post('/auth/register', userData);
    return response.data;
  },

  getMe: async (): Promise<ApiResponse<{ user: User }>> => {
    const response = await api.get('/auth/me');
    return response.data;
  },

  logout: async (): Promise<ApiResponse> => {
    const response = await api.post('/auth/logout');
    return response.data;
  },

  changePassword: async (currentPassword: string, newPassword: string): Promise<ApiResponse> => {
    const response = await api.put('/auth/change-password', { currentPassword, newPassword });
    return response.data;
  },
};

// Users API
export const usersAPI = {
  getUsers: async (params?: {
    page?: number;
    limit?: number;
    role?: string;
    search?: string;
  }): Promise<PaginatedResponse<User>> => {
    const response = await api.get('/users', { params });
    return response.data;
  },

  getUser: async (id: string): Promise<ApiResponse<{ user: User }>> => {
    const response = await api.get(`/users/${id}`);
    return response.data;
  },

  createUser: async (userData: {
    name: string;
    email: string;
    password: string;
    role: string;
    parentId?: string;
  }): Promise<ApiResponse<{ user: User }>> => {
    const response = await api.post('/users', userData);
    return response.data;
  },

  updateUser: async (id: string, userData: Partial<User>): Promise<ApiResponse<{ user: User }>> => {
    const response = await api.put(`/users/${id}`, userData);
    return response.data;
  },

  deleteUser: async (id: string): Promise<ApiResponse> => {
    const response = await api.delete(`/users/${id}`);
    return response.data;
  },

  getUserStats: async (): Promise<ApiResponse<any>> => {
    const response = await api.get('/users/stats/dashboard');
    return response.data;
  },
};

// Students API
export const studentsAPI = {
  getStudents: async (params?: {
    page?: number;
    limit?: number;
    search?: string;
    class?: string;
  }): Promise<PaginatedResponse<Student>> => {
    const response = await api.get('/students', { params });
    return response.data;
  },

  getStudent: async (id: string): Promise<ApiResponse<{ student: Student }>> => {
    const response = await api.get(`/students/${id}`);
    return response.data;
  },

  createStudent: async (studentData: {
    name: string;
    parentId: string;
    class: string;
    grade: string;
    dateOfBirth: string;
    gender: string;
    address?: any;
    phoneNumber?: string;
    emergencyContact?: any;
  }): Promise<ApiResponse<{ student: Student; userCredentials: any }>> => {
    const response = await api.post('/students', studentData);
    return response.data;
  },

  updateStudent: async (id: string, studentData: Partial<Student>): Promise<ApiResponse<{ student: Student }>> => {
    const response = await api.put(`/students/${id}`, studentData);
    return response.data;
  },

  deleteStudent: async (id: string): Promise<ApiResponse> => {
    const response = await api.delete(`/students/${id}`);
    return response.data;
  },

  getStudentStats: async (): Promise<ApiResponse<any>> => {
    const response = await api.get('/students/stats/dashboard');
    return response.data;
  },
};

// Results API
export const resultsAPI = {
  getResults: async (params?: {
    page?: number;
    limit?: number;
    term?: string;
    academicYear?: string;
    studentId?: string;
  }): Promise<PaginatedResponse<Result>> => {
    const response = await api.get('/results', { params });
    return response.data;
  },

  getResult: async (id: string): Promise<ApiResponse<{ result: Result }>> => {
    const response = await api.get(`/results/${id}`);
    return response.data;
  },

  createResult: async (resultData: {
    studentId: string;
    term: string;
    academicYear: string;
    subjects: Array<{
      subject: string;
      score: number;
      remarks?: string;
    }>;
    classPosition?: number;
    totalStudentsInClass?: number;
    teacherRemarks?: string;
    principalRemarks?: string;
    nextTermBegins?: string;
  }): Promise<ApiResponse<{ result: Result }>> => {
    const response = await api.post('/results', resultData);
    return response.data;
  },

  updateResult: async (id: string, resultData: Partial<Result>): Promise<ApiResponse<{ result: Result }>> => {
    const response = await api.put(`/results/${id}`, resultData);
    return response.data;
  },

  deleteResult: async (id: string): Promise<ApiResponse> => {
    const response = await api.delete(`/results/${id}`);
    return response.data;
  },

  getStudentResults: async (studentId: string, params?: {
    term?: string;
    academicYear?: string;
  }): Promise<ApiResponse<{ results: Result[] }>> => {
    const response = await api.get(`/results/student/${studentId}`, { params });
    return response.data;
  },

  getResultStats: async (): Promise<ApiResponse<any>> => {
    const response = await api.get('/results/stats/dashboard');
    return response.data;
  },
};

// Messages API
export const messagesAPI = {
  getMessages: async (params?: {
    page?: number;
    limit?: number;
    target?: string;
    priority?: string;
    category?: string;
    unread?: string;
  }): Promise<PaginatedResponse<Message>> => {
    const response = await api.get('/messages', { params });
    return response.data;
  },

  getMessage: async (id: string): Promise<ApiResponse<{ message: Message }>> => {
    const response = await api.get(`/messages/${id}`);
    return response.data;
  },

  createMessage: async (messageData: {
    title: string;
    content: string;
    target: string;
    specificUsers?: string[];
    priority?: string;
    category?: string;
    expiryDate?: string;
  }): Promise<ApiResponse<{ message: Message }>> => {
    const response = await api.post('/messages', messageData);
    return response.data;
  },

  updateMessage: async (id: string, messageData: Partial<Message>): Promise<ApiResponse<{ message: Message }>> => {
    const response = await api.put(`/messages/${id}`, messageData);
    return response.data;
  },

  deleteMessage: async (id: string): Promise<ApiResponse> => {
    const response = await api.delete(`/messages/${id}`);
    return response.data;
  },

  markAsRead: async (id: string): Promise<ApiResponse> => {
    const response = await api.post(`/messages/${id}/read`);
    return response.data;
  },

  getUnreadCount: async (): Promise<ApiResponse<{ unreadCount: number }>> => {
    const response = await api.get('/messages/unread/count');
    return response.data;
  },

  getMessageStats: async (): Promise<ApiResponse<any>> => {
    const response = await api.get('/messages/stats/dashboard');
    return response.data;
  },
};

export default api;
