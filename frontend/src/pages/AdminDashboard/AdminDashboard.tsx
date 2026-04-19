import React, { useEffect, useState } from 'react';
import { Routes, Route, useNavigate } from 'react-router-dom';
import { usersAPI, studentsAPI, resultsAPI, messagesAPI } from '../../services/api';
import { User, Student, Result, Message } from '../../types';
import { UserGroupIcon, AcademicCapIcon, ChartBarIcon, BellIcon } from '@heroicons/react/24/outline';

const AdminDashboard: React.FC = () => {
  const navigate = useNavigate();
  const [stats, setStats] = useState({
    totalUsers: 0,
    totalStudents: 0,
    totalResults: 0,
    totalMessages: 0,
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const [userStats, studentStats, resultStats, messageStats] = await Promise.all([
          usersAPI.getUserStats(),
          studentsAPI.getStudentStats(),
          resultsAPI.getResultStats(),
          messagesAPI.getMessageStats(),
        ]);

        setStats({
          totalUsers: userStats.data?.totalUsers || 0,
          totalStudents: studentStats.data?.totalStudents || 0,
          totalResults: resultStats.data?.totalResults || 0,
          totalMessages: messageStats.data?.totalMessages || 0,
        });
      } catch (error) {
        console.error('Error fetching admin stats:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchStats();
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
      </div>
    );
  }

  return (
    <div>
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900">Admin Dashboard</h1>
        <p className="text-gray-600 mt-2">Manage your entire school system</p>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <div className="card hover:shadow-md transition-shadow cursor-pointer" onClick={() => navigate('/admin/users')}>
          <div className="flex items-center">
            <div className="bg-primary-100 p-3 rounded-full mr-4">
              <UserGroupIcon className="h-6 w-6 text-primary-600" />
            </div>
            <div>
              <p className="text-sm font-medium text-gray-600">Total Users</p>
              <p className="text-2xl font-bold text-gray-900">{stats.totalUsers}</p>
            </div>
          </div>
        </div>

        <div className="card hover:shadow-md transition-shadow cursor-pointer" onClick={() => navigate('/admin/students')}>
          <div className="flex items-center">
            <div className="bg-success-100 p-3 rounded-full mr-4">
              <AcademicCapIcon className="h-6 w-6 text-success-600" />
            </div>
            <div>
              <p className="text-sm font-medium text-gray-600">Total Students</p>
              <p className="text-2xl font-bold text-gray-900">{stats.totalStudents}</p>
            </div>
          </div>
        </div>

        <div className="card hover:shadow-md transition-shadow cursor-pointer" onClick={() => navigate('/admin/results')}>
          <div className="flex items-center">
            <div className="bg-warning-100 p-3 rounded-full mr-4">
              <ChartBarIcon className="h-6 w-6 text-warning-600" />
            </div>
            <div>
              <p className="text-sm font-medium text-gray-600">Total Results</p>
              <p className="text-2xl font-bold text-gray-900">{stats.totalResults}</p>
            </div>
          </div>
        </div>

        <div className="card hover:shadow-md transition-shadow cursor-pointer" onClick={() => navigate('/admin/messages')}>
          <div className="flex items-center">
            <div className="bg-secondary-100 p-3 rounded-full mr-4">
              <BellIcon className="h-6 w-6 text-secondary-600" />
            </div>
            <div>
              <p className="text-sm font-medium text-gray-600">Total Messages</p>
              <p className="text-2xl font-bold text-gray-900">{stats.totalMessages}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Quick Actions */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
        <div className="card">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">User Management</h2>
          <div className="space-y-3">
            <button
              onClick={() => navigate('/admin/users?action=create')}
              className="w-full text-left p-3 border border-gray-200 rounded-lg hover:bg-gray-50"
            >
              <h3 className="font-medium text-gray-900">Create New User</h3>
              <p className="text-sm text-gray-600">Add students, parents, or teachers</p>
            </button>
            <button
              onClick={() => navigate('/admin/users')}
              className="w-full text-left p-3 border border-gray-200 rounded-lg hover:bg-gray-50"
            >
              <h3 className="font-medium text-gray-900">Manage Users</h3>
              <p className="text-sm text-gray-600">View, edit, or delete user accounts</p>
            </button>
          </div>
        </div>

        <div className="card">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">Academic Management</h2>
          <div className="space-y-3">
            <button
              onClick={() => navigate('/admin/students?action=create')}
              className="w-full text-left p-3 border border-gray-200 rounded-lg hover:bg-gray-50"
            >
              <h3 className="font-medium text-gray-900">Add Student</h3>
              <p className="text-sm text-gray-600">Register new students</p>
            </button>
            <button
              onClick={() => navigate('/admin/results?action=create')}
              className="w-full text-left p-3 border border-gray-200 rounded-lg hover:bg-gray-50"
            >
              <h3 className="font-medium text-gray-900">Upload Results</h3>
              <p className="text-sm text-gray-600">Add academic results</p>
            </button>
          </div>
        </div>
      </div>

      {/* Communication */}
      <div className="card">
        <h2 className="text-xl font-semibold text-gray-900 mb-4">Communication</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <button
            onClick={() => navigate('/admin/messages?action=create&target=all')}
            className="p-4 border border-gray-200 rounded-lg hover:bg-gray-50 text-left"
          >
            <h3 className="font-medium text-gray-900">Send to All</h3>
            <p className="text-sm text-gray-600 mt-1">Broadcast to everyone</p>
          </button>
          <button
            onClick={() => navigate('/admin/messages?action=create&target=parents')}
            className="p-4 border border-gray-200 rounded-lg hover:bg-gray-50 text-left"
          >
            <h3 className="font-medium text-gray-900">Send to Parents</h3>
            <p className="text-sm text-gray-600 mt-1">Parent announcements</p>
          </button>
          <button
            onClick={() => navigate('/admin/messages?action=create&target=teachers')}
            className="p-4 border border-gray-200 rounded-lg hover:bg-gray-50 text-left"
          >
            <h3 className="font-medium text-gray-900">Send to Teachers</h3>
            <p className="text-sm text-gray-600 mt-1">Teacher communications</p>
          </button>
        </div>
      </div>

      {/* Recent Activity */}
      <div className="mt-8">
        <h2 className="text-xl font-semibold text-gray-900 mb-4">System Overview</h2>
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="card">
            <h3 className="font-medium text-gray-900 mb-3">User Distribution</h3>
            <div className="space-y-2">
              <div className="flex justify-between">
                <span className="text-sm text-gray-600">Admins</span>
                <span className="text-sm font-medium">-</span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm text-gray-600">Teachers</span>
                <span className="text-sm font-medium">-</span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm text-gray-600">Students</span>
                <span className="text-sm font-medium">{stats.totalStudents}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm text-gray-600">Parents</span>
                <span className="text-sm font-medium">-</span>
              </div>
            </div>
          </div>

          <div className="card">
            <h3 className="font-medium text-gray-900 mb-3">Academic Summary</h3>
            <div className="space-y-2">
              <div className="flex justify-between">
                <span className="text-sm text-gray-600">Total Results</span>
                <span className="text-sm font-medium">{stats.totalResults}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm text-gray-600">Active Students</span>
                <span className="text-sm font-medium">{stats.totalStudents}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm text-gray-600">Classes</span>
                <span className="text-sm font-medium">-</span>
              </div>
            </div>
          </div>

          <div className="card">
            <h3 className="font-medium text-gray-900 mb-3">Communication</h3>
            <div className="space-y-2">
              <div className="flex justify-between">
                <span className="text-sm text-gray-600">Total Messages</span>
                <span className="text-sm font-medium">{stats.totalMessages}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm text-gray-600">Active</span>
                <span className="text-sm font-medium">-</span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm text-gray-600">Categories</span>
                <span className="text-sm font-medium">5</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AdminDashboard;
