const express = require('express');
const router = express.Router();
const adminController = require('../controllers/adminController');
const { requireRole } = require('./authMiddleware');
const uploadProducto = require('../middlewares/uploadProducto');

// Ruta GET /admin-dashboard: Panel exclusivo para rol 'admin'
router.get('/admin-dashboard', requireRole('admin'), adminController.renderAdminDashboard);

// Endpoint POST /api/productos: Registro de nuevos productos en el inventario con foto opcional
router.post('/api/productos', requireRole('admin'), uploadProducto, adminController.crearProducto);

// Endpoint POST /api/admin/registrar-socio: Alta de nuevos socios y generacion de membresia
router.post('/api/admin/registrar-socio', requireRole('admin'), adminController.registrarSocio);

// Endpoint POST /api/admin/renovar-membresia: Renovacion activa de membresia (Mensual o Anual)
router.post('/api/admin/renovar-membresia', requireRole('admin'), adminController.renovarMembresia);

// Endpoint POST /api/admin/actualizar-stock: Actualizacion directa del stock en productos
router.post('/api/admin/actualizar-stock', requireRole('admin'), adminController.actualizarStock);

// Endpoint POST /api/admin/pedidos/cobrar: Cobro y despacho presencial de ticket en recepcion
router.post('/api/admin/pedidos/cobrar', requireRole('admin'), adminController.cobrarPedido);

// Endpoint GET /api/admin/pedidos/:id/detalle: Consulta de productos y articulos asociados a un ticket
router.get('/api/admin/pedidos/:id/detalle', requireRole('admin'), adminController.obtenerDetallePedido);

module.exports = router;
