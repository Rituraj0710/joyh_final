"use client"
import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useGetUserQuery } from '@/lib/services/auth';
import PrivateRoute from '@/components/PrivateRoute';
import UserFormsDashboard from '@/components/UserFormsDashboard';
import UserFormsHistory from '@/components/UserFormsHistory';

const UserDashboard = () => {
  const [user, setUser] = useState({});
  const { data, isSuccess } = useGetUserQuery();

  useEffect(() => {
    if (data && isSuccess) {
      setUser(data.user);
    } else if (typeof window !== 'undefined') {
      const name = localStorage.getItem('user_name');
      const email = localStorage.getItem('user_email');
      const id = localStorage.getItem('user_id');
      const role = localStorage.getItem('role');
      setUser({ name, email, _id: id, role });
    }
  }, [data, isSuccess]);

  const getRoleDescription = (role) => {
    const descriptions = {
      normal_user: 'Regular User - Fill forms and upload documents',
      agent_user: 'Agent - Assist users and verify data'
    };
    return descriptions[role] || 'User';
  };

  const handleLogout = () => {
    // Clear localStorage
    localStorage.removeItem('access_token');
    localStorage.removeItem('role');
    localStorage.removeItem('user_name');
    localStorage.removeItem('is_auth');
    
    // Redirect to login
    window.location.href = '/user/login';
  };

  const getAvailableForms = (role) => {
    const forms = [
      { name: 'Sale Deed', path: '/sale-deed', description: 'Create property sale deed documents' },
      { name: 'Will Deed', path: '/will-deed', description: 'Create will and testament documents' },
      { name: 'Trust Deed', path: '/trust-deed', description: 'Create trust deed documents' },
      { name: 'Property Registration', path: '/property-registration', description: 'Register property documents' },
      { name: 'Power of Attorney', path: '/power-of-attorney', description: 'Create power of attorney documents' },
      { name: 'Adoption Deed', path: '/adoption-deed', description: 'Create adoption deed documents' }
    ];

    // user2 (agent) has access to all forms, user1 has access to all forms too
    return forms;
  };

  const handleLogout = () => {
    localStorage.removeItem('access_token');
    localStorage.removeItem('refresh_token');
    localStorage.removeItem('role');
    localStorage.removeItem('name');
    localStorage.removeItem('is_auth');
    localStorage.removeItem('user_name');
    localStorage.removeItem('user_email');
    localStorage.removeItem('user_id');
    window.location.href = '/user/login';
  };

  return (
    <PrivateRoute allowedRoles={['normal_user', 'agent_user']}>
      <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-6">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">
                Welcome, {user.name}
              </h1>
              <p className="text-gray-600">{getRoleDescription(user.role)}</p>
            </div>
            <div className="flex items-center space-x-4">
              <div className="text-right">
                <p className="text-sm text-gray-500">Account Type</p>
                <p className="text-sm font-medium text-blue-600">
                  {user.role?.toUpperCase()}
                </p>
              </div>
              <button
                onClick={handleLogout}
                className="bg-red-600 text-white px-4 py-2 rounded-md hover:bg-red-700 transition-colors"
              >
                Logout
              </button>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Quick Stats */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
                  <span className="text-blue-600 text-sm font-bold">📋</span>
                </div>
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-500">Available Forms</p>
                <p className="text-2xl font-bold text-gray-900">
                  {getAvailableForms(user.role).length}
                </p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <div className="w-8 h-8 bg-green-100 rounded-full flex items-center justify-center">
                  <span className="text-green-600 text-sm font-bold">✅</span>
                </div>
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-500">Completed Forms</p>
                <p className="text-2xl font-bold text-gray-900">0</p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <div className="w-8 h-8 bg-yellow-100 rounded-full flex items-center justify-center">
                  <span className="text-yellow-600 text-sm font-bold">⏳</span>
                </div>
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-500">Pending Forms</p>
                <p className="text-2xl font-bold text-gray-900">0</p>
              </div>
            </div>
          </div>
        </div>

        {/* Available Forms */}
        <div className="bg-white rounded-lg shadow">
          <div className="px-6 py-4 border-b border-gray-200">
            <h2 className="text-lg font-medium text-gray-900">
              Available Forms
            </h2>
            <p className="text-sm text-gray-500">
              Choose a form to create and submit your documents
            </p>
          </div>

          <div className="p-6">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {getAvailableForms(user.role).map((form, index) => (
                <Link
                  key={index}
                  href={form.path}
                  className="block p-6 border border-gray-200 rounded-lg hover:border-blue-300 hover:shadow-md transition-all duration-200"
                >
                  <div className="flex items-center mb-4">
                    <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
                      <span className="text-blue-600 text-lg">📄</span>
                    </div>
                    <h3 className="ml-3 text-lg font-medium text-gray-900">
                      {form.name}
                    </h3>
                  </div>
                  <p className="text-sm text-gray-600 mb-4">
                    {form.description}
                  </p>
                  <div className="flex items-center text-blue-600 text-sm font-medium">
                    Create Form
                    <svg className="ml-1 w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                    </svg>
                  </div>
                </Link>
              ))}
            </div>
          </div>
        </div>

        {/* My Forms Dashboard */}
        <div className="mt-8">
          <UserFormsDashboard />
        </div>

        {/* My Forms History */}
        <div className="mt-8">
          <UserFormsHistory />
        </div>

        {/* Recent Activity */}
        <div className="mt-8 bg-white rounded-lg shadow">
          <div className="px-6 py-4 border-b border-gray-200">
            <h2 className="text-lg font-medium text-gray-900">
              Recent Activity
            </h2>
          </div>
          <div className="p-6">
            <div className="text-center py-8">
              <div className="text-gray-400 text-4xl mb-4">📝</div>
              <p className="text-gray-500">No recent activity</p>
              <p className="text-sm text-gray-400 mt-1">
                Start by creating your first form
              </p>
            </div>
          </div>
        </div>

        {/* Quick Actions */}
        <div className="mt-8 bg-white rounded-lg shadow">
          <div className="px-6 py-4 border-b border-gray-200">
            <h2 className="text-lg font-medium text-gray-900">
              Quick Actions
            </h2>
          </div>
          <div className="p-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Link
                href="/user/profile"
                className="flex items-center p-4 border border-gray-200 rounded-lg hover:border-blue-300 hover:shadow-md transition-all duration-200"
              >
                <div className="w-8 h-8 bg-gray-100 rounded-lg flex items-center justify-center">
                  <span className="text-gray-600 text-sm">👤</span>
                </div>
                <div className="ml-3">
                  <p className="text-sm font-medium text-gray-900">View Profile</p>
                  <p className="text-xs text-gray-500">Manage your account settings</p>
                </div>
              </Link>

              <Link
                href="/user/change-password"
                className="flex items-center p-4 border border-gray-200 rounded-lg hover:border-blue-300 hover:shadow-md transition-all duration-200"
              >
                <div className="w-8 h-8 bg-gray-100 rounded-lg flex items-center justify-center">
                  <span className="text-gray-600 text-sm">🔒</span>
                </div>
                <div className="ml-3">
                  <p className="text-sm font-medium text-gray-900">Change Password</p>
                  <p className="text-xs text-gray-500">Update your password</p>
                </div>
              </Link>
            </div>
          </div>
        </div>
      </div>
      </div>
    </PrivateRoute>
  );
};

export default UserDashboard;
