import express from "express";
import { authorizeRoles } from "../middlewares/authorizeRoles.js";

const router = express.Router();

// Staff 3 Routes - Only accessible by staff_3 and admin
router.use(authorizeRoles('staff_3', 'admin'));

// Staff 3 Dashboard
router.get("/dashboard", (req, res) => {
  res.json({
    status: 'success',
    message: 'Staff 3 Dashboard accessed successfully',
    data: {
      user: req.user,
      department: 'Staff 3 Department',
      permissions: ['manage_finances', 'view_transactions', 'manage_invoices']
    }
  });
});

// Financial Reports
router.get("/reports", (req, res) => {
  res.json({
    status: 'success',
    message: 'Financial reports retrieved',
    data: {
      reports: [
        { id: 1, name: 'Monthly Revenue', amount: 150000, date: '2024-01-31' },
        { id: 2, name: 'Expense Report', amount: 75000, date: '2024-01-31' }
      ]
    }
  });
});

// Invoice Management
router.get("/invoices", (req, res) => {
  res.json({
    status: 'success',
    message: 'Invoices retrieved',
    data: {
      invoices: [
        { id: 'INV-001', client: 'ABC Corp', amount: 25000, status: 'paid' },
        { id: 'INV-002', client: 'XYZ Ltd', amount: 15000, status: 'pending' }
      ]
    }
  });
});

// Create Invoice
router.post("/invoices", (req, res) => {
  res.json({
    status: 'success',
    message: 'Invoice created successfully',
    data: req.body
  });
});

// Transaction History
router.get("/transactions", (req, res) => {
  res.json({
    status: 'success',
    message: 'Transaction history retrieved',
    data: {
      transactions: [
        { id: 1, type: 'credit', amount: 5000, description: 'Payment received', date: '2024-01-15' },
        { id: 2, type: 'debit', amount: 2000, description: 'Office supplies', date: '2024-01-14' }
      ]
    }
  });
});

export default router;
