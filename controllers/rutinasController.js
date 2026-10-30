const path = require('path');
const fs = require('fs');
const { pool } = require('../database/db');

const rutinasController = {
  renderRutinasView: async (req, res) => {
    const userName = req.session.user.nombre;
    const userEmail = req.session.user.email;
    const userRole = req.session.user.rol;

    const volverEntrenadorHtml = userRole === 'entrenador'
      ? '<a href="/entrenador-dashboard" class="bg-yellow-400 text-zinc-950 font-bold px-4 py-2 rounded-lg hover:bg-yellow-300 transition-all text-xs uppercase tracking-wider shadow-md inline-flex items-center">PANEL ENTRENADOR</a>'
      : '';

    try {
      const templatePath = path.join(__dirname, '..', 'views', 'rutinas.html');
      let html = await fs.promises.readFile(templatePath, 'utf8');

      html = html
        .replace(/{{USER_NAME}}/g, userName)
        .replace(/{{USER_EMAIL}}/g, userEmail)
        .replace('{{VOLVER_PANEL_ENTRENADOR_HTML}}', volverEntrenadorHtml);

      return res.status(200).send(html);
    } catch (error) {
      console.error('Error al renderizar vista de rutinas en MySQL:', error.message);
      return res.status(500).send('Error interno al cargar el modulo de rutinas.');
    }
  },

  getMiPlan: async (req, res) => {
    const userId = req.session.user.id;

    try {
      // 1. Obtener la rutina activa asignada al socio
      const [userRows] = await pool.query('SELECT rutina_activa_id FROM usuarios WHERE id = ?', [userId]);
      const rutinaActivaId = userRows[0]?.rutina_activa_id;

      // Si no tiene rutina asignada, usar la rutina por defecto (id = 1)
      const targetRutinaId = rutinaActivaId || 1;

      const routineQuery = `
        SELECT r.id AS rutina_id, r.nombre AS rutina_nombre, r.tipo AS rutina_tipo, r.frecuencia AS rutina_frecuencia,
               rd.id AS detalle_id, rd.series, rd.repeticiones,
               e.id AS ejercicio_id, e.nombre AS ejercicio_nombre, e.grupo_muscular
        FROM rutinas r
        JOIN rutinas_detalle rd ON r.id = rd.rutina_id
        JOIN ejercicios e ON rd.ejercicio_id = e.id
        WHERE r.id = ?
        ORDER BY rd.id ASC
      `;
      let [rows] = await pool.query(routineQuery, [targetRutinaId]);

      // Si por alguna razon no se encontraron ejercicios para esa rutina, intentar con la rutina general (id = 1)
      if (rows.length === 0 && targetRutinaId !== 1) {
        const [fallbackRows] = await pool.query(routineQuery, [1]);
        rows = fallbackRows;
      }

      if (rows.length === 0) {
        return res.status(200).json({
          success: true,
          rutina: null,
          ejercicios: []
        });
      }

      const rutinaInfo = {
        id: rows[0].rutina_id,
        nombre: rows[0].rutina_nombre,
        tipo: rows[0].rutina_tipo,
        frecuencia: rows[0].rutina_frecuencia
      };

      const ejercicios = rows.map(row => ({
        detalleId: row.detalle_id,
        ejercicioId: row.ejercicio_id,
        nombre: row.ejercicio_nombre,
        grupoMuscular: row.grupo_muscular,
        series: row.series,
        repeticiones: row.repeticiones
      }));

      return res.status(200).json({
        success: true,
        rutina: rutinaInfo,
        ejercicios: ejercicios
      });
    } catch (error) {
      console.error('Error al consultar plan actual de rutina en MySQL:', error.message);
      return res.status(500).json({
        success: false,
        message: 'No fue posible cargar el plan actual de entrenamiento.'
      });
    }
  },

  getSolicitudes: async (req, res) => {
    const userId = req.session.user.id;

    try {
      const query = `
        SELECT sr.id, sr.objetivo, sr.dias_semana, sr.observaciones, sr.observaciones_entrenador, sr.estado, sr.rutina_id,
               r.nombre AS rutina_nombre,
               DATE_FORMAT(sr.fecha_solicitud, '%d/%m/%Y, %H:%i') AS fecha
        FROM solicitudes_rutina sr
        LEFT JOIN rutinas r ON sr.rutina_id = r.id
        WHERE sr.usuario_id = ?
        ORDER BY sr.id DESC
      `;
      const [rows] = await pool.query(query, [userId]);

      return res.status(200).json({
        success: true,
        solicitudes: rows
      });
    } catch (error) {
      console.error('Error al consultar historial de solicitudes de rutina en MySQL:', error.message);
      return res.status(500).json({
        success: false,
        message: 'Error al consultar las solicitudes de rutina.'
      });
    }
  },

  solicitarRutina: async (req, res) => {
    const userId = req.session.user.id;
    const { objetivo, objetivo_personalizado, dias_semana, observaciones } = req.body;

    let objetivoFinal = '';
    if (objetivo === 'Otro' || String(objetivo).startsWith('Otro')) {
      objetivoFinal = objetivo_personalizado ? String(objetivo_personalizado).trim() : '';
    } else if (objetivo) {
      objetivoFinal = String(objetivo).trim();
    }

    if (!objetivoFinal || objetivoFinal.length < 3) {
      return res.status(400).json({
        success: false,
        message: 'Debe seleccionar o especificar un objetivo válido para su rutina.'
      });
    }

    if (objetivoFinal.length > 150) {
      objetivoFinal = objetivoFinal.substring(0, 150);
    }

    const dias = parseInt(dias_semana, 10);
    if (isNaN(dias) || dias < 1 || dias > 7) {
      return res.status(400).json({
        success: false,
        message: 'La cantidad de dias por semana debe ser un numero entre 1 y 7.'
      });
    }

    const obsLimpia = observaciones ? String(observaciones).trim() : '';

    try {
      // Verificar si ya existe una solicitud pendiente del mismo socio
      const [pendientesExistentes] = await pool.query(
        "SELECT id FROM solicitudes_rutina WHERE usuario_id = ? AND estado = 'Pendiente' LIMIT 1",
        [userId]
      );
      if (pendientesExistentes.length > 0) {
        return res.status(400).json({
          success: false,
          message: 'Ya tienes una solicitud de rutina en estado Pendiente. Espera la evaluación del entrenador antes de enviar una nueva.'
        });
      }

      const insertQuery = `
        INSERT INTO solicitudes_rutina (usuario_id, objetivo, dias_semana, observaciones, estado)
        VALUES (?, ?, ?, ?, 'Pendiente')
      `;
      const [insertResult] = await pool.query(insertQuery, [userId, objetivoFinal, dias, obsLimpia]);

      const [solicitudRows] = await pool.query(`
        SELECT id, objetivo, dias_semana, observaciones, estado,
               DATE_FORMAT(fecha_solicitud, '%d/%m/%Y, %H:%i') AS fecha
        FROM solicitudes_rutina
        WHERE id = ?
      `, [insertResult.insertId]);

      return res.status(201).json({
        success: true,
        message: 'Solicitud de rutina registrada correctamente. Su solicitud esta en estado Pendiente para evaluacion.',
        solicitud: solicitudRows[0]
      });
    } catch (error) {
      console.error('Error al registrar solicitud de rutina en MySQL:', error.message);
      return res.status(500).json({
        success: false,
        message: 'Error interno en el servidor al registrar la solicitud de rutina.'
      });
    }
  }
};

module.exports = rutinasController;
