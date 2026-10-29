const express = require('express');
const router = express.Router();
const rutinasController = require('../controllers/rutinasController');
const { requireRole } = require('./authMiddleware');

router.get('/rutinas', requireRole('socio'), rutinasController.renderRutinasView);
router.get('/api/rutinas/mi-plan', requireRole('socio'), rutinasController.getMiPlan);
router.get('/api/rutinas/solicitudes', requireRole('socio'), rutinasController.getSolicitudes);
router.post('/api/rutinas/solicitar', requireRole('socio'), rutinasController.solicitarRutina);

module.exports = router;
