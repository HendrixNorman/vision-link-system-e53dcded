import React from 'react';
import { Link } from 'react-router-dom';
import { 
  AcademicCapIcon, 
  UserGroupIcon, 
  ChartBarIcon, 
  BellIcon 
} from '@heroicons/react/24/outline';

const LandingPage: React.FC = () => {
  return (
    <div className="min-h-screen bg-gradient-to-br from-primary-50 to-white">
      {/* Header */}
      <header className="bg-white shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-6">
            <div className="flex items-center">
              <AcademicCapIcon className="h-8 w-8 text-primary-600 mr-3" />
              <h1 className="text-2xl font-bold text-gray-900">SchoolMS</h1>
            </div>
            <Link 
              to="/login" 
              className="btn btn-primary"
            >
              Login
            </Link>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="relative py-20 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto text-center">
          <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold text-gray-900 mb-6">
            Smart School
            <span className="text-primary-600"> Management System</span>
          </h1>
          <p className="text-xl text-gray-600 mb-8 max-w-3xl mx-auto">
            Comprehensive solution for modern educational institutions. 
            Manage students, track results, send announcements, and streamline administration.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link 
              to="/login" 
              className="btn btn-primary text-lg px-8 py-3"
            >
              Get Started
            </Link>
            <button className="btn btn-secondary text-lg px-8 py-3">
              Request Demo
            </button>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-20 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl font-bold text-gray-900 mb-4">
              Everything You Need to Manage Your School
            </h2>
            <p className="text-xl text-gray-600 max-w-2xl mx-auto">
              Powerful features designed to make school administration efficient and effective.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
            {/* Feature 1 */}
            <div className="text-center">
              <div className="bg-primary-100 rounded-full p-4 w-16 h-16 mx-auto mb-4 flex items-center justify-center">
                <UserGroupIcon className="h-8 w-8 text-primary-600" />
              </div>
              <h3 className="text-xl font-semibold text-gray-900 mb-2">
                User Management
              </h3>
              <p className="text-gray-600">
                Create and manage user accounts with role-based access control for admins, teachers, students, and parents.
              </p>
            </div>

            {/* Feature 2 */}
            <div className="text-center">
              <div className="bg-success-100 rounded-full p-4 w-16 h-16 mx-auto mb-4 flex items-center justify-center">
                <ChartBarIcon className="h-8 w-8 text-success-600" />
              </div>
              <h3 className="text-xl font-semibold text-gray-900 mb-2">
                Online Results
              </h3>
              <p className="text-gray-600">
                Upload and manage academic results. Students and parents can access grades securely online.
              </p>
            </div>

            {/* Feature 3 */}
            <div className="text-center">
              <div className="bg-warning-100 rounded-full p-4 w-16 h-16 mx-auto mb-4 flex items-center justify-center">
                <BellIcon className="h-8 w-8 text-warning-600" />
              </div>
              <h3 className="text-xl font-semibold text-gray-900 mb-2">
                Announcements
              </h3>
              <p className="text-gray-600">
                Send targeted announcements to specific user groups or the entire school community.
              </p>
            </div>

            {/* Feature 4 */}
            <div className="text-center">
              <div className="bg-secondary-100 rounded-full p-4 w-16 h-16 mx-auto mb-4 flex items-center justify-center">
                <AcademicCapIcon className="h-8 w-8 text-secondary-600" />
              </div>
              <h3 className="text-xl font-semibold text-gray-900 mb-2">
                Secure Portals
              </h3>
              <p className="text-gray-600">
                Role-based dashboards ensure users only see information relevant to their role and permissions.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 bg-primary-600">
        <div className="max-w-4xl mx-auto text-center px-4 sm:px-6 lg:px-8">
          <h2 className="text-3xl font-bold text-white mb-4">
            Ready to Transform Your School Management?
          </h2>
          <p className="text-xl text-primary-100 mb-8">
            Join thousands of educational institutions using our platform to streamline operations.
          </p>
          <Link 
            to="/login" 
            className="bg-white text-primary-600 px-8 py-3 rounded-lg font-semibold hover:bg-gray-100 transition-colors"
          >
            Start Free Trial
          </Link>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-gray-900 text-white py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center">
            <div className="flex items-center justify-center mb-4">
              <AcademicCapIcon className="h-8 w-8 text-primary-400 mr-3" />
              <h3 className="text-2xl font-bold">SchoolMS</h3>
            </div>
            <p className="text-gray-400 mb-4">
              Smart School Management System
            </p>
            <p className="text-gray-500 text-sm">
              © 2024 School Management System. All rights reserved.
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default LandingPage;
