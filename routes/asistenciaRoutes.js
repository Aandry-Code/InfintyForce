const express = require('express');
const router = express.Router();
const { pool } = require('../database/db');
const { requireRole } = require('./authMiddleware');

router.post('/api/asistencia', requireRole('socio'), async (req, res) => {
  const userId = req.session.user.id;

  try {
    const checkQuery = `
      SELECT id, DATE_FORMAT(fecha, '%H:%i') AS hora
      FROM asistencias
      WHERE usuario_id = ?
        AND DATE(fecha) = CURDATE()
      LIMIT 1
    `;
    const [checkRows] = await pool.query(checkQuery, [userId]);

    if (checkRows.length > 0) {
      return res.status(400).json({
        success: false,
        message: `Ya has registrado tu asistencia para el dia de hoy a las ${checkRows[0].hora} hrs.`
      });
    }

    const insertQuery = `
      INSERT INTO asistencias (usuario_id, fecha)
      VALUES (?, NOW())
    `;
    const [insertResult] = await pool.query(insertQuery, [userId]);

    const [insertedRows] = await pool.query(
      'SELECT id, DATE_FORMAT(fecha, "%d/%m/%Y, %H:%i") AS fecha_formateada FROM asistencias WHERE id = ?',
      [insertResult.insertId]
    );

    const countQuery = `
      SELECT COUNT(*) AS total
      FROM asistencias
      WHERE usuario_id = ?
        AND MONTH(fecha) = MONTH(CURDATE())
        AND YEAR(fecha) = YEAR(CURDATE())
    `;
    const [countRows] = await pool.query(countQuery, [userId]);
    const totalActualizado = countRows[0]?.total || 0;

    return res.status(201).json({
      success: true,
      message: 'Asistencia registrada correctamente en el sistema.',
      totalAsistencias: totalActualizado,
      ultimaAsistencia: insertedRows[0].fecha_formateada
    });
  } catch (error) {
    console.error('Error al registrar la asistencia en MySQL:', error.message);
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
      SELECT id, DATE_FORMAT(fecha, '%H:%i') AS hora
      FROM asistencias
      WHERE usuario_id = ?
        AND DATE(fecha) = CURDATE()
      LIMIT 1
    `;
    const [checkRows] = await pool.query(checkQuery, [userId]);
    const asistioHoy = checkRows.length > 0;

    return res.status(200).json({
      asistioHoy,
      hora: asistioHoy ? checkRows[0].hora : null
    });
  } catch (error) {
    console.error('Error al verificar asistencia de hoy en MySQL:', error.message);
    return res.status(500).json({
      asistioHoy: false,
      error: error.message
    });
  }
});

module.exports = router;
