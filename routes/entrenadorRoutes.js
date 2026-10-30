const express = require('express');
const router = express.Router();
const entrenadorController = require('../controllers/entrenadorController');
const { requireRole } = require('./authMiddleware');

// Ruta GET /entrenador-dashboard: Panel exclusivo para rol 'entrenador'
router.get('/entrenador-dashboard', requireRole('entrenador'), entrenadorController.renderEntrenadorDashboard);

// Ruta GET /asignar-rutina: Redireccion o visualizador de plan de entrenamiento
router.get('/asignar-rutina', requireRole('entrenador'), entrenadorController.renderAsignarRutina);

// Endpoint POST /api/entrenador/solicitudes/asignar: Aprobacion y asignacion tecnica de plan
router.post('/api/entrenador/solicitudes/asignar', requireRole('entrenador'), entrenadorController.asignarRutina);

// Endpoint POST /api/entrenador/solicitudes/rechazar: Rechazo de solicitud con motivos tecnicos o clinicos
router.post('/api/entrenador/solicitudes/rechazar', requireRole('entrenador'), entrenadorController.rechazarSolicitud);

// Endpoint GET /api/entrenador/solicitudes/historial: Historial de solicitudes procesadas
router.get('/api/entrenador/solicitudes/historial', requireRole('entrenador'), entrenadorController.getHistorialSolicitudes);

module.exports = router;
