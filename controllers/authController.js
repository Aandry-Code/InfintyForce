const bcrypt = require('bcrypt');
const { pool } = require('../database/db');

const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

const authController = {
  login: async (req, res) => {
    const { email, password } = req.body;

    if (!email || !password) {
      if (req.xhr || req.headers.accept?.includes('application/json')) {
        return res.status(400).json({
          success: false,
          message: 'Debe ingresar su correo electrónico y contraseña.'
        });
      }
      return res.redirect('/login?error=campos_requeridos');
    }

    const cleanEmail = String(email).trim().toLowerCase();
    const cleanPassword = String(password);

    // Validacion previa de formato de correo antes de consultar MySQL
    if (!cleanEmail || !emailRegex.test(cleanEmail)) {
      if (req.xhr || req.headers.accept?.includes('application/json')) {
        return res.status(400).json({
          success: false,
          message: 'El correo electrónico no tiene un formato válido.'
        });
      }
      return res.redirect('/login?error=credenciales_invalidas');
    }

    if (!cleanPassword.trim()) {
      if (req.xhr || req.headers.accept?.includes('application/json')) {
        return res.status(400).json({
          success: false,
          message: 'Debe ingresar una contraseña válida.'
        });
      }
      return res.redirect('/login?error=campos_requeridos');
    }

    try {
      const query = 'SELECT id, nombre, email, password_hash, rol FROM usuarios WHERE email = ?';
      const [rows] = await pool.query(query, [cleanEmail]);

      // Respuesta generica para evitar enumeracion de usuarios
      const mensajeGenerico = 'Credenciales inválidas. Verifique sus datos.';

      if (rows.length === 0) {
        if (req.xhr || req.headers.accept?.includes('application/json')) {
          return res.status(401).json({
            success: false,
            message: mensajeGenerico
          });
        }
        return res.redirect('/login?error=credenciales_invalidas');
      }

      const user = rows[0];
      const passwordMatch = await bcrypt.compare(cleanPassword, user.password_hash);

      if (!passwordMatch) {
        if (req.xhr || req.headers.accept?.includes('application/json')) {
          return res.status(401).json({
            success: false,
            message: mensajeGenerico
          });
        }
        return res.redirect('/login?error=credenciales_invalidas');
      }

      let redirectUrl = '/socio-dashboard';
      if (user.rol === 'admin') {
        redirectUrl = '/admin-dashboard';
      } else if (user.rol === 'entrenador') {
        redirectUrl = '/entrenador-dashboard';
      }

      // Proteccion contra Session Fixation: regenerar sesion al autenticarse
      req.session.regenerate((err) => {
        if (err) {
          console.error('Error al regenerar la sesión:', err.message);
          if (req.xhr || req.headers.accept?.includes('application/json')) {
            return res.status(500).json({ success: false, message: 'Error de sesión.' });
          }
          return res.redirect('/login?error=error_servidor');
        }

        req.session.user = {
          id: user.id,
          nombre: user.nombre,
          email: user.email,
          rol: user.rol
        };

        if (req.xhr || req.headers.accept?.includes('application/json')) {
          return res.status(200).json({
            success: true,
            redirectUrl: redirectUrl,
            user: req.session.user
          });
        }

        return res.redirect(redirectUrl);
      });
    } catch (error) {
      console.error('Error al procesar la autenticacion en MySQL:', error.message);
      if (req.xhr || req.headers.accept?.includes('application/json')) {
        return res.status(500).json({
          success: false,
          message: 'Error interno del servidor al procesar la solicitud.'
        });
      }
      return res.redirect('/login?error=error_servidor');
    }
  },

  logout: (req, res) => {
    req.session.destroy((err) => {
      if (err) {
        console.error('Error al destruir la sesion:', err.message);
      }
      res.clearCookie('connect.sid');
      return res.redirect('/login');
    });
  },

  getCurrentUser: (req, res) => {
    if (!req.session || !req.session.user) {
      return res.status(401).json({
        authenticated: false,
        message: 'No hay sesion activa.'
      });
    }

    return res.status(200).json({
      authenticated: true,
      user: req.session.user
    });
  }
};

module.exports = authController;
