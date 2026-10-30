const path = require('path');
const fs = require('fs');
const { pool } = require('../database/db');

const socioDashboardController = {
  renderSocioDashboard: async (req, res) => {
    const userId = req.session.user.id;
    const userName = req.session.user.nombre;
    const userEmail = req.session.user.email;
    const userRole = req.session.user.rol;

    try {
      // 1. Consultar estado real de membresia en MySQL
      const membershipQuery = `
        SELECT tipo, estado, DATE_FORMAT(fecha_vencimiento, '%d/%m/%Y') AS fecha_vencimiento
        FROM membresias
        WHERE usuario_id = ?
        ORDER BY id DESC
        LIMIT 1
      `;
      const [membershipRows] = await pool.query(membershipQuery, [userId]);
      const defaultTipo = userRole === 'entrenador' ? 'Staff / Entrenador Oficial' : 'Sin Membresia Activa';
      const defaultEstado = userRole === 'entrenador' ? 'Activa' : 'Inactiva';
      const defaultVenc = userRole === 'entrenador' ? 'Pase Permanente' : 'No registrada';

      const membership = membershipRows[0] || {
        tipo: defaultTipo,
        estado: defaultEstado,
        fecha_vencimiento: defaultVenc
      };

      // 2. Consultar asistencias del mes actual en MySQL
      const attendanceQuery = `
        SELECT COUNT(*) AS total
        FROM asistencias
        WHERE usuario_id = ?
          AND MONTH(fecha) = MONTH(CURDATE())
          AND YEAR(fecha) = YEAR(CURDATE())
      `;
      const [attendanceRows] = await pool.query(attendanceQuery, [userId]);
      const totalAsistencias = attendanceRows[0]?.total || 0;

      // 3. Consultar fecha de la ultima asistencia
      const lastAttendanceQuery = `
        SELECT DATE_FORMAT(fecha, '%d/%m/%Y, %H:%i') AS ultima_fecha
        FROM asistencias
        WHERE usuario_id = ?
        ORDER BY fecha DESC
        LIMIT 1
      `;
      const [lastAttendanceRows] = await pool.query(lastAttendanceQuery, [userId]);
      const ultimaAsistencia = lastAttendanceRows[0]?.ultima_fecha || 'Sin registros en el mes';

      // 4. Consultar rutina asignada al socio (basada en rutina_activa_id)
      const routineQuery = `
        SELECT r.nombre, r.tipo, r.frecuencia
        FROM usuarios u
        LEFT JOIN rutinas r ON u.rutina_activa_id = r.id
        WHERE u.id = ?
      `;
      const [routineRows] = await pool.query(routineQuery, [userId]);
      let routine = routineRows[0]?.nombre ? routineRows[0] : null;
      if (!routine) {
        const [fallbackRows] = await pool.query('SELECT nombre, tipo, frecuencia FROM rutinas ORDER BY id ASC LIMIT 1');
        routine = fallbackRows[0] || {
          nombre: 'Fuerza e Hipertrofia (PPL)',
          tipo: 'Hipertrofia',
          frecuencia: '4 dias por semana'
        };
      }

      // 5. Generar punto pulsante dinámico según el estado real de la membresía
      const esActiva = (membership.estado || '').toLowerCase() === 'activa';
      const dotColor = esActiva ? 'emerald' : 'red';
      const membresiaDotsHtml = `
        <span class="animate-ping absolute inline-flex h-full w-full rounded-full bg-${dotColor}-400 opacity-75"></span>
        <span class="relative inline-flex rounded-full h-3.5 w-3.5 bg-${dotColor}-500"></span>
      `;

      const bannerMembresiaHtml = !esActiva
        ? `
          <div class="mt-4 p-3.5 bg-red-950/60 border border-red-800/80 rounded-xl text-xs text-red-200 flex items-start space-x-2.5">
            <span class="text-base leading-none">⚠️</span>
            <div>
              <p class="font-bold uppercase tracking-wide text-red-300">Membresía Vencida o Inactiva</p>
              <p class="text-[11px] text-zinc-300 mt-0.5">
                Por favor, acércate a recepción con tu DNI para renovar tu plan presencialmente y continuar entrenando.
              </p>
            </div>
          </div>
        `
        : '';

      // 6. Cargar la plantilla HTML e inyectar los datos reales obtenidos
      const templatePath = path.join(__dirname, '..', 'views', 'socio-dashboard.html');
      let html = await fs.promises.readFile(templatePath, 'utf8');

      const volverEntrenadorHtml = userRole === 'entrenador'
        ? '<a href="/entrenador-dashboard" class="bg-yellow-400 text-zinc-950 font-bold px-4 py-2 rounded-lg hover:bg-yellow-300 transition-all text-xs uppercase tracking-wider shadow-md inline-flex items-center">PANEL ENTRENADOR</a>'
        : '';

      html = html
        .replace(/{{USER_NAME}}/g, userName)
        .replace(/{{USER_EMAIL}}/g, userEmail)
        .replace('{{VOLVER_PANEL_ENTRENADOR_HTML}}', volverEntrenadorHtml)
        .replace('{{MEMBRESIA_DOT_HTML}}', membresiaDotsHtml)
        .replace('{{BANNER_MEMBRESIA_HTML}}', bannerMembresiaHtml)
        .replace(/{{MEMBRESIA_TIPO}}/g, membership.tipo)
        .replace(/{{MEMBRESIA_ESTADO}}/g, membership.estado)
        .replace(/{{MEMBRESIA_VENCIMIENTO}}/g, membership.fecha_vencimiento)
        .replace(/{{TOTAL_ASISTENCIAS_NUMERO}}/g, String(totalAsistencias))
        .replace(/{{ULTIMA_ASISTENCIA}}/g, ultimaAsistencia)
        .replace(/{{RUTINA_NOMBRE}}/g, routine.nombre)
        .replace(/{{RUTINA_TIPO}}/g, routine.tipo)
        .replace(/{{RUTINA_FRECUENCIA}}/g, routine.frecuencia);

      return res.status(200).send(html);
    } catch (error) {
      console.error('Error al consultar datos en MySQL para el socio:', error.message);

      const templatePath = path.join(__dirname, '..', 'views', 'socio-dashboard.html');
      let html = await fs.promises.readFile(templatePath, 'utf8');

      const fallbackVolverHtml = userRole === 'entrenador'
        ? '<a href="/entrenador-dashboard" class="bg-yellow-400 text-zinc-950 font-bold px-4 py-2 rounded-lg hover:bg-yellow-300 transition-all text-xs uppercase tracking-wider shadow-md inline-flex items-center">PANEL ENTRENADOR</a>'
        : '';

      const fallbackDotHtml = '<span class="relative inline-flex rounded-full h-3.5 w-3.5 bg-zinc-500"></span>';

      html = html
        .replace(/{{USER_NAME}}/g, userName)
        .replace(/{{USER_EMAIL}}/g, userEmail)
        .replace('{{VOLVER_PANEL_ENTRENADOR_HTML}}', fallbackVolverHtml)
        .replace('{{MEMBRESIA_DOT_HTML}}', fallbackDotHtml)
        .replace('{{BANNER_MEMBRESIA_HTML}}', '')
        .replace(/{{MEMBRESIA_TIPO}}/g, 'Consultando...')
        .replace(/{{MEMBRESIA_ESTADO}}/g, 'Sin Conexion')
        .replace(/{{MEMBRESIA_VENCIMIENTO}}/g, 'Pendiente de sincronizacion')
        .replace(/{{TOTAL_ASISTENCIAS_NUMERO}}/g, '0')
        .replace(/{{ULTIMA_ASISTENCIA}}/g, 'No disponible')
        .replace(/{{RUTINA_NOMBRE}}/g, 'Asignacion en curso')
        .replace(/{{RUTINA_TIPO}}/g, 'General')
        .replace(/{{RUTINA_FRECUENCIA}}/g, 'Por definir');

      return res.status(200).send(html);
    }
  },

  getDashboardData: async (req, res) => {
    const userId = req.session.user.id;
    try {
      const [membershipRows] = await pool.query(
        `SELECT tipo, estado, DATE_FORMAT(fecha_vencimiento, '%d/%m/%Y') AS fecha_vencimiento
         FROM membresias WHERE usuario_id = ? ORDER BY id DESC LIMIT 1`,
        [userId]
      );

      const [attendanceRows] = await pool.query(
        `SELECT COUNT(*) AS total
         FROM asistencias
         WHERE usuario_id = ?
           AND MONTH(fecha) = MONTH(CURDATE())
           AND YEAR(fecha) = YEAR(CURDATE())`,
        [userId]
      );

      const [lastAttendanceRows] = await pool.query(
        `SELECT DATE_FORMAT(fecha, '%d/%m/%Y, %H:%i') AS ultima_fecha
         FROM asistencias WHERE usuario_id = ? ORDER BY fecha DESC LIMIT 1`,
        [userId]
      );

      return res.status(200).json({
        success: true,
        usuario: req.session.user,
        membresia: membershipRows[0] || null,
        asistenciasMes: attendanceRows[0]?.total || 0,
        ultimaAsistencia: lastAttendanceRows[0]?.ultima_fecha || null
      });
    } catch (err) {
      return res.status(500).json({ success: false, error: err.message });
    }
  }
};

module.exports = socioDashboardController;
