const path = require('path');
const fs = require('fs');
const { pool } = require('../database/db');

const entrenadorController = {
  renderEntrenadorDashboard: async (req, res) => {
    const entrenadorName = req.session.user.nombre;
    const entrenadorEmail = req.session.user.email;

    try {
      // Consulta a MySQL de solicitudes_rutina con estado 'Pendiente'
      // realizando JOIN con usuarios para obtener datos biometricos (peso, altura, edad, genero)
      const solicitudesQuery = `
        SELECT sr.id AS solicitud_id,
               sr.usuario_id,
               u.nombre AS socio_nombre,
               u.email AS socio_email,
               sr.objetivo,
               sr.dias_semana,
               sr.observaciones,
               sr.estado,
               DATE_FORMAT(sr.fecha_solicitud, '%d/%m/%Y, %H:%i') AS fecha_solicitud,
               COALESCE(u.peso, 75.0) AS peso,
               COALESCE(u.altura, 175.0) AS altura,
               COALESCE(u.edad, 26) AS edad,
               COALESCE(u.genero, 'No especificado') AS genero,
               COALESCE(sr.observaciones, 'Sin lesiones registradas') AS lesiones
        FROM solicitudes_rutina sr
        JOIN usuarios u ON sr.usuario_id = u.id
        WHERE sr.estado = 'Pendiente'
        ORDER BY sr.id DESC
      `;
      const [solicitudes] = await pool.query(solicitudesQuery);

      // Consulta de rutinas disponibles en catalogo
      const [rutinas] = await pool.query('SELECT id, nombre, tipo, frecuencia FROM rutinas ORDER BY id ASC');

      const rutinasOptionsHtml = rutinas.map(r => `
        <option value="${r.id}">
          ${r.nombre} &bull; ${r.tipo} (${r.frecuencia})
        </option>
      `).join('');

      // Construccion de las tarjetas (Cards) de solicitudes de entrenamiento
      let tarjetasSolicitudesHtml = '';

      if (solicitudes.length === 0) {
        tarjetasSolicitudesHtml = `
          <div class="col-span-full p-12 bg-zinc-800/40 border border-zinc-800 rounded-xl text-center space-y-3">
            <div class="w-12 h-12 mx-auto rounded-full bg-zinc-800 flex items-center justify-center text-yellow-400 font-mono font-bold text-sm">
              0
            </div>
            <h3 class="text-base font-bold text-white uppercase tracking-wider">Sin solicitudes pendientes</h3>
            <p class="text-xs text-zinc-400 max-w-md mx-auto">
              Actualmente todos los socios tienen sus planes de entrenamiento al dia. Nuevas solicitudes ingresadas por los socios apareceran aqui.
            </p>
          </div>
        `;
      } else {
        tarjetasSolicitudesHtml = solicitudes.map(sol => {
          const sanitizedNombre = sol.socio_nombre.replace(/'/g, "\\'");
          const sanitizedObjetivo = sol.objetivo.replace(/'/g, "\\'");
          const sanitizedLesiones = (sol.lesiones || '').replace(/'/g, "\\'").replace(/\n/g, ' ');
          const sanitizedObs = (sol.observaciones || '').replace(/'/g, "\\'").replace(/\n/g, ' ');
          const pesoDisplay = parseFloat(sol.peso);
          const alturaDisplay = parseFloat(sol.altura);

          return `
            <div id="solicitud-card-${sol.solicitud_id}" class="bg-zinc-800/50 hover:bg-zinc-800/70 border border-zinc-800 hover:border-yellow-400/50 rounded-xl p-6 shadow-xl transition flex flex-col justify-between space-y-6">
              
              <!-- Cabecera de Tarjeta -->
              <div class="space-y-3">
                <div class="flex items-center justify-between">
                  <span class="px-2.5 py-1 text-[10px] font-mono font-bold uppercase tracking-wider bg-amber-950 text-amber-300 border border-amber-800 rounded-md">
                    ${sol.estado}
                  </span>
                  <span class="text-[11px] text-zinc-500 font-mono">
                    Solicitud #${sol.solicitud_id} &bull; ${sol.fecha_solicitud}
                  </span>
                </div>

                <div>
                  <h3 class="text-lg font-extrabold text-white uppercase tracking-wide">${sol.socio_nombre}</h3>
                  <p class="text-xs text-zinc-400 font-mono">${sol.socio_email}</p>
                </div>
              </div>

              <!-- Grilla de Parametros y Datos Biometricos (JOIN) -->
              <div class="space-y-3 pt-2 border-t border-zinc-800">
                <p class="text-[11px] font-bold uppercase tracking-wider text-yellow-400">Perfil Biometrico del Socio:</p>
                
                <div class="grid grid-cols-3 gap-2">
                  <div class="bg-zinc-800 border border-zinc-700/80 rounded-xl p-3 text-center">
                    <span class="text-[10px] font-semibold uppercase text-zinc-400 block">Peso</span>
                    <span class="text-sm font-extrabold font-mono text-white">${pesoDisplay} kg</span>
                  </div>
                  <div class="bg-zinc-800 border border-zinc-700/80 rounded-xl p-3 text-center">
                    <span class="text-[10px] font-semibold uppercase text-zinc-400 block">Edad</span>
                    <span class="text-sm font-extrabold font-mono text-white">${sol.edad} anos</span>
                  </div>
                  <div class="bg-zinc-800 border border-zinc-700/80 rounded-xl p-3 text-center">
                    <span class="text-[10px] font-semibold uppercase text-zinc-400 block">Estatura</span>
                    <span class="text-sm font-extrabold font-mono text-white">${alturaDisplay} cm</span>
                  </div>
                </div>

                <!-- Objetivo y Frecuencia -->
                <div class="grid grid-cols-2 gap-2 text-xs">
                  <div class="bg-zinc-800 border border-zinc-700/80 rounded-xl p-2.5">
                    <span class="text-[10px] uppercase font-bold text-zinc-400 block">Objetivo:</span>
                    <span class="text-white font-bold uppercase">${sol.objetivo}</span>
                  </div>
                  <div class="bg-zinc-800 border border-zinc-700/80 rounded-xl p-2.5">
                    <span class="text-[10px] uppercase font-bold text-zinc-400 block">Frecuencia:</span>
                    <span class="text-yellow-400 font-mono font-bold">${sol.dias_semana} dias / sem</span>
                  </div>
                </div>

                <!-- Lesiones / Observaciones Medicas -->
                <div class="bg-zinc-800/80 border border-zinc-700/80 rounded-xl p-3 space-y-1">
                  <span class="text-[10px] uppercase font-bold text-red-400 tracking-wider block">Lesiones / Historial Clinico:</span>
                  <p class="text-xs text-zinc-300 italic">${sol.lesiones}</p>
                </div>

                ${sol.observaciones && sol.observaciones !== sol.lesiones ? `
                  <div class="bg-zinc-800/40 border border-zinc-700/60 rounded-xl p-3 space-y-1">
                    <span class="text-[10px] uppercase font-bold text-zinc-400 tracking-wider block">Observaciones adicionales:</span>
                    <p class="text-xs text-zinc-400">${sol.observaciones}</p>
                  </div>
                ` : ''}
              </div>

              <!-- Accion de Armado de Plan y Rechazo -->
              <div class="pt-4 border-t border-zinc-800 flex items-center gap-2">
                <button
                  type="button"
                  onclick="abrirModalArmarPlan(${sol.solicitud_id}, '${sanitizedNombre}', '${sanitizedObjetivo}', ${sol.dias_semana}, ${pesoDisplay}, ${sol.edad}, '${sanitizedLesiones}')"
                  class="flex-1 py-3 px-3 text-xs font-bold uppercase tracking-wider bg-yellow-400 hover:bg-yellow-300 text-zinc-950 rounded-xl shadow-md transition duration-150 active:scale-95 text-center"
                >
                  Armar Plan
                </button>
                <button
                  type="button"
                  onclick="abrirModalRechazar(${sol.solicitud_id}, '${sanitizedNombre}')"
                  class="px-4 py-3 text-xs font-bold uppercase tracking-wider border border-red-800 bg-red-950/40 hover:bg-red-900/60 text-red-300 rounded-xl transition duration-150 active:scale-95 text-center"
                >
                  Rechazar
                </button>
              </div>

            </div>
          `;
        }).join('');
      }

      // Solicitudes aprobadas por este entrenador en el mes
      const [aprobadasRows] = await pool.query(
        "SELECT COUNT(*) AS total FROM solicitudes_rutina WHERE estado = 'Aprobada' AND MONTH(fecha_solicitud) = MONTH(CURDATE())"
      );
      const totalAprobadas = aprobadasRows[0]?.total || 0;

      // Total de socios con membresía activa
      const [sociosActivosRows] = await pool.query(
        "SELECT COUNT(DISTINCT m.usuario_id) AS total FROM membresias m WHERE m.estado = 'Activa'"
      );
      const totalSociosActivos = sociosActivosRows[0]?.total || 0;

      // Carga de la vista HTML del entrenador
      const templatePath = path.join(__dirname, '..', 'views', 'entrenador-dashboard.html');
      let html = await fs.promises.readFile(templatePath, 'utf8');

      html = html
        .replace(/{{ENTRENADOR_NAME}}/g, entrenadorName)
        .replace(/{{ENTRENADOR_EMAIL}}/g, entrenadorEmail)
        .replace(/{{TOTAL_PENDIENTES}}/g, String(solicitudes.length))
        .replace(/{{TOTAL_APROBADAS_MES}}/g, String(totalAprobadas))
        .replace(/{{TOTAL_SOCIOS_ACTIVOS}}/g, String(totalSociosActivos))
        .replace('{{TARJETAS_SOLICITUDES_HTML}}', tarjetasSolicitudesHtml)
        .replace('{{RUTINAS_OPTIONS_HTML}}', rutinasOptionsHtml);

      return res.status(200).send(html);
    } catch (error) {
      console.error('Error al renderizar el dashboard del entrenador en MySQL:', error.message);
      return res.status(500).send('Error interno al cargar el panel de entrenadores.');
    }
  },

  renderAsignarRutina: async (req, res) => {
    const solicitudId = req.query.solicitudId;
    return res.redirect(`/entrenador-dashboard?armar=${solicitudId || ''}`);
  },

  asignarRutina: async (req, res) => {
    const { solicitudId, rutinaId, observacionesEntrenador } = req.body;

    if (!solicitudId) {
      return res.status(400).json({
        success: false,
        message: 'Debe especificar el identificador de la solicitud de rutina.'
      });
    }

    const rutinaIdNum = rutinaId ? parseInt(rutinaId, 10) : null;
    const obsLimpia = observacionesEntrenador ? String(observacionesEntrenador).trim() : null;

    try {
      // 1. Obtener la solicitud para validar existencia y obtener el usuario_id
      const [solicitudRows] = await pool.query(
        'SELECT id, usuario_id, objetivo, dias_semana, estado FROM solicitudes_rutina WHERE id = ?',
        [solicitudId]
      );

      if (solicitudRows.length === 0) {
        return res.status(404).json({
          success: false,
          message: 'Solicitud de entrenamiento no encontrada.'
        });
      }

      const targetUserId = solicitudRows[0].usuario_id;

      // 2. Actualizar solicitudes_rutina con estado Aprobada, rutina_id y observaciones_entrenador
      const updateQuery = `
        UPDATE solicitudes_rutina
        SET estado = 'Aprobada',
            rutina_id = ?,
            observaciones_entrenador = ?
        WHERE id = ?
      `;
      await pool.query(updateQuery, [rutinaIdNum, obsLimpia, solicitudId]);

      // 3. Actualizar rutina_activa_id en la tabla usuarios
      if (rutinaIdNum) {
        await pool.query(
          'UPDATE usuarios SET rutina_activa_id = ? WHERE id = ?',
          [rutinaIdNum, targetUserId]
        );
      }

      const [updatedRows] = await pool.query(
        'SELECT id, usuario_id, rutina_id, objetivo, dias_semana, observaciones_entrenador, estado FROM solicitudes_rutina WHERE id = ?',
        [solicitudId]
      );

      return res.status(200).json({
        success: true,
        message: 'Plan de entrenamiento estructurado y asignado correctamente.',
        solicitud: updatedRows[0]
      });
    } catch (error) {
      console.error('Error al procesar asignacion de rutina por el entrenador en MySQL:', error.message);
      return res.status(500).json({
        success: false,
        message: 'Error interno en el servidor al registrar el plan de entrenamiento.'
      });
    }
  },

  rechazarSolicitud: async (req, res) => {
    const { solicitudId, motivo } = req.body;
    if (!solicitudId || !motivo || !motivo.trim()) {
      return res.status(400).json({ success: false, message: 'Debe especificar el motivo u observación del rechazo.' });
    }
    try {
      const [result] = await pool.query(
        "UPDATE solicitudes_rutina SET estado = 'Rechazada', observaciones_entrenador = ? WHERE id = ?",
        [motivo.trim(), solicitudId]
      );
      if (result.affectedRows === 0) {
        return res.status(404).json({ success: false, message: 'Solicitud no encontrada.' });
      }
      return res.status(200).json({
        success: true,
        message: 'Solicitud rechazada con observaciones técnicas registradas para el socio.'
      });
    } catch (error) {
      console.error('Error al rechazar solicitud:', error.message);
      return res.status(500).json({ success: false, message: 'Error interno al rechazar la solicitud.' });
    }
  },

  getHistorialSolicitudes: async (req, res) => {
    try {
      const [rows] = await pool.query(`
        SELECT sr.id, sr.objetivo, sr.estado, sr.observaciones_entrenador,
               DATE_FORMAT(sr.fecha_solicitud, '%d/%m/%Y') AS fecha,
               u.nombre AS socio_nombre,
               r.nombre AS rutina_nombre
        FROM solicitudes_rutina sr
        JOIN usuarios u ON sr.usuario_id = u.id
        LEFT JOIN rutinas r ON sr.rutina_id = r.id
        WHERE sr.estado IN ('Aprobada', 'Rechazada')
        ORDER BY sr.id DESC
        LIMIT 30
      `);
      return res.status(200).json({ success: true, solicitudes: rows });
    } catch (error) {
      console.error('Error al cargar historial de solicitudes del entrenador:', error.message);
      return res.status(500).json({ success: false, message: 'Error al cargar historial.' });
    }
  }
};

module.exports = entrenadorController;
