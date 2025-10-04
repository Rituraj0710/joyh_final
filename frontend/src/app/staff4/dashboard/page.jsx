"use client";
import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useAuth } from '@/contexts/AuthContext';

export default function Staff4Dashboard() {
  const [stats, setStats] = useState({
    pendingCrossVerification: 0,
    formsVerified: 0,
    formsCorrected: 0,
    formsRejected: 0,
    workReportsSubmitted: 0,
    todayTasks: 0,
    weeklyProgress: 0
  });
  const [recentForms, setRecentForms] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const { getAuthHeaders, user } = useAuth();

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    try {
      setLoading(true);
      const API_BASE = process.env.NEXT_PUBLIC_API_BASE || 'http://localhost:4001';
      
      // Fetch dashboard stats
      const statsResponse = await fetch(`${API_BASE}/api/staff/4/dashboard-stats`, {
        headers: getAuthHeaders()
      });

      if (statsResponse.ok) {
        const statsData = await statsResponse.json();
        setStats(statsData.data || stats);
      }

      // Fetch recent forms
      const formsResponse = await fetch(`${API_BASE}/api/staff/4/forms?limit=5`, {
        headers: getAuthHeaders()
      });

      if (formsResponse.ok) {
        const formsData = await formsResponse.json();
        setRecentForms(formsData.data?.forms || []);
      }

    } catch (error) {
      console.error('Error fetching dashboard data:', error);
      setError(error.message);
    } finally {
      setLoading(false);
    }
  };

  const dashboardCards = [
    {
      title: 'Pending Cross Verification',
      value: stats.pendingCrossVerification,
      icon: '🔍',
      color: 'purple',
      href: '/staff4/forms/pending'
    },
    {
      title: 'Forms Verified',
      value: stats.formsVerified,
      icon: '✅',
      color: 'green',
      href: '/staff4/forms/verified'
    },
    {
      title: 'Forms Corrected',
      value: stats.formsCorrected,
      icon: '✏️',
      color: 'yellow',
      href: '/staff4/forms'
    },
    {
      title: 'Forms Rejected',
      value: stats.formsRejected,
      icon: '❌',
      color: 'red',
      href: '/staff4/forms'
    },
    {
      title: 'Verification Reports',
      value: stats.workReportsSubmitted,
      icon: '📋',
      color: 'indigo',
      href: '/staff4/reports'
    },
    {
      title: 'Today\'s Tasks',
      value: stats.todayTasks,
      icon: '📅',
      color: 'blue',
      href: '/staff4/forms'
    }
  ];

  const getColorClasses = (color) => {
    const colors = {
      purple: 'bg-purple-50 text-purple-600 border-purple-200',
      green: 'bg-green-50 text-green-600 border-green-200',
      yellow: 'bg-yellow-50 text-yellow-600 border-yellow-200',
      red: 'bg-red-50 text-red-600 border-red-200',
      indigo: 'bg-indigo-50 text-indigo-600 border-indigo-200',
      blue: 'bg-blue-50 text-blue-600 border-blue-200'
    };
    return colors[color] || colors.purple;
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading Staff4 Dashboard...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-6">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">
                Staff4 Dashboard
              </h1>
              <p className="text-gray-600">Welcome, {user?.name} - Cross-Verification & Review</p>
            </div>
            <div className="flex items-center space-x-4">
              <div className="text-right">
                <p className="text-sm text-gray-500">Role</p>
                <p className="text-sm font-medium text-purple-600">
                  STAFF4
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Role Description */}
        <div className="bg-gradient-to-r from-purple-50 to-indigo-50 rounded-lg shadow p-6 mb-8">
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <div className="w-12 h-12 bg-purple-100 rounded-full flex items-center justify-center">
                <span className="text-purple-600 text-xl">🔍</span>
              </div>
            </div>
            <div className="ml-4">
              <h3 className="text-lg font-medium text-gray-900">Staff4 Responsibilities</h3>
              <p className="text-sm text-gray-600">
                Cross-verify all work completed by Staff1, Staff2, and Staff3. Review entire forms, 
                make corrections across all sections, and ensure final quality before approval.
              </p>
            </div>
          </div>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
          {dashboardCards.map((card, index) => (
            <Link
              key={index}
              href={card.href}
              className="bg-white rounded-lg shadow hover:shadow-md transition-shadow duration-200 p-6 border-l-4 border-purple-500"
            >
              <div className="flex items-center">
                <div className="flex-shrink-0">
                  <div className={`w-12 h-12 rounded-lg flex items-center justify-center ${getColorClasses(card.color)}`}>
                    <span className="text-2xl">{card.icon}</span>
                  </div>
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-500">{card.title}</p>
                  <p className="text-2xl font-bold text-gray-900">{card.value}</p>
                </div>
              </div>
            </Link>
          ))}
        </div>

        {/* Quick Actions */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
          <div className="bg-white rounded-lg shadow p-6">
            <h3 className="text-lg font-medium text-gray-900 mb-4">Quick Actions</h3>
            <div className="space-y-3">
              <Link
                href="/staff4/forms/pending"
                className="flex items-center p-3 bg-purple-50 hover:bg-purple-100 rounded-lg transition-colors"
              >
                <span className="text-purple-600 mr-3">🔍</span>
                <span className="text-sm font-medium text-gray-900">Start Cross Verification</span>
              </Link>
              <Link
                href="/staff4/forms"
                className="flex items-center p-3 bg-blue-50 hover:bg-blue-100 rounded-lg transition-colors"
              >
                <span className="text-blue-600 mr-3">📝</span>
                <span className="text-sm font-medium text-gray-900">Review All Forms</span>
              </Link>
              <Link
                href="/staff4/reports"
                className="flex items-center p-3 bg-indigo-50 hover:bg-indigo-100 rounded-lg transition-colors"
              >
                <span className="text-indigo-600 mr-3">📋</span>
                <span className="text-sm font-medium text-gray-900">Submit Verification Report</span>
              </Link>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow p-6">
            <h3 className="text-lg font-medium text-gray-900 mb-4">Recent Forms</h3>
            {recentForms.length > 0 ? (
              <div className="space-y-3">
                {recentForms.map((form, index) => (
                  <div key={index} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                    <div>
                      <p className="text-sm font-medium text-gray-900">{form.formType || 'Form'}</p>
                      <p className="text-xs text-gray-500">ID: {form._id}</p>
                    </div>
                    <span className={`px-2 py-1 text-xs rounded-full ${
                      form.status === 'verified' ? 'bg-green-100 text-green-800' :
                      form.status === 'pending' ? 'bg-yellow-100 text-yellow-800' :
                      form.status === 'rejected' ? 'bg-red-100 text-red-800' :
                      'bg-gray-100 text-gray-800'
                    }`}>
                      {form.status || 'Pending'}
                    </span>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-sm text-gray-500">No recent forms</p>
            )}
          </div>
        </div>

        {/* Cross-Verification Tools */}
        <div className="mt-8 bg-white rounded-lg shadow">
          <div className="px-6 py-4 border-b border-gray-200">
            <h2 className="text-lg font-medium text-gray-900">
              Cross-Verification Tools
            </h2>
            <p className="text-sm text-gray-500">
              Specialized tools for comprehensive form verification and correction
            </p>
          </div>
          <div className="p-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="p-4 border border-gray-200 rounded-lg">
                <div className="flex items-center mb-3">
                  <div className="w-8 h-8 bg-purple-100 rounded-lg flex items-center justify-center">
                    <span className="text-purple-600 text-sm">🔍</span>
                  </div>
                  <h3 className="ml-3 text-sm font-medium text-gray-900">Cross-Verification Engine</h3>
                </div>
                <p className="text-xs text-gray-600">
                  Review and verify all sections verified by Staff1, Staff2, and Staff3.
                </p>
              </div>

              <div className="p-4 border border-gray-200 rounded-lg">
                <div className="flex items-center mb-3">
                  <div className="w-8 h-8 bg-blue-100 rounded-lg flex items-center justify-center">
                    <span className="text-blue-600 text-sm">✏️</span>
                  </div>
                  <h3 className="ml-3 text-sm font-medium text-gray-900">Form Editor</h3>
                </div>
                <p className="text-xs text-gray-600">
                  Edit and correct any mistakes found in previous staff verifications.
                </p>
              </div>

              <div className="p-4 border border-gray-200 rounded-lg">
                <div className="flex items-center mb-3">
                  <div className="w-8 h-8 bg-green-100 rounded-lg flex items-center justify-center">
                    <span className="text-green-600 text-sm">✅</span>
                  </div>
                  <h3 className="ml-3 text-sm font-medium text-gray-900">Final Verification</h3>
                </div>
                <p className="text-xs text-gray-600">
                  Mark sections as "Final Verified" after corrections are complete.
                </p>
              </div>

              <div className="p-4 border border-gray-200 rounded-lg">
                <div className="flex items-center mb-3">
                  <div className="w-8 h-8 bg-indigo-100 rounded-lg flex items-center justify-center">
                    <span className="text-indigo-600 text-sm">📊</span>
                  </div>
                  <h3 className="ml-3 text-sm font-medium text-gray-900">Quality Metrics</h3>
                </div>
                <p className="text-xs text-gray-600">
                  Track verification quality and identify patterns in corrections.
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
