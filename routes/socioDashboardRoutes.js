const express = require('express');
const router = express.Router();
const { requireRole } = require('./authMiddleware');
const socioDashboardController = require('../controllers/socioDashboardController');

router.get('/socio-dashboard', requireRole('socio'), socioDashboardController.renderSocioDashboard);
router.get('/api/socio/dashboard-data', requireRole('socio'), socioDashboardController.getDashboardData);

module.exports = router;
