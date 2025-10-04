/**
 * Role-based redirection utility
 * Ensures users are redirected only to their assigned dashboard
 */

export const getDashboardPath = (role) => {
  const roleDashboardMap = {
    'admin': '/admin/dashboard',
    'staff1': '/staff1/dashboard',
    'staff2': '/staff2/dashboard',
    'staff3': '/staff3/dashboard',
    'staff4': '/staff4/dashboard',
    'staff5': '/staff5/dashboard'
  };

  return roleDashboardMap[role] || '/admin/login';
};

export const isValidRole = (role) => {
  const validRoles = ['admin', 'staff1', 'staff2', 'staff3', 'staff4', 'staff5'];
  return validRoles.includes(role);
};

export const canAccessDashboard = (userRole, targetRole) => {
  // Admin can access any dashboard
  if (userRole === 'admin') return true;
  
  // Staff can only access their own dashboard
  return userRole === targetRole;
};

export const getRoleDisplayName = (role) => {
  const roleNames = {
    'admin': 'Administrator',
    'staff1': 'Staff 1 - Form Review',
    'staff2': 'Staff 2 - Trustee Validation',
    'staff3': 'Staff 3 - Land Verification',
    'staff4': 'Staff 4 - Approval & Review',
    'staff5': 'Staff 5 - Final Approval'
  };

  return roleNames[role] || 'Unknown Role';
};
