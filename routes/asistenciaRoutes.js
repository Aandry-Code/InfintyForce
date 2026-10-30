const express = require('express');
const router = express.Router();
const { pool } = require('../database/db');
const { requireRole } = require('./authMiddleware');

router.post('/api/asistencia', requireRole('socio'), async (req, res) => {
  const userId = req.session.user.id;
  const userRole = req.session.user.rol;

  try {
    // Si el usuario es socio, validar rigurosamente el estado de su membresia
    if (userRole === 'socio') {
      const [memRows] = await pool.query(`
        SELECT id, tipo, estado, fecha_vencimiento,
               CASE WHEN fecha_vencimiento < CURDATE() THEN 1 ELSE 0 END AS esta_vencida
        FROM membresias
        WHERE usuario_id = ?
        ORDER BY id DESC
        LIMIT 1
      `, [userId]);

      if (memRows.length === 0) {
        return res.status(403).json({
          success: false,
          message: 'Acceso denegado: Tu membresía se encuentra inactiva o vencida. Acércate a recepción.'
        });
      }

      const ultimaMembresia = memRows[0];

      if (ultimaMembresia.esta_vencida === 1) {
        await pool.query("UPDATE membresias SET estado = 'Vencida' WHERE id = ?", [ultimaMembresia.id]);
        return res.status(403).json({
          success: false,
          message: 'Acceso denegado: Tu membresía se encuentra inactiva o vencida. Acércate a recepción.'
        });
      }

      if (ultimaMembresia.estado !== 'Activa') {
        return res.status(403).json({
          success: false,
          message: 'Acceso denegado: Tu membresía se encuentra inactiva o vencida. Acércate a recepción.'
        });
      }
    }

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

// Endpoint POST /api/asistencia/reiniciar-hoy: Permite reiniciar la asistencia de hoy para pruebas o reconteo
router.post('/api/asistencia/reiniciar-hoy', requireRole('socio'), async (req, res) => {
  const userId = req.session.user.id;

  try {
    await pool.query('DELETE FROM asistencias WHERE usuario_id = ? AND DATE(fecha) = CURDATE()', [userId]);

    const countQuery = `
      SELECT COUNT(*) AS total
      FROM asistencias
      WHERE usuario_id = ?
        AND MONTH(fecha) = MONTH(CURDATE())
        AND YEAR(fecha) = YEAR(CURDATE())
    `;
    const [countRows] = await pool.query(countQuery, [userId]);
    const totalActualizado = countRows[0]?.total || 0;

    return res.status(200).json({
      success: true,
      message: 'Asistencia del día reiniciada correctamente.',
      totalAsistencias: totalActualizado
    });
  } catch (error) {
    console.error('Error al reiniciar asistencia de hoy en MySQL:', error.message);
    return res.status(500).json({
      success: false,
      message: 'Error interno al reiniciar la asistencia.'
    });
  }
});

router.get('/api/asistencia/calendario-mes', requireRole('socio'), async (req, res) => {
  const userId = req.session.user.id;

  try {
    const query = `
      SELECT DISTINCT DAY(fecha) AS dia, DATE_FORMAT(fecha, '%H:%i') AS hora
      FROM asistencias
      WHERE usuario_id = ?
        AND MONTH(fecha) = MONTH(CURDATE())
        AND YEAR(fecha) = YEAR(CURDATE())
      ORDER BY dia ASC;
    `;
    const [rows] = await pool.query(query, [userId]);

    const meses = [
      'Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio',
      'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'
    ];
    const fechaActual = new Date();
    const nombreDelMes = meses[fechaActual.getMonth()];
    const anioActual = fechaActual.getFullYear();
    const diasArray = rows.map(r => r.dia);

    return res.status(200).json({
      success: true,
      diasAsistidos: diasArray,
      detalles: rows,
      mes: nombreDelMes,
      anio: anioActual,
      total: rows.length
    });
  } catch (error) {
    console.error('Error al consultar calendario mensual de asistencias:', error.message);
    return res.status(500).json({
      success: false,
      message: 'Error al consultar el calendario mensual de asistencias.'
    });
  }
});

module.exports = router;
