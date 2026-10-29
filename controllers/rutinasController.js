const path = require('path');
const fs = require('fs');
const { pool } = require('../database/config');

const rutinasController = {
  renderRutinasView: async (req, res) => {
    const userName = req.session.user.nombre;
    const userEmail = req.session.user.email;

    try {
      const templatePath = path.join(__dirname, '..', 'views', 'rutinas.html');
      let html = await fs.promises.readFile(templatePath, 'utf8');

      html = html
        .replace(/{{USER_NAME}}/g, userName)
        .replace(/{{USER_EMAIL}}/g, userEmail);

      return res.status(200).send(html);
    } catch (error) {
      console.error('Error al renderizar vista de rutinas:', error.message);
      return res.status(500).send('Error interno al cargar el modulo de rutinas.');
    }
  },

  getMiPlan: async (req, res) => {
    try {
      const routineQuery = `
        SELECT r.id AS rutina_id, r.nombre AS rutina_nombre, r.tipo AS rutina_tipo, r.frecuencia AS rutina_frecuencia,
               rd.id AS detalle_id, rd.series, rd.repeticiones,
               e.id AS ejercicio_id, e.nombre AS ejercicio_nombre, e.grupo_muscular
        FROM Rutinas r
        JOIN Rutinas_Detalle rd ON r.id = rd.rutina_id
        JOIN Ejercicios e ON rd.ejercicio_id = e.id
        ORDER BY rd.id ASC
      `;
      const result = await pool.query(routineQuery);

      if (result.rows.length === 0) {
        return res.status(200).json({
          success: true,
          rutina: null,
          ejercicios: []
        });
      }

      const rutinaInfo = {
        id: result.rows[0].rutina_id,
        nombre: result.rows[0].rutina_nombre,
        tipo: result.rows[0].rutina_tipo,
        frecuencia: result.rows[0].rutina_frecuencia
      };

      const ejercicios = result.rows.map(row => ({
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
      console.error('Error al consultar plan actual de rutina:', error.message);
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
        SELECT id, objetivo, dias_semana, observaciones, estado,
               TO_CHAR(fecha_solicitud, 'DD/MM/YYYY, HH24:MI') AS fecha
        FROM Solicitudes_Rutina
        WHERE usuario_id = $1
        ORDER BY id DESC
      `;
      const result = await pool.query(query, [userId]);

      return res.status(200).json({
        success: true,
        solicitudes: result.rows
      });
    } catch (error) {
      console.error('Error al consultar historial de solicitudes de rutina:', error.message);
      return res.status(500).json({
        success: false,
        message: 'Error al consultar las solicitudes de rutina.'
      });
    }
  },

  solicitarRutina: async (req, res) => {
    const userId = req.session.user.id;
    const { objetivo, dias_semana, observaciones } = req.body;

    const objetivosValidos = ['Volumen', 'Definicion', 'Mantenimiento'];
    if (!objetivo || !objetivosValidos.includes(objetivo)) {
      return res.status(400).json({
        success: false,
        message: 'Debe seleccionar un objetivo valido (Volumen, Definicion o Mantenimiento).'
      });
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
      const insertQuery = `
        INSERT INTO Solicitudes_Rutina (usuario_id, objetivo, dias_semana, observaciones, estado)
        VALUES ($1, $2, $3, $4, 'Pendiente')
        RETURNING id, objetivo, dias_semana, observaciones, estado,
                  TO_CHAR(fecha_solicitud, 'DD/MM/YYYY, HH24:MI') AS fecha
      `;
      const result = await pool.query(insertQuery, [userId, objetivo, dias, obsLimpia]);

      return res.status(201).json({
        success: true,
        message: 'Solicitud de rutina registrada correctamente. Su solicitud esta en estado Pendiente para evaluacion.',
        solicitud: result.rows[0]
      });
    } catch (error) {
      console.error('Error al registrar solicitud de rutina en PostgreSQL:', error.message);
      return res.status(500).json({
        success: false,
        message: 'Error interno en el servidor al registrar la solicitud de rutina.'
      });
    }
  }
};

module.exports = rutinasController;
