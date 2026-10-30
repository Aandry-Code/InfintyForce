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
const socioDashboardRoutes = require('./routes/socioDashboardRoutes');
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

// Rutas de autenticacion, asistencias, rutinas, nutricion, tienda, administracion, entrenadores y socios
app.use('/', authRoutes);
app.use('/', asistenciaRoutes);
app.use('/', rutinasRoutes);
app.use('/', nutricionRoutes);
app.use('/', tiendaRoutes);
app.use('/', adminRoutes);
app.use('/', entrenadorRoutes);
app.use('/', socioDashboardRoutes);

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
