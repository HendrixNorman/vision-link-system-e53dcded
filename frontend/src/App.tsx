import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import { useAuth } from './contexts/AuthContext';
import { AuthProvider } from './contexts/AuthContext';
import Layout from './components/Layout/Layout';
import LandingPage from './pages/LandingPage/LandingPage';
import LoginPage from './pages/LoginPage/LoginPage';
import Dashboard from './pages/Dashboard/Dashboard';
import AdminDashboard from './pages/AdminDashboard/AdminDashboard';
import StudentDashboard from './pages/StudentDashboard/StudentDashboard';
import ParentDashboard from './pages/ParentDashboard/ParentDashboard';
import TeacherDashboard from './pages/TeacherDashboard/TeacherDashboard';
import LoadingSpinner from './components/UI/LoadingSpinner';
import './App.css';

function AppContent() {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <LoadingSpinner size="large" />
      </div>
    );
  }

  return (
    <Router>
      <div className="App">
        <Routes>
          {/* Public routes */}
          <Route 
            path="/" 
            element={!user ? <LandingPage /> : <Navigate to="/dashboard" replace />} 
          />
          <Route 
            path="/login" 
            element={!user ? <LoginPage /> : <Navigate to="/dashboard" replace />} 
          />
          
          {/* Protected routes */}
          <Route 
            path="/dashboard" 
            element={
              user ? (
                <Layout>
                  <Dashboard />
                </Layout>
              ) : (
                <Navigate to="/login" replace />
              )
            } 
          />
          
          {/* Admin routes */}
          <Route 
            path="/admin/*" 
            element={
              user?.role === 'admin' ? (
                <Layout>
                  <AdminDashboard />
                </Layout>
              ) : (
                <Navigate to="/dashboard" replace />
              )
            } 
          />
          
          {/* Student routes */}
          <Route 
            path="/student/*" 
            element={
              user?.role === 'student' ? (
                <Layout>
                  <StudentDashboard />
                </Layout>
              ) : (
                <Navigate to="/dashboard" replace />
              )
            } 
          />
          
          {/* Parent routes */}
          <Route 
            path="/parent/*" 
            element={
              user?.role === 'parent' ? (
                <Layout>
                  <ParentDashboard />
                </Layout>
              ) : (
                <Navigate to="/dashboard" replace />
              )
            } 
          />
          
          {/* Teacher routes */}
          <Route 
            path="/teacher/*" 
            element={
              user?.role === 'teacher' ? (
                <Layout>
                  <TeacherDashboard />
                </Layout>
              ) : (
                <Navigate to="/dashboard" replace />
              )
            } 
          />
          
          {/* Catch all route */}
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
        
        {/* Global notifications */}
        <Toaster
          position="top-right"
          toastOptions={{
            duration: 4000,
            style: {
              background: '#363636',
              color: '#fff',
            },
            success: {
              duration: 3000,
              iconTheme: {
                primary: '#4ade80',
                secondary: '#fff',
              },
            },
            error: {
              duration: 5000,
              iconTheme: {
                primary: '#ef4444',
                secondary: '#fff',
              },
            },
          }}
        />
      </div>
    </Router>
  );
}

function App() {
  return (
    <AuthProvider>
      <AppContent />
    </AuthProvider>
  );
}

export default App;
