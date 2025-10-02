"use client";
import React, { createContext, useContext, useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';

const AuthContext = createContext();

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [token, setToken] = useState(null);
  const router = useRouter();

  // Check if user is authenticated on mount
  useEffect(() => {
    const checkAuth = async () => {
      try {
        // Check for token in multiple possible locations
        const storedToken = localStorage.getItem('authToken') || localStorage.getItem('access_token');
        const isAuth = localStorage.getItem('is_auth');
        
        if (storedToken && isAuth === 'true') {
          setToken(storedToken);
          
          // Try to fetch profile, if it fails, use stored user data
          try {
            await fetchUserProfile(storedToken);
          } catch (profileError) {
            console.log('Profile fetch failed, using stored user data. Error:', profileError.message);
            // Fallback to stored user data
            const storedUser = {
              id: localStorage.getItem('user_id'),
              name: localStorage.getItem('user_name'),
              email: localStorage.getItem('user_email'),
              role: localStorage.getItem('user_role') || localStorage.getItem('role'),
              department: localStorage.getItem('user_department'),
              employeeId: localStorage.getItem('user_employeeId')
            };
            
            if (storedUser.id && storedUser.role) {
              setUser(storedUser);
              console.log('Using stored user data:', storedUser);
            } else {
              console.log('No valid stored user data found, clearing auth');
              // Clear invalid auth data
              localStorage.removeItem('authToken');
              localStorage.removeItem('access_token');
              localStorage.removeItem('is_auth');
              setToken(null);
              setUser(null);
            }
          }
        }
      } catch (error) {
        console.error('Auth check failed:', error);
        localStorage.removeItem('authToken');
        localStorage.removeItem('access_token');
      } finally {
        setLoading(false);
      }
    };

    checkAuth();
  }, []);

  // Fetch user profile
  const fetchUserProfile = async (authToken) => {
    try {
      const API_BASE = process.env.NEXT_PUBLIC_API_BASE || 'http://localhost:4001';
      const response = await fetch(`${API_BASE}/api/auth/profile`, {
        headers: {
          'Authorization': `Bearer ${authToken}`,
          'Content-Type': 'application/json'
        }
      });

      if (response.ok) {
        const data = await response.json();
        setUser(data.data.user);
      } else {
        throw new Error('Failed to fetch profile');
      }
    } catch (error) {
      console.error('Profile fetch failed:', error);
      throw error;
    }
  };

  // Login function
  const login = async (email, password) => {
    try {
      setLoading(true);
      const API_BASE = process.env.NEXT_PUBLIC_API_BASE || 'http://localhost:4001';
      const response = await fetch(`${API_BASE}/api/auth/login`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ email, password })
      });

      const data = await response.json();

      if (data.success) {
        const { token: authToken, user: userData } = data.data;
        setToken(authToken);
        setUser(userData);
        localStorage.setItem('authToken', authToken);
        
        // Also set legacy localStorage items for compatibility
        localStorage.setItem('access_token', authToken);
        localStorage.setItem('role', userData.role);
        localStorage.setItem('is_auth', 'true');
        localStorage.setItem('user_id', userData.id);
        localStorage.setItem('user_email', userData.email);
        localStorage.setItem('user_name', userData.name);
        
        return { success: true, user: userData };
      } else {
        return { success: false, message: data.message };
      }
    } catch (error) {
      console.error('Login failed:', error);
      return { success: false, message: 'Login failed' };
    } finally {
      setLoading(false);
    }
  };

  // Logout function
  const logout = async () => {
    try {
      if (token) {
        const API_BASE = process.env.NEXT_PUBLIC_API_BASE || 'http://localhost:4001';
        await fetch(`${API_BASE}/api/auth/logout`, {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          }
        });
      }
    } catch (error) {
      console.error('Logout request failed:', error);
    } finally {
      setUser(null);
      setToken(null);
      localStorage.removeItem('authToken');
      // Also clear legacy localStorage items
      localStorage.removeItem('access_token');
      localStorage.removeItem('role');
      localStorage.removeItem('is_auth');
      localStorage.removeItem('user_id');
      localStorage.removeItem('user_email');
      localStorage.removeItem('user_name');
      router.push('/admin/login');
    }
  };

  // Check if user has specific role
  const hasRole = (role) => {
    return user?.role === role;
  };

  // Check if user has any of the specified roles
  const hasAnyRole = (roles) => {
    return roles.includes(user?.role);
  };

  // Check if user has specific permission
  const hasPermission = (permission) => {
    return user?.permissions?.includes(permission);
  };

  // Get role display name
  const getRoleDisplayName = (role) => {
    const roleNames = {
      staff1: 'Form Review & Stamp Calculation',
      staff2: 'Trustee Details Validation',
      staff3: 'Land/Plot Details Verification',
      staff4: 'Approval & Review',
      staff5: 'Final Approval & Lock',
      admin: 'Administrator'
    };
    return roleNames[role] || role;
  };

  // Check if user can access form
  const canAccessForm = (form) => {
    if (!user || !form) return false;
    
    const { role } = user;
    const approvals = form.approvals;

    switch (role) {
      case 'staff1':
        return !approvals?.staff1?.approved;
      case 'staff2':
        return approvals?.staff1?.approved && !approvals?.staff2?.approved;
      case 'staff3':
        return approvals?.staff1?.approved && !approvals?.staff3?.approved;
      case 'staff4':
        return approvals?.staff1?.approved && 
               approvals?.staff2?.approved && 
               approvals?.staff3?.approved && 
               !approvals?.staff4?.approved;
      case 'staff5':
        return approvals?.staff4?.approved && !approvals?.staff5?.approved;
      default:
        return false;
    }
  };

  // Get API headers with auth token
  const getAuthHeaders = () => {
    return {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json'
    };
  };

  const value = {
    user,
    token,
    loading,
    login,
    logout,
    hasRole,
    hasAnyRole,
    hasPermission,
    getRoleDisplayName,
    canAccessForm,
    getAuthHeaders
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};
