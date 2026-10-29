const express = require('express');
const router = express.Router();
const { pool } = require('../database/config');
const { requireRole } = require('./authMiddleware');

router.post('/api/asistencia', requireRole('socio'), async (req, res) => {
  const userId = req.session.user.id;

  try {
    const checkQuery = `
      SELECT id, TO_CHAR(fecha, 'HH24:MI') AS hora
      FROM Asistencias
      WHERE usuario_id = $1
        AND CAST(fecha AS DATE) = CURRENT_DATE
      LIMIT 1
    `;
    const checkResult = await pool.query(checkQuery, [userId]);

    if (checkResult.rows.length > 0) {
      return res.status(400).json({
        success: false,
        message: `Ya has registrado tu asistencia para el dia de hoy a las ${checkResult.rows[0].hora} hrs.`
      });
    }

    const insertQuery = `
      INSERT INTO Asistencias (usuario_id, fecha)
      VALUES ($1, CURRENT_TIMESTAMP)
      RETURNING id, TO_CHAR(fecha, 'DD/MM/YYYY, HH24:MI') AS fecha_formateada
    `;
    const insertResult = await pool.query(insertQuery, [userId]);

    const countQuery = `
      SELECT COUNT(*)::int AS total
      FROM Asistencias
      WHERE usuario_id = $1
        AND EXTRACT(MONTH FROM fecha) = EXTRACT(MONTH FROM CURRENT_DATE)
        AND EXTRACT(YEAR FROM fecha) = EXTRACT(YEAR FROM CURRENT_DATE)
    `;
    const countResult = await pool.query(countQuery, [userId]);
    const totalActualizado = countResult.rows[0]?.total || 0;

    return res.status(201).json({
      success: true,
      message: 'Asistencia registrada correctamente en el sistema.',
      totalAsistencias: totalActualizado,
      ultimaAsistencia: insertResult.rows[0].fecha_formateada
    });
  } catch (error) {
    console.error('Error al registrar la asistencia en PostgreSQL:', error.message);
    return res.status(500).json({
      success: false,
      message: 'Ocurrio un error interno en el servidor al registrar la asistencia.'
    });
  }
});

router.get('/api/asistencia/estado-hoy', requireRole('socio'), async (req, res) => {
  const userId = req.session.user.id;

  try {
    const checkQuery = `
      SELECT id, TO_CHAR(fecha, 'HH24:MI') AS hora
      FROM Asistencias
      WHERE usuario_id = $1
        AND CAST(fecha AS DATE) = CURRENT_DATE
      LIMIT 1
    `;
    const checkResult = await pool.query(checkQuery, [userId]);
    const asistioHoy = checkResult.rows.length > 0;

    return res.status(200).json({
      asistioHoy,
      hora: asistioHoy ? checkResult.rows[0].hora : null
    });
  } catch (error) {
    console.error('Error al verificar asistencia de hoy:', error.message);
    return res.status(500).json({
      asistioHoy: false,
      error: error.message
    });
  }
});

module.exports = router;
