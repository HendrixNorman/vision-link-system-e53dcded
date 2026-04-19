import React, { useState } from 'react';
import { Outlet, Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { 
  HomeIcon, 
  UserGroupIcon, 
  ChartBarIcon, 
  BellIcon,
  Cog6ToothIcon,
  ArrowRightOnRectangleIcon,
  Bars3Icon,
  XMarkIcon,
  AcademicCapIcon,
  UserIcon,
  UsersIcon
} from '@heroicons/react/24/outline';

const Layout: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const getNavigationItems = () => {
    const baseItems = [
      {
        name: 'Dashboard',
        href: '/dashboard',
        icon: HomeIcon,
        current: location.pathname === '/dashboard'
      }
    ];

    if (user?.role === 'admin') {
      baseItems.push(
        {
          name: 'Users',
          href: '/admin/users',
          icon: UserGroupIcon,
          current: location.pathname.startsWith('/admin/users')
        },
        {
          name: 'Students',
          href: '/admin/students',
          icon: AcademicCapIcon,
          current: location.pathname.startsWith('/admin/students')
        },
        {
          name: 'Results',
          href: '/admin/results',
          icon: ChartBarIcon,
          current: location.pathname.startsWith('/admin/results')
        },
        {
          name: 'Messages',
          href: '/admin/messages',
          icon: BellIcon,
          current: location.pathname.startsWith('/admin/messages')
        }
      );
    } else if (user?.role === 'teacher') {
      baseItems.push(
        {
          name: 'Students',
          href: '/teacher/students',
          icon: UsersIcon,
          current: location.pathname.startsWith('/teacher/students')
        },
        {
          name: 'Results',
          href: '/teacher/results',
          icon: ChartBarIcon,
          current: location.pathname.startsWith('/teacher/results')
        },
        {
          name: 'Messages',
          href: '/teacher/messages',
          icon: BellIcon,
          current: location.pathname.startsWith('/teacher/messages')
        }
      );
    } else if (user?.role === 'student') {
      baseItems.push(
        {
          name: 'My Results',
          href: '/student/results',
          icon: ChartBarIcon,
          current: location.pathname.startsWith('/student/results')
        },
        {
          name: 'Messages',
          href: '/student/messages',
          icon: BellIcon,
          current: location.pathname.startsWith('/student/messages')
        }
      );
    } else if (user?.role === 'parent') {
      baseItems.push(
        {
          name: 'Children',
          href: '/parent/children',
          icon: UsersIcon,
          current: location.pathname.startsWith('/parent/children')
        },
        {
          name: 'Results',
          href: '/parent/results',
          icon: ChartBarIcon,
          current: location.pathname.startsWith('/parent/results')
        },
        {
          name: 'Messages',
          href: '/parent/messages',
          icon: BellIcon,
          current: location.pathname.startsWith('/parent/messages')
        }
      );
    }

    return baseItems;
  };

  const navigationItems = getNavigationItems();

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Mobile sidebar backdrop */}
      {sidebarOpen && (
        <div 
          className="fixed inset-0 z-40 bg-gray-600 bg-opacity-75 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Sidebar */}
      <div className={`
        fixed inset-y-0 left-0 z-50 w-64 bg-white shadow-lg transform transition-transform duration-300 ease-in-out lg:translate-x-0 lg:static lg:inset-0
        ${sidebarOpen ? 'translate-x-0' : '-translate-x-full'}
      `}>
        <div className="flex flex-col h-full">
          {/* Logo */}
          <div className="flex items-center justify-between h-16 px-6 border-b border-gray-200">
            <div className="flex items-center">
              <AcademicCapIcon className="h-8 w-8 text-primary-600 mr-3" />
              <h1 className="text-xl font-bold text-gray-900">SchoolMS</h1>
            </div>
            <button
              onClick={() => setSidebarOpen(false)}
              className="lg:hidden p-1 rounded-md text-gray-400 hover:text-gray-500"
            >
              <XMarkIcon className="h-6 w-6" />
            </button>
          </div>

          {/* Navigation */}
          <nav className="flex-1 px-4 py-6 space-y-2">
            {navigationItems.map((item) => {
              const Icon = item.icon;
              return (
                <Link
                  key={item.name}
                  to={item.href}
                  className={`
                    group flex items-center px-3 py-2 text-sm font-medium rounded-lg transition-colors
                    ${item.current
                      ? 'bg-primary-50 text-primary-700 border-r-2 border-primary-700'
                      : 'text-gray-700 hover:bg-gray-50 hover:text-gray-900'
                    }
                  `}
                >
                  <Icon className="mr-3 h-5 w-5" />
                  {item.name}
                </Link>
              );
            })}
          </nav>

          {/* User section */}
          <div className="border-t border-gray-200 p-4">
            <div className="flex items-center mb-4">
              <div className="bg-primary-100 rounded-full p-2 mr-3">
                <UserIcon className="h-5 w-5 text-primary-600" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-gray-900 truncate">
                  {user?.name}
                </p>
                <p className="text-xs text-gray-500 capitalize">
                  {user?.role}
                </p>
              </div>
            </div>
            <div className="space-y-1">
              <Link
                to="/profile"
                className="group flex items-center px-3 py-2 text-sm font-medium rounded-lg text-gray-700 hover:bg-gray-50 hover:text-gray-900"
              >
                <Cog6ToothIcon className="mr-3 h-4 w-4" />
                Settings
              </Link>
              <button
                onClick={handleLogout}
                className="group flex items-center w-full px-3 py-2 text-sm font-medium rounded-lg text-gray-700 hover:bg-gray-50 hover:text-gray-900"
              >
                <ArrowRightOnRectangleIcon className="mr-3 h-4 w-4" />
                Logout
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Main content */}
      <div className="lg:pl-64">
        {/* Top bar */}
        <div className="sticky top-0 z-30 bg-white shadow-sm border-b border-gray-200">
          <div className="flex items-center justify-between h-16 px-4 sm:px-6 lg:px-8">
            <button
              onClick={() => setSidebarOpen(true)}
              className="lg:hidden p-2 rounded-md text-gray-400 hover:text-gray-500"
            >
              <Bars3Icon className="h-6 w-6" />
            </button>
            
            <div className="flex items-center space-x-4">
              <Link
                to="/"
                className="text-sm text-gray-500 hover:text-gray-700"
              >
                Back to Home
              </Link>
            </div>
          </div>
        </div>

        {/* Page content */}
        <main className="p-4 sm:p-6 lg:p-8">
          {children}
        </main>
      </div>
    </div>
  );
};

export default Layout;
