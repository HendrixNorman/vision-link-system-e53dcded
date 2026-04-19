import React, { useEffect, useState } from 'react';
import { Routes, Route, useNavigate } from 'react-router-dom';
import { resultsAPI, messagesAPI } from '../../services/api';
import { Result, Message } from '../../types';
import { ChartBarIcon, BellIcon, AcademicCapIcon } from '@heroicons/react/24/outline';

const StudentDashboard: React.FC = () => {
  const navigate = useNavigate();
  const [stats, setStats] = useState({
    totalResults: 0,
    unreadMessages: 0,
    averageScore: 0,
  });
  const [recentResults, setRecentResults] = useState<Result[]>([]);
  const [recentMessages, setRecentMessages] = useState<Message[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [resultsResponse, messagesResponse, unreadResponse] = await Promise.all([
          resultsAPI.getResults({ limit: 5 }),
          messagesAPI.getMessages({ limit: 5 }),
          messagesAPI.getUnreadCount(),
        ]);

        setStats({
          totalResults: resultsResponse.data?.pagination?.totalResults || 0,
          unreadMessages: unreadResponse.data?.unreadCount || 0,
          averageScore: 0, // Would calculate from actual results
        });

        setRecentResults(resultsResponse.data?.results || []);
        setRecentMessages(messagesResponse.data?.messages || []);
      } catch (error) {
        console.error('Error fetching student data:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
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
        <h1 className="text-3xl font-bold text-gray-900">Student Dashboard</h1>
        <p className="text-gray-600 mt-2">View your academic progress and announcements</p>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <div 
          className="card hover:shadow-md transition-shadow cursor-pointer"
          onClick={() => navigate('/student/results')}
        >
          <div className="flex items-center">
            <div className="bg-primary-100 p-3 rounded-full mr-4">
              <ChartBarIcon className="h-6 w-6 text-primary-600" />
            </div>
            <div>
              <p className="text-sm font-medium text-gray-600">My Results</p>
              <p className="text-2xl font-bold text-gray-900">{stats.totalResults}</p>
            </div>
          </div>
        </div>

        <div 
          className="card hover:shadow-md transition-shadow cursor-pointer"
          onClick={() => navigate('/student/messages')}
        >
          <div className="flex items-center">
            <div className="bg-warning-100 p-3 rounded-full mr-4">
              <BellIcon className="h-6 w-6 text-warning-600" />
            </div>
            <div>
              <p className="text-sm font-medium text-gray-600">Unread Messages</p>
              <p className="text-2xl font-bold text-gray-900">{stats.unreadMessages}</p>
            </div>
          </div>
        </div>

        <div className="card">
          <div className="flex items-center">
            <div className="bg-success-100 p-3 rounded-full mr-4">
              <AcademicCapIcon className="h-6 w-6 text-success-600" />
            </div>
            <div>
              <p className="text-sm font-medium text-gray-600">Average Score</p>
              <p className="text-2xl font-bold text-gray-900">{stats.averageScore}%</p>
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Recent Results */}
        <div className="card">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-semibold text-gray-900">Recent Results</h2>
            <button
              onClick={() => navigate('/student/results')}
              className="text-primary-600 hover:text-primary-700 text-sm font-medium"
            >
              View All
            </button>
          </div>
          <div className="space-y-3">
            {recentResults.length > 0 ? (
              recentResults.map((result) => (
                <div key={result._id} className="border border-gray-200 rounded-lg p-4 hover:bg-gray-50">
                  <div className="flex justify-between items-start">
                    <div>
                      <p className="font-medium text-gray-900">{result.term}</p>
                      <p className="text-sm text-gray-600">{result.academicYear}</p>
                    </div>
                    <div className="text-right">
                      <p className="text-lg font-bold text-primary-600">{result.averageScore}%</p>
                      <p className="text-xs text-gray-500">{result.subjects.length} subjects</p>
                    </div>
                  </div>
                </div>
              ))
            ) : (
              <div className="text-center py-8 text-gray-500">
                <ChartBarIcon className="h-12 w-12 mx-auto mb-3 text-gray-400" />
                <p>No results available yet</p>
              </div>
            )}
          </div>
        </div>

        {/* Recent Messages */}
        <div className="card">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-semibold text-gray-900">Recent Messages</h2>
            <button
              onClick={() => navigate('/student/messages')}
              className="text-primary-600 hover:text-primary-700 text-sm font-medium"
            >
              View All
            </button>
          </div>
          <div className="space-y-3">
            {recentMessages.length > 0 ? (
              recentMessages.map((message) => (
                <div key={message._id} className="border border-gray-200 rounded-lg p-4 hover:bg-gray-50">
                  <div className="flex justify-between items-start">
                    <div className="flex-1">
                      <p className="font-medium text-gray-900">{message.title}</p>
                      <p className="text-sm text-gray-600 mt-1 line-clamp-2">{message.content}</p>
                      <div className="flex items-center mt-2 space-x-4">
                        <span className={`
                          inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium
                          ${message.priority === 'urgent' ? 'bg-error-100 text-error-800' : ''}
                          ${message.priority === 'high' ? 'bg-warning-100 text-warning-800' : ''}
                          ${message.priority === 'medium' ? 'bg-blue-100 text-blue-800' : ''}
                          ${message.priority === 'low' ? 'bg-gray-100 text-gray-800' : ''}
                        `}>
                          {message.priority}
                        </span>
                        <span className="text-xs text-gray-500">
                          {new Date(message.createdAt).toLocaleDateString()}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              ))
            ) : (
              <div className="text-center py-8 text-gray-500">
                <BellIcon className="h-12 w-12 mx-auto mb-3 text-gray-400" />
                <p>No messages available</p>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Quick Actions */}
      <div className="card mt-6">
        <h2 className="text-xl font-semibold text-gray-900 mb-4">Quick Actions</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <button
            onClick={() => navigate('/student/results')}
            className="p-4 border border-gray-200 rounded-lg hover:bg-gray-50 text-left"
          >
            <h3 className="font-medium text-gray-900">View All Results</h3>
            <p className="text-sm text-gray-600 mt-1">Check your complete academic history</p>
          </button>
          <button
            onClick={() => navigate('/student/messages')}
            className="p-4 border border-gray-200 rounded-lg hover:bg-gray-50 text-left"
          >
            <h3 className="font-medium text-gray-900">View Messages</h3>
            <p className="text-sm text-gray-600 mt-1">Read announcements and updates</p>
          </button>
        </div>
      </div>
    </div>
  );
};

export default StudentDashboard;
