const express = require('express');
const router = express.Router();
const tiendaController = require('../controllers/tiendaController');
const { requireRole } = require('./authMiddleware');

router.get('/tienda', requireRole('socio'), tiendaController.renderTiendaView);
router.get('/api/productos', requireRole('socio'), tiendaController.getProductosAPI);
router.post('/api/tienda/checkout', requireRole('socio'), tiendaController.checkout);
router.get('/api/tienda/mis-pedidos', requireRole('socio'), tiendaController.getMisPedidos);

module.exports = router;
