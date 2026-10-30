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
          <div class="col-span-full p-12 bg-zinc-950/40 border border-zinc-800 rounded-2xl text-center space-y-3">
            <div class="w-12 h-12 mx-auto rounded-full bg-zinc-800 flex items-center justify-center text-brand-yellow font-mono font-bold text-sm">
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
            <div id="solicitud-card-${sol.solicitud_id}" class="bg-zinc-950/70 border border-zinc-800 rounded-2xl p-6 shadow-xl hover:border-zinc-700 transition flex flex-col justify-between space-y-6">
              
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
              <div class="space-y-3 pt-2 border-t border-zinc-800/80">
                <p class="text-[11px] font-bold uppercase tracking-wider text-brand-yellow">Perfil Biometrico del Socio:</p>
                
                <div class="grid grid-cols-3 gap-2">
                  <div class="bg-zinc-900/90 border border-zinc-800 rounded-xl p-3 text-center">
                    <span class="text-[10px] font-semibold uppercase text-zinc-400 block">Peso</span>
                    <span class="text-sm font-extrabold font-mono text-white">${pesoDisplay} kg</span>
                  </div>
                  <div class="bg-zinc-900/90 border border-zinc-800 rounded-xl p-3 text-center">
                    <span class="text-[10px] font-semibold uppercase text-zinc-400 block">Edad</span>
                    <span class="text-sm font-extrabold font-mono text-white">${sol.edad} anos</span>
                  </div>
                  <div class="bg-zinc-900/90 border border-zinc-800 rounded-xl p-3 text-center">
                    <span class="text-[10px] font-semibold uppercase text-zinc-400 block">Estatura</span>
                    <span class="text-sm font-extrabold font-mono text-white">${alturaDisplay} cm</span>
                  </div>
                </div>

                <!-- Objetivo y Frecuencia -->
                <div class="grid grid-cols-2 gap-2 text-xs">
                  <div class="bg-zinc-900/70 border border-zinc-800 rounded-xl p-2.5">
                    <span class="text-[10px] uppercase font-bold text-zinc-400 block">Objetivo:</span>
                    <span class="text-white font-bold uppercase">${sol.objetivo}</span>
                  </div>
                  <div class="bg-zinc-900/70 border border-zinc-800 rounded-xl p-2.5">
                    <span class="text-[10px] uppercase font-bold text-zinc-400 block">Frecuencia:</span>
                    <span class="text-brand-yellow font-mono font-bold">${sol.dias_semana} dias / sem</span>
                  </div>
                </div>

                <!-- Lesiones / Observaciones Medicas -->
                <div class="bg-zinc-900/50 border border-zinc-800/90 rounded-xl p-3 space-y-1">
                  <span class="text-[10px] uppercase font-bold text-red-400 tracking-wider block">Lesiones / Historial Clinico:</span>
                  <p class="text-xs text-zinc-300 italic">${sol.lesiones}</p>
                </div>

                ${sol.observaciones && sol.observaciones !== sol.lesiones ? `
                  <div class="bg-zinc-900/30 border border-zinc-800/60 rounded-xl p-3 space-y-1">
                    <span class="text-[10px] uppercase font-bold text-zinc-400 tracking-wider block">Observaciones adicionales:</span>
                    <p class="text-xs text-zinc-400">${sol.observaciones}</p>
                  </div>
                ` : ''}
              </div>

              <!-- Accion de Armado de Plan -->
              <div class="pt-4 border-t border-zinc-800 flex items-center justify-between gap-3">
                <button
                  type="button"
                  onclick="abrirModalArmarPlan(${sol.solicitud_id}, '${sanitizedNombre}', '${sanitizedObjetivo}', ${sol.dias_semana}, ${pesoDisplay}, ${sol.edad}, '${sanitizedLesiones}')"
                  class="w-full py-3 px-4 text-xs font-bold uppercase tracking-wider bg-brand-yellow hover:bg-[#c2ea00] text-zinc-950 rounded-xl shadow-md transition duration-150 active:scale-95 text-center"
                >
                  Armar Plan de Entrenamiento
                </button>
              </div>

            </div>
          `;
        }).join('');
      }

      // Carga de la vista HTML del entrenador
      const templatePath = path.join(__dirname, '..', 'views', 'entrenador-dashboard.html');
      let html = await fs.promises.readFile(templatePath, 'utf8');

      html = html
        .replace(/{{ENTRENADOR_NAME}}/g, entrenadorName)
        .replace(/{{ENTRENADOR_EMAIL}}/g, entrenadorEmail)
        .replace(/{{TOTAL_PENDIENTES}}/g, String(solicitudes.length))
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

    try {
      const updateQuery = `
        UPDATE solicitudes_rutina
        SET estado = 'Aprobada'
        WHERE id = ?
      `;
      const [updateResult] = await pool.query(updateQuery, [solicitudId]);

      if (updateResult.affectedRows === 0) {
        return res.status(404).json({
          success: false,
          message: 'Solicitud de entrenamiento no encontrada.'
        });
      }

      const [solicitudRows] = await pool.query(
        'SELECT id, usuario_id, objetivo, dias_semana, estado FROM solicitudes_rutina WHERE id = ?',
        [solicitudId]
      );

      return res.status(200).json({
        success: true,
        message: 'Plan de entrenamiento estructurado y asignado correctamente.',
        solicitud: solicitudRows[0]
      });
    } catch (error) {
      console.error('Error al procesar asignacion de rutina por el entrenador en MySQL:', error.message);
      return res.status(500).json({
        success: false,
        message: 'Error interno en el servidor al registrar el plan de entrenamiento.'
      });
    }
  }
};

module.exports = entrenadorController;
