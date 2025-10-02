import express from "express";
import { authorizeRoles } from "../middlewares/authorizeRoles.js";

const router = express.Router();

// Staff 4 Routes - Only accessible by staff_4 and admin
router.use(authorizeRoles('staff_4', 'admin'));

// Staff 4 Dashboard
router.get("/dashboard", (req, res) => {
  res.json({
    status: 'success',
    message: 'Staff 4 Dashboard accessed successfully',
    data: {
      user: req.user,
      department: 'Staff 4 Department',
      permissions: ['manage_processes', 'view_metrics', 'manage_resources']
    }
  });
});

// Process Management
router.get("/processes", (req, res) => {
  res.json({
    status: 'success',
    message: 'Processes retrieved',
    data: {
      processes: [
        { id: 1, name: 'Order Processing', status: 'active', efficiency: 95 },
        { id: 2, name: 'Inventory Management', status: 'active', efficiency: 88 }
      ]
    }
  });
});

// Resource Allocation
router.get("/resources", (req, res) => {
  res.json({
    status: 'success',
    message: 'Resource allocation retrieved',
    data: {
      resources: [
        { id: 1, name: 'Server Capacity', utilization: 75, max_capacity: 100 },
        { id: 2, name: 'Storage', utilization: 60, max_capacity: 500 }
      ]
    }
  });
});

// Performance Metrics
router.get("/metrics", (req, res) => {
  res.json({
    status: 'success',
    message: 'Performance metrics retrieved',
    data: {
      metrics: [
        { name: 'Response Time', value: '150ms', target: '<200ms', status: 'good' },
        { name: 'Uptime', value: '99.9%', target: '>99%', status: 'excellent' }
      ]
    }
  });
});

// Update Process Status
router.put("/processes/:id", (req, res) => {
  res.json({
    status: 'success',
    message: `Process ${req.params.id} updated successfully`,
    data: req.body
  });
});

export default router;
