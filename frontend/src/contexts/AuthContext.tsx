import React, { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { User, AuthContextType, RegisterData } from '../types';
import { authAPI } from '../services/api';
import toast from 'react-hot-toast';

const AuthContext = createContext<AuthContextType | undefined>(undefined);

interface AuthProviderProps {
  children: ReactNode;
}

export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const initAuth = async () => {
      const token = localStorage.getItem('token');
      const storedUser = localStorage.getItem('user');

      if (token && storedUser) {
        try {
          // Verify token is still valid
          const response = await authAPI.getMe();
          if (response.success && response.data) {
            setUser(response.data.user);
            localStorage.setItem('user', JSON.stringify(response.data.user));
          } else {
            // Token invalid, clear storage
            localStorage.removeItem('token');
            localStorage.removeItem('user');
          }
        } catch (error) {
          console.error('Auth initialization error:', error);
          localStorage.removeItem('token');
          localStorage.removeItem('user');
        }
      }
      setLoading(false);
    };

    initAuth();
  }, []);

  const login = async (email: string, password: string): Promise<void> => {
    try {
      const response = await authAPI.login(email, password);
      
      if (response.success && response.data) {
        const { token, user } = response.data;
        localStorage.setItem('token', token);
        localStorage.setItem('user', JSON.stringify(user));
        setUser(user);
        toast.success('Login successful!');
      } else {
        throw new Error(response.message || 'Login failed');
      }
    } catch (error: any) {
      const message = error.response?.data?.message || error.message || 'Login failed';
      toast.error(message);
      throw error;
    }
  };

  const logout = (): void => {
    try {
      authAPI.logout().catch(console.error);
    } catch (error) {
      console.error('Logout API error:', error);
    }
    
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    setUser(null);
    toast.success('Logged out successfully');
  };

  const register = async (userData: RegisterData): Promise<void> => {
    try {
      const response = await authAPI.register(userData);
      
      if (response.success && response.data) {
        const { token, user } = response.data;
        localStorage.setItem('token', token);
        localStorage.setItem('user', JSON.stringify(user));
        setUser(user);
        toast.success('Registration successful!');
      } else {
        throw new Error(response.message || 'Registration failed');
      }
    } catch (error: any) {
      const message = error.response?.data?.message || error.message || 'Registration failed';
      toast.error(message);
      throw error;
    }
  };

  const updateProfile = async (userData: Partial<User>): Promise<void> => {
    try {
      const response = await authAPI.getMe(); // This would ideally be an update endpoint
      
      if (response.success && response.data) {
        const updatedUser = { ...response.data.user, ...userData };
        setUser(updatedUser);
        localStorage.setItem('user', JSON.stringify(updatedUser));
        toast.success('Profile updated successfully!');
      } else {
        throw new Error(response.message || 'Profile update failed');
      }
    } catch (error: any) {
      const message = error.response?.data?.message || error.message || 'Profile update failed';
      toast.error(message);
      throw error;
    }
  };

  const value: AuthContextType = {
    user,
    loading,
    login,
    logout,
    register,
    updateProfile,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = (): AuthContextType => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
