require('dotenv').config();
const express = require('express');
const session = require('express-session');
const path = require('path');
const fs = require('fs');
const { pool, initDatabase } = require('./database/db');
const authRoutes = require('./routes/authRoutes');
const asistenciaRoutes = require('./routes/asistenciaRoutes');
const rutinasRoutes = require('./routes/rutinasRoutes');
const nutricionRoutes = require('./routes/nutricionRoutes');
const tiendaRoutes = require('./routes/tiendaRoutes');
const adminRoutes = require('./routes/adminRoutes');
const entrenadorRoutes = require('./routes/entrenadorRoutes');
const { requireAuth, requireRole } = require('./routes/authMiddleware');

const app = express();
const PORT = process.env.PORT || 3000;

// Middlewares para procesamiento de peticiones HTTP
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Servidor de archivos estaticos
app.use(express.static(path.join(__dirname, 'public')));

// Configuracion de sesion
app.use(
  session({
    secret: process.env.SESSION_SECRET || 'infinite_force_gym_secure_session_key_2026',
    resave: false,
    saveUninitialized: false,
    cookie: {
      secure: false,
      httpOnly: true,
      maxAge: 1000 * 60 * 60 * 24
    }
  })
);

// Rutas de autenticacion, asistencias, rutinas, nutricion, tienda, administracion y entrenadores
app.use('/', authRoutes);
app.use('/', asistenciaRoutes);
app.use('/', rutinasRoutes);
app.use('/', nutricionRoutes);
app.use('/', tiendaRoutes);
app.use('/', adminRoutes);
app.use('/', entrenadorRoutes);

// Ruta raiz
app.get('/', (req, res) => {
  if (req.session && req.session.user) {
    if (req.session.user.rol === 'admin') {
      return res.redirect('/admin-dashboard');
    }
    if (req.session.user.rol === 'entrenador') {
      return res.redirect('/entrenador-dashboard');
    }
    return res.redirect('/socio-dashboard');
  }
  res.redirect('/login');
});

// Ruta GET /login
app.get('/login', (req, res) => {
  if (req.session && req.session.user) {
    if (req.session.user.rol === 'admin') {
      return res.redirect('/admin-dashboard');
    }
    if (req.session.user.rol === 'entrenador') {
      return res.redirect('/entrenador-dashboard');
    }
    return res.redirect('/socio-dashboard');
  }
  res.sendFile(path.join(__dirname, 'views', 'login.html'));
});

// Ruta GET /socio-dashboard (Consulta en MySQL y renderizado de vista HTML)
app.get('/socio-dashboard', requireRole('socio'), async (req, res) => {
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

    // 4. Consultar rutina asignada
    const routineQuery = `
      SELECT nombre, tipo, frecuencia
      FROM rutinas
      ORDER BY id ASC
      LIMIT 1
    `;
    const [routineRows] = await pool.query(routineQuery);
    const routine = routineRows[0] || {
      nombre: 'Fuerza e Hipertrofia (PPL)',
      tipo: 'Hipertrofia',
      frecuencia: '4 dias por semana'
    };

    // 5. Cargar la plantilla HTML e inyectar los datos reales obtenidos
    const templatePath = path.join(__dirname, 'views', 'socio-dashboard.html');
    let html = await fs.promises.readFile(templatePath, 'utf8');

    const volverEntrenadorHtml = userRole === 'entrenador'
      ? '<a href="/entrenador-dashboard" class="px-3.5 py-1.5 text-xs font-bold uppercase tracking-wider bg-brand-yellow hover:bg-[#c2ea00] text-zinc-950 rounded-xl transition duration-150 shadow-md">Panel Entrenador</a>'
      : '';

    html = html
      .replace(/{{USER_NAME}}/g, userName)
      .replace(/{{USER_EMAIL}}/g, userEmail)
      .replace('{{VOLVER_PANEL_ENTRENADOR_HTML}}', volverEntrenadorHtml)
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

    const templatePath = path.join(__dirname, 'views', 'socio-dashboard.html');
    let html = await fs.promises.readFile(templatePath, 'utf8');

    html = html
      .replace(/{{USER_NAME}}/g, userName)
      .replace(/{{USER_EMAIL}}/g, userEmail)
      .replace('{{VOLVER_PANEL_ENTRENADOR_HTML}}', '')
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
});

// Endpoint API para consultar metricas del socio en formato JSON
app.get('/api/socio/dashboard-data', requireRole('socio'), async (req, res) => {
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
});

// Inicializacion del servicio
async function startServer() {
  try {
    await initDatabase();
    console.log('Base de datos MySQL sincronizada correctamente.');
  } catch (dbError) {
    console.warn('Aviso: Fallo la inicializacion automatica de la base de datos MySQL:', dbError.message);
    console.warn('Verifique los valores en el archivo .env e inicie su servicio MySQL.');
  }

  app.listen(PORT, () => {
    console.log('====================================================');
    console.log(`Servidor Infinite Force Gym iniciado en el puerto ${PORT}`);
    console.log(`Acceso web disponible en: http://localhost:${PORT}`);
    console.log('====================================================');
  });
}

startServer();
