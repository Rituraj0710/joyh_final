import express from "express";
import { authorizeRoles } from "../middlewares/authorizeRoles.js";

const router = express.Router();

// Staff 5 Routes - Only accessible by staff_5 and admin
router.use(authorizeRoles('staff_5', 'admin'));

// Staff 5 Dashboard
router.get("/dashboard", (req, res) => {
  res.json({
    status: 'success',
    message: 'Staff 5 Dashboard accessed successfully',
    data: {
      user: req.user,
      department: 'Staff 5 Department',
      permissions: ['manage_teams', 'view_analytics', 'approve_requests', 'manage_budgets']
    }
  });
});

// Team Management
router.get("/teams", (req, res) => {
  res.json({
    status: 'success',
    message: 'Teams retrieved',
    data: {
      teams: [
        { id: 1, name: 'Development Team', members: 8, performance: 92 },
        { id: 2, name: 'Design Team', members: 5, performance: 88 },
        { id: 3, name: 'Marketing Team', members: 6, performance: 95 }
      ]
    }
  });
});

// Analytics Dashboard
router.get("/analytics", (req, res) => {
  res.json({
    status: 'success',
    message: 'Analytics data retrieved',
    data: {
      analytics: {
        revenue: { current: 250000, previous: 200000, growth: 25 },
        customers: { current: 1250, previous: 1100, growth: 13.6 },
        projects: { active: 15, completed: 45, pending: 8 }
      }
    }
  });
});

// Pending Approvals
router.get("/approvals", (req, res) => {
  res.json({
    status: 'success',
    message: 'Pending approvals retrieved',
    data: {
      approvals: [
        { id: 1, type: 'budget_request', amount: 15000, requester: 'John Doe', status: 'pending' },
        { id: 2, type: 'leave_request', days: 5, requester: 'Jane Smith', status: 'pending' }
      ]
    }
  });
});

// Approve Request
router.post("/approvals/:id/approve", (req, res) => {
  res.json({
    status: 'success',
    message: `Request ${req.params.id} approved successfully`,
    data: req.body
  });
});

// Budget Management
router.get("/budgets", (req, res) => {
  res.json({
    status: 'success',
    message: 'Budget information retrieved',
    data: {
      budgets: [
        { department: 'IT', allocated: 100000, spent: 75000, remaining: 25000 },
        { department: 'Marketing', allocated: 50000, spent: 30000, remaining: 20000 }
      ]
    }
  });
});

export default router;
