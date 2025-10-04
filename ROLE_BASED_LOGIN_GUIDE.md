# Role-Based Login System - Implementation Guide

## Overview

This implementation provides a comprehensive role-based authentication system that ensures users are redirected only to their assigned dashboard based on their role. The system includes strict role validation, JWT-based authentication, and protected routes.

## Features

✅ **Role Assignment**: Admin can assign roles (admin, staff1, staff2, staff3, staff4, staff5) to users  
✅ **JWT Authentication**: Secure token-based authentication with role information  
✅ **Automatic Redirection**: Users are automatically redirected to their assigned dashboard  
✅ **Protected Routes**: Role-based access control for all dashboards  
✅ **Role Validation**: Strict validation to prevent unauthorized access  
✅ **Audit Logging**: Complete audit trail of all login attempts and actions  

## File Structure

### Frontend Components
```
frontend/src/
├── contexts/
│   └── EnhancedAuthContext.jsx          # Enhanced authentication context
├── components/
│   ├── EnhancedProtectedRoute.jsx       # Role-based route protection
│   └── RoleBasedDashboard.jsx          # Dashboard wrappers for each role
├── utils/
│   └── roleRedirect.js                 # Role redirection utilities
└── app/
    └── admin/
        └── login/
            └── enhanced-page.jsx       # Enhanced login page
```

### Backend Components
```
server/
├── routes/
│   └── enhancedAuthRoutes.js           # Enhanced authentication routes
├── models/
│   └── User.js                         # User model with role field
└── create-test-users.js               # Test user creation script
```

## Implementation Details

### 1. Role Assignment

Users are assigned roles in the database with the following structure:

```javascript
{
  name: "John Doe",
  email: "john@example.com",
  role: "staff1",  // admin, staff1, staff2, staff3, staff4, staff5
  department: "Form Review",
  employeeId: "STAFF001",
  isActive: true
}
```

### 2. Backend Login API

The enhanced login API returns JWT token with role information:

```javascript
// POST /api/auth/login
{
  "email": "user@example.com",
  "password": "password123"
}

// Response
{
  "success": true,
  "message": "Login successful",
  "data": {
    "token": "jwt_token_here",
    "user": {
      "id": "user_id",
      "name": "User Name",
      "email": "user@example.com",
      "role": "staff1",
      "department": "Form Review",
      "employeeId": "STAFF001"
    }
  }
}
```

### 3. Frontend Authentication

The enhanced AuthContext handles role-based authentication:

```javascript
import { useAuth } from '@/contexts/EnhancedAuthContext';

const { user, login, logout, canAccessRole } = useAuth();

// Login with automatic redirection
const result = await login(email, password);
if (result.success) {
  // User is automatically redirected to their dashboard
  router.push(result.redirectPath);
}
```

### 4. Protected Routes

Use role-specific dashboard wrappers:

```javascript
import { Staff1DashboardWrapper } from '@/components/RoleBasedDashboard';

function Staff1Dashboard() {
  return (
    <Staff1DashboardWrapper>
      {/* Staff1 dashboard content */}
    </Staff1DashboardWrapper>
  );
}
```

## Role Mapping

| Role | Dashboard Path | Description |
|------|----------------|-------------|
| `admin` | `/admin/dashboard` | Full system access |
| `staff1` | `/staff1/dashboard` | Form Review & Stamp Calculation |
| `staff2` | `/staff2/dashboard` | Trustee Details Validation |
| `staff3` | `/staff3/dashboard` | Land/Plot Details Verification |
| `staff4` | `/staff4/dashboard` | Approval & Review |
| `staff5` | `/staff5/dashboard` | Final Approval & Lock |

## Setup Instructions

### 1. Backend Setup

1. **Install Dependencies**:
   ```bash
   cd server
   npm install
   ```

2. **Create Test Users**:
   ```bash
   node create-test-users.js
   ```

3. **Start Server**:
   ```bash
   npm start
   ```

### 2. Frontend Setup

1. **Install Dependencies**:
   ```bash
   cd frontend
   npm install
   ```

2. **Update Layout** (optional):
   ```javascript
   // In app/layout.jsx, replace AuthProvider import
   import { AuthProvider } from "@/contexts/EnhancedAuthContext";
   ```

3. **Start Frontend**:
   ```bash
   npm run dev
   ```

## Testing

### 1. Test Users

The system creates test users with the following credentials:

| Role | Email | Password | Expected Redirect |
|------|-------|----------|-------------------|
| Admin | admin@test.com | admin123 | /admin/dashboard |
| Staff1 | staff1@test.com | staff123 | /staff1/dashboard |
| Staff2 | staff2@test.com | staff123 | /staff2/dashboard |
| Staff3 | staff3@test.com | staff123 | /staff3/dashboard |
| Staff4 | staff4@test.com | staff123 | /staff4/dashboard |
| Staff5 | staff5@test.com | staff123 | /staff5/dashboard |

### 2. Test Scenarios

1. **Valid Login**: Each user should be redirected to their assigned dashboard
2. **Role Mismatch**: Users cannot access other role's dashboards
3. **Invalid Credentials**: Proper error handling for wrong credentials
4. **Token Validation**: JWT tokens contain correct role information

### 3. Run Tests

```bash
# Test the login system
node test-role-login.js
```

## Security Features

### 1. JWT Token Structure

```javascript
{
  "id": "user_id",
  "role": "staff1",
  "email": "user@example.com",
  "name": "User Name",
  "iat": 1234567890,
  "exp": 1234567890
}
```

### 2. Role Validation

- Server-side role validation on every request
- Client-side role checking before rendering components
- Automatic redirection based on user role
- Access denied for unauthorized roles

### 3. Audit Logging

All login attempts and actions are logged:

```javascript
{
  "userId": "user_id",
  "userRole": "staff1",
  "action": "login",
  "resource": "user",
  "details": "Successful login - role: staff1",
  "ipAddress": "127.0.0.1",
  "userAgent": "Mozilla/5.0...",
  "severity": "low",
  "status": "success"
}
```

## Usage Examples

### 1. Login with Role-Based Redirection

```javascript
import { useAuth } from '@/contexts/EnhancedAuthContext';

function LoginPage() {
  const { login } = useAuth();

  const handleLogin = async (email, password) => {
    const result = await login(email, password);
    
    if (result.success) {
      // User is automatically redirected to their dashboard
      console.log(`Redirected to: ${result.redirectPath}`);
    } else {
      console.error('Login failed:', result.message);
    }
  };
}
```

### 2. Protected Dashboard Component

```javascript
import { Staff2DashboardWrapper } from '@/components/RoleBasedDashboard';

function Staff2Dashboard() {
  return (
    <Staff2DashboardWrapper>
      <div>
        <h1>Staff2 Dashboard</h1>
        <p>Trustee Details Validation</p>
      </div>
    </Staff2DashboardWrapper>
  );
}
```

### 3. Check User Permissions

```javascript
import { useAuth } from '@/contexts/EnhancedAuthContext';

function SomeComponent() {
  const { user, canAccessRole } = useAuth();

  if (canAccessRole('admin')) {
    return <AdminOnlyContent />;
  }

  if (canAccessRole('staff1')) {
    return <Staff1Content />;
  }

  return <AccessDenied />;
}
```

## Troubleshooting

### Common Issues

1. **User not redirected to correct dashboard**:
   - Check if user role is correctly set in database
   - Verify JWT token contains correct role information
   - Check browser console for errors

2. **Access denied errors**:
   - Ensure user has valid role (admin, staff1, staff2, staff3, staff4, staff5)
   - Check if user is active in database
   - Verify JWT token is valid and not expired

3. **Login fails**:
   - Check if user exists in database
   - Verify password is correct
   - Check server logs for detailed error messages

### Debug Mode

Enable debug logging by setting environment variable:

```bash
DEBUG=auth:*
```

## API Endpoints

### Authentication

- `POST /api/auth/login` - User login
- `GET /api/auth/profile` - Get user profile
- `POST /api/auth/logout` - User logout
- `GET /api/auth/validate` - Validate JWT token

### Response Format

All API responses follow this format:

```javascript
{
  "success": true|false,
  "message": "Description of result",
  "data": {
    // Response data
  }
}
```

## Conclusion

This role-based login system ensures that:

1. ✅ Users are assigned specific roles by admin
2. ✅ JWT tokens contain role information
3. ✅ Users are redirected only to their assigned dashboard
4. ✅ Protected routes prevent unauthorized access
5. ✅ Complete audit trail of all actions
6. ✅ Clean and professional implementation

The system is production-ready and provides robust security while maintaining a smooth user experience.
