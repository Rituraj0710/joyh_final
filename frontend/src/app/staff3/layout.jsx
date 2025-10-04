"use client";
import React, { useCallback, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import Staff3PrivateRoute from "@/components/Staff3PrivateRoute";
import { useAuth } from "@/contexts/AuthContext";

const staff3NavItems = [
  { href: "/staff3/dashboard", label: "Dashboard", icon: "🏠" },
  { href: "/staff3/forms", label: "Land Verification", icon: "🏞️" },
  { href: "/staff3/forms/plot-details", label: "Plot Details", icon: "📐" },
  { href: "/staff3/forms/completed", label: "Completed Verifications", icon: "✅" },
  { href: "/staff3/work-report", label: "Work Report", icon: "📋" }
];

export default function Staff3Layout({ children }) {
  const pathname = usePathname();
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const { logout, user } = useAuth();

  const handleLogout = useCallback(async () => {
    try {
      await logout();
    } catch (error) {
      console.error('Logout error:', error);
      // Force logout even if API fails
      if (typeof window !== 'undefined') {
        localStorage.clear();
        window.location.href = '/admin/login';
      }
    }
  }, [logout]);

  // Render login page without staff3 chrome or auth guard
  if (pathname === '/staff3/login') {
    return (
      <div className="min-h-screen">{children}</div>
    );
  }

  return (
    <Staff3PrivateRoute>
      <div className="min-h-screen bg-gray-50">
        {/* Sidebar */}
        <div className={`fixed inset-y-0 left-0 z-50 w-64 bg-white shadow-lg transform transition-transform duration-300 ease-in-out ${
          isSidebarOpen ? 'translate-x-0' : '-translate-x-full'
        } lg:translate-x-0`}>
          <div className="flex items-center justify-between h-16 px-6 border-b border-gray-200">
            <div className="flex items-center">
              <div className="w-8 h-8 bg-yellow-600 rounded-lg flex items-center justify-center">
                <span className="text-white text-sm font-bold">S3</span>
              </div>
              <h1 className="ml-3 text-lg font-semibold text-gray-900">Staff3 Panel</h1>
            </div>
            <button
              onClick={() => setIsSidebarOpen(false)}
              className="lg:hidden text-gray-500 hover:text-gray-700"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>

          <nav className="mt-6 px-3">
            <div className="space-y-1">
              {staff3NavItems.map((item) => (
                <Link
                  key={item.href}
                  href={item.href}
                  className={`flex items-center px-3 py-2 text-sm font-medium rounded-md transition-colors ${
                    pathname === item.href
                      ? 'bg-yellow-100 text-yellow-700 border-r-2 border-yellow-600'
                      : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
                  }`}
                >
                  <span className="mr-3 text-lg">{item.icon}</span>
                  {item.label}
                </Link>
              ))}
            </div>
          </nav>

          {/* User info and logout */}
          <div className="absolute bottom-0 left-0 right-0 p-4 border-t border-gray-200">
            <div className="flex items-center mb-3">
              <div className="w-8 h-8 bg-yellow-100 rounded-full flex items-center justify-center">
                <span className="text-yellow-600 text-sm font-medium">
                  {user?.name?.charAt(0) || 'S'}
                </span>
              </div>
              <div className="ml-3">
                <p className="text-sm font-medium text-gray-900">{user?.name || 'Staff3 User'}</p>
                <p className="text-xs text-yellow-600">Land/Plot Details Verification</p>
              </div>
            </div>
            <button
              onClick={handleLogout}
              className="w-full flex items-center px-3 py-2 text-sm text-red-600 hover:bg-red-50 rounded-md transition-colors"
            >
              <span className="mr-2">🚪</span>
              Logout
            </button>
          </div>
        </div>

        {/* Mobile sidebar overlay */}
        {isSidebarOpen && (
          <div
            className="fixed inset-0 z-40 bg-black bg-opacity-50 lg:hidden"
            onClick={() => setIsSidebarOpen(false)}
          />
        )}

        {/* Main content */}
        <div className="lg:ml-64">
          {/* Top bar */}
          <div className="bg-white shadow-sm border-b border-gray-200">
            <div className="flex items-center justify-between h-16 px-4 sm:px-6 lg:px-8">
              <div className="flex items-center">
                <button
                  onClick={() => setIsSidebarOpen(true)}
                  className="lg:hidden text-gray-500 hover:text-gray-700"
                >
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                  </svg>
                </button>
                <h2 className="ml-2 text-lg font-semibold text-gray-900">
                  Land/Plot Details Verification
                </h2>
              </div>
              
              <div className="flex items-center space-x-4">
                <div className="text-right">
                  <p className="text-sm text-gray-500">Role</p>
                  <p className="text-sm font-medium text-yellow-600">STAFF3</p>
                </div>
              </div>
            </div>
          </div>

          {/* Page content */}
          <main className="flex-1">
            {children}
          </main>
        </div>
      </div>
    </Staff3PrivateRoute>
  );
}
