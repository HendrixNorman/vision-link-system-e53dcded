import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { usersAPI, studentsAPI, resultsAPI, messagesAPI } from '../../services/api';
import { UserGroupIcon, AcademicCapIcon, ChartBarIcon, BellIcon } from '@heroicons/react/24/outline';

interface DashboardStats {
  totalUsers: number;
  totalStudents: number;
  totalResults: number;
  totalMessages: number;
  unreadMessages?: number;
}

const Dashboard: React.FC = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [stats, setStats] = useState<DashboardStats>({
    totalUsers: 0,
    totalStudents: 0,
    totalResults: 0,
    totalMessages: 0,
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchStats = async () => {
      try {
        let dashboardStats: DashboardStats = {
          totalUsers: 0,
          totalStudents: 0,
          totalResults: 0,
          totalMessages: 0,
        };

        if (user?.role === 'admin') {
          const [userStats, studentStats, resultStats, messageStats] = await Promise.all([
            usersAPI.getUserStats(),
            studentsAPI.getStudentStats(),
            resultsAPI.getResultStats(),
            messagesAPI.getMessageStats(),
          ]);

          dashboardStats = {
            totalUsers: userStats.data?.totalUsers || 0,
            totalStudents: studentStats.data?.totalStudents || 0,
            totalResults: resultStats.data?.totalResults || 0,
            totalMessages: messageStats.data?.totalMessages || 0,
          };
        } else if (user?.role === 'teacher') {
          // Teacher would have different stats - for now using basic ones
          dashboardStats = {
            totalUsers: 0,
            totalStudents: 0,
            totalResults: 0,
            totalMessages: 0,
          };
        } else if (user?.role === 'student' || user?.role === 'parent') {
          const [resultStats, messageStats] = await Promise.all([
            resultsAPI.getResults({ limit: 1 }),
            messagesAPI.getUnreadCount(),
          ]);

          dashboardStats = {
            totalUsers: 0,
            totalStudents: 0,
            totalResults: resultStats.data?.pagination?.totalResults || 0,
            totalMessages: messageStats.data?.unreadCount || 0,
            unreadMessages: messageStats.data?.unreadCount || 0,
          };
        }

        setStats(dashboardStats);
      } catch (error) {
        console.error('Error fetching dashboard stats:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchStats();
  }, [user]);

  const getRoleBasedContent = () => {
    switch (user?.role) {
      case 'admin':
        return {
          title: 'Admin Dashboard',
          subtitle: 'Manage your entire school system',
          cards: [
            {
              title: 'Total Users',
              value: stats.totalUsers,
              icon: UserGroupIcon,
              color: 'primary',
              link: '/admin/users'
            },
            {
              title: 'Total Students',
              value: stats.totalStudents,
              icon: AcademicCapIcon,
              color: 'success',
              link: '/admin/students'
            },
            {
              title: 'Total Results',
              value: stats.totalResults,
              icon: ChartBarIcon,
              color: 'warning',
              link: '/admin/results'
            },
            {
              title: 'Total Messages',
              value: stats.totalMessages,
              icon: BellIcon,
              color: 'secondary',
              link: '/admin/messages'
            }
          ]
        };
      case 'teacher':
        return {
          title: 'Teacher Dashboard',
          subtitle: 'Manage your students and results',
          cards: [
            {
              title: 'My Students',
              value: stats.totalStudents,
              icon: AcademicCapIcon,
              color: 'primary',
              link: '/teacher/students'
            },
            {
              title: 'Results Uploaded',
              value: stats.totalResults,
              icon: ChartBarIcon,
              color: 'success',
              link: '/teacher/results'
            },
            {
              title: 'Messages',
              value: stats.totalMessages,
              icon: BellIcon,
              color: 'secondary',
              link: '/teacher/messages'
            }
          ]
        };
      case 'student':
        return {
          title: 'Student Dashboard',
          subtitle: 'View your academic progress and announcements',
          cards: [
            {
              title: 'My Results',
              value: stats.totalResults,
              icon: ChartBarIcon,
              color: 'primary',
              link: '/student/results'
            },
            {
              title: 'Unread Messages',
              value: stats.unreadMessages || 0,
              icon: BellIcon,
              color: 'warning',
              link: '/student/messages'
            }
          ]
        };
      case 'parent':
        return {
          title: 'Parent Dashboard',
          subtitle: 'Monitor your children\'s academic performance',
          cards: [
            {
              title: 'My Children',
              value: stats.totalStudents,
              icon: AcademicCapIcon,
              color: 'primary',
              link: '/parent/children'
            },
            {
              title: 'Results Available',
              value: stats.totalResults,
              icon: ChartBarIcon,
              color: 'success',
              link: '/parent/results'
            },
            {
              title: 'Unread Messages',
              value: stats.unreadMessages || 0,
              icon: BellIcon,
              color: 'warning',
              link: '/parent/messages'
            }
          ]
        };
      default:
        return {
          title: 'Dashboard',
          subtitle: 'Welcome to School Management System',
          cards: []
        };
    }
  };

  const content = getRoleBasedContent();

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
        <h1 className="text-3xl font-bold text-gray-900">{content.title}</h1>
        <p className="text-gray-600 mt-2">{content.subtitle}</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        {content.cards.map((card, index) => {
          const Icon = card.icon;
          return (
            <button
              key={index}
              onClick={() => navigate(card.link)}
              className="card hover:shadow-md transition-shadow cursor-pointer group"
            >
              <div className="flex items-center">
                <div className={`
                  p-3 rounded-full mr-4
                  ${card.color === 'primary' ? 'bg-primary-100' : ''}
                  ${card.color === 'success' ? 'bg-success-100' : ''}
                  ${card.color === 'warning' ? 'bg-warning-100' : ''}
                  ${card.color === 'secondary' ? 'bg-secondary-100' : ''}
                `}>
                  <Icon className={`
                    h-6 w-6
                    ${card.color === 'primary' ? 'text-primary-600' : ''}
                    ${card.color === 'success' ? 'text-success-600' : ''}
                    ${card.color === 'warning' ? 'text-warning-600' : ''}
                    ${card.color === 'secondary' ? 'text-secondary-600' : ''}
                  `} />
                </div>
                <div className="flex-1 text-left">
                  <p className="text-sm font-medium text-gray-600">{card.title}</p>
                  <p className="text-2xl font-bold text-gray-900">{card.value}</p>
                </div>
              </div>
              <div className="mt-4 text-xs text-gray-500 group-hover:text-primary-600 transition-colors">
                View details →
              </div>
            </button>
          );
        })}
      </div>

      {/* Quick Actions */}
      <div className="card">
        <h2 className="text-xl font-semibold text-gray-900 mb-4">Quick Actions</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {user?.role === 'admin' && (
            <>
              <button
                onClick={() => navigate('/admin/users?action=create')}
                className="p-4 border border-gray-200 rounded-lg hover:bg-gray-50 text-left"
              >
                <h3 className="font-medium text-gray-900">Create New User</h3>
                <p className="text-sm text-gray-600 mt-1">Add students, parents, or teachers</p>
              </button>
              <button
                onClick={() => navigate('/admin/messages?action=create')}
                className="p-4 border border-gray-200 rounded-lg hover:bg-gray-50 text-left"
              >
                <h3 className="font-medium text-gray-900">Send Announcement</h3>
                <p className="text-sm text-gray-600 mt-1">Broadcast messages to users</p>
              </button>
              <button
                onClick={() => navigate('/admin/results?action=create')}
                className="p-4 border border-gray-200 rounded-lg hover:bg-gray-50 text-left"
              >
                <h3 className="font-medium text-gray-900">Upload Results</h3>
                <p className="text-sm text-gray-600 mt-1">Add academic results</p>
              </button>
            </>
          )}
          {user?.role === 'teacher' && (
            <>
              <button
                onClick={() => navigate('/teacher/results?action=create')}
                className="p-4 border border-gray-200 rounded-lg hover:bg-gray-50 text-left"
              >
                <h3 className="font-medium text-gray-900">Upload Results</h3>
                <p className="text-sm text-gray-600 mt-1">Add student academic results</p>
              </button>
            </>
          )}
          {(user?.role === 'student' || user?.role === 'parent') && (
            <>
              <button
                onClick={() => navigate(user?.role === 'student' ? '/student/results' : '/parent/results')}
                className="p-4 border border-gray-200 rounded-lg hover:bg-gray-50 text-left"
              >
                <h3 className="font-medium text-gray-900">View Results</h3>
                <p className="text-sm text-gray-600 mt-1">Check academic performance</p>
              </button>
              <button
                onClick={() => navigate(user?.role === 'student' ? '/student/messages' : '/parent/messages')}
                className="p-4 border border-gray-200 rounded-lg hover:bg-gray-50 text-left"
              >
                <h3 className="font-medium text-gray-900">View Messages</h3>
                <p className="text-sm text-gray-600 mt-1">Read announcements and updates</p>
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
