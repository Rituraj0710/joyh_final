import express from "express";
import { authorizeRoles } from "../middlewares/authorizeRoles.js";

const router = express.Router();

// Staff 2 Routes - Only accessible by staff_2 and admin
router.use(authorizeRoles('staff_2', 'admin'));

// Staff 2 Dashboard
router.get("/dashboard", (req, res) => {
  res.json({
    status: 'success',
    message: 'Staff 2 Dashboard accessed successfully',
    data: {
      user: req.user,
      department: 'Staff 2 Department',
      permissions: ['manage_employees', 'view_payroll', 'manage_benefits']
    }
  });
});

// Employee Management
router.get("/employees", (req, res) => {
  res.json({
    status: 'success',
    message: 'Employee list retrieved',
    data: {
      employees: [
        { id: 1, name: 'John Doe', position: 'Developer', department: 'IT' },
        { id: 2, name: 'Jane Smith', position: 'Designer', department: 'Creative' }
      ]
    }
  });
});

// Add Employee
router.post("/employees", (req, res) => {
  res.json({
    status: 'success',
    message: 'Employee added successfully',
    data: req.body
  });
});

// Payroll Management
router.get("/payroll", (req, res) => {
  res.json({
    status: 'success',
    message: 'Payroll data retrieved',
    data: {
      payroll: [
        { employee: 'John Doe', salary: 50000, department: 'IT' },
        { employee: 'Jane Smith', salary: 45000, department: 'Creative' }
      ]
    }
  });
});

export default router;
