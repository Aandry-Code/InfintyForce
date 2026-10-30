const express = require('express');
const router = express.Router();
const nutricionController = require('../controllers/nutricionController');
const { requireRole } = require('./authMiddleware');

// Ruta GET /nutricion: Vista del modulo nutricional
router.get('/nutricion', requireRole('socio'), nutricionController.renderNutricionView);

// Endpoint POST /api/nutricion/actualizar-biometria: Persistencia automatica de peso, altura y edad en MySQL
router.post('/api/nutricion/actualizar-biometria', requireRole('socio'), nutricionController.actualizarBiometria);

module.exports = router;
