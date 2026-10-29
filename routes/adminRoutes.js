const express = require('express');
const router = express.Router();
const adminController = require('../controllers/adminController');
const { requireRole } = require('./authMiddleware');

// Ruta GET /admin-dashboard: Panel exclusivo para rol 'admin'
router.get('/admin-dashboard', requireRole('admin'), adminController.renderAdminDashboard);

// Endpoint POST /api/productos: Registro de nuevos productos en el inventario
router.post('/api/productos', requireRole('admin'), adminController.crearProducto);

// Endpoint POST /api/admin/registrar-socio: Alta de nuevos socios y generacion de membresia
router.post('/api/admin/registrar-socio', requireRole('admin'), adminController.registrarSocio);

module.exports = router;
