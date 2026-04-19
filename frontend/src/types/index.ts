export interface User {
  id: string;
  name: string;
  email: string;
  role: 'admin' | 'student' | 'parent' | 'teacher';
  parentId?: string;
  isActive: boolean;
  lastLogin?: string;
  createdAt: string;
}

export interface Student {
  _id: string;
  studentId: string;
  name: string;
  parentId: string;
  class: string;
  grade: string;
  dateOfBirth: string;
  gender: 'male' | 'female' | 'other';
  address?: {
    street?: string;
    city?: string;
    state?: string;
    zipCode?: string;
  };
  phoneNumber?: string;
  emergencyContact?: {
    name?: string;
    relationship?: string;
    phone?: string;
  };
  isActive: boolean;
  enrollmentDate: string;
  createdAt: string;
  updatedAt: string;
}

export interface Subject {
  subject: string;
  score: number;
  grade: 'A' | 'B' | 'C' | 'D' | 'E' | 'F';
  remarks?: string;
}

export interface Result {
  _id: string;
  studentId: string | Student;
  term: 'First Term' | 'Second Term' | 'Third Term';
  academicYear: string;
  subjects: Subject[];
  totalScore: number;
  averageScore: number;
  classPosition?: number;
  totalStudentsInClass?: number;
  teacherRemarks?: string;
  principalRemarks?: string;
  nextTermBegins?: string;
  uploadedBy: string | User;
  createdAt: string;
  updatedAt: string;
}

export interface Message {
  _id: string;
  title: string;
  content: string;
  sender: string | User;
  target: 'all' | 'parents' | 'students' | 'teachers' | 'specific';
  specificUsers?: string[] | User[];
  priority: 'low' | 'medium' | 'high' | 'urgent';
  category: 'general' | 'academic' | 'administrative' | 'emergency' | 'event';
  isActive: boolean;
  expiryDate?: string;
  attachments?: Array<{
    filename: string;
    url: string;
    size: number;
    mimeType: string;
  }>;
  readBy: Array<{
    user: string | User;
    readAt: string;
  }>;
  createdAt: string;
  updatedAt: string;
}

export interface AuthContextType {
  user: User | null;
  loading: boolean;
  login: (email: string, password: string) => Promise<void>;
  logout: () => void;
  register: (userData: RegisterData) => Promise<void>;
  updateProfile: (userData: Partial<User>) => Promise<void>;
}

export interface RegisterData {
  name: string;
  email: string;
  password: string;
  role: 'admin' | 'student' | 'parent' | 'teacher';
  parentId?: string;
}

export interface ApiResponse<T = any> {
  success: boolean;
  message: string;
  data?: T;
  errors?: any[];
}

export interface PaginatedResponse<T> {
  success: boolean;
  data: {
    results?: T[];
    pagination?: {
      currentPage: number;
      totalPages: number;
      totalResults?: number;
      limit?: number;
    };
    [key: string]: any;
  };
}

export interface DashboardStats {
  totalUsers?: number;
  activeUsers?: number;
  totalStudents?: number;
  totalResults?: number;
  totalMessages?: number;
  [key: string]: any;
}
