const bcrypt = require('bcrypt');
const { pool } = require('../database/config');

const authController = {
  login: async (req, res) => {
    const { email, password } = req.body;

    if (!email || !password) {
      if (req.xhr || req.headers.accept?.includes('application/json')) {
        return res.status(400).json({
          success: false,
          message: 'Debe ingresar su correo electronico y contrasena.'
        });
      }
      return res.redirect('/login?error=campos_requeridos');
    }

    try {
      const cleanEmail = email.trim().toLowerCase();
      const query = 'SELECT id, nombre, email, password_hash, rol FROM Usuarios WHERE email = $1';
      const result = await pool.query(query, [cleanEmail]);

      if (result.rows.length === 0) {
        if (req.xhr || req.headers.accept?.includes('application/json')) {
          return res.status(401).json({
            success: false,
            message: 'Credenciales invalidas. Verifique los datos ingresados.'
          });
        }
        return res.redirect('/login?error=credenciales_invalidas');
      }

      const user = result.rows[0];
      const passwordMatch = await bcrypt.compare(password, user.password_hash);

      if (!passwordMatch) {
        if (req.xhr || req.headers.accept?.includes('application/json')) {
          return res.status(401).json({
            success: false,
            message: 'Credenciales invalidas. Verifique los datos ingresados.'
          });
        }
        return res.redirect('/login?error=credenciales_invalidas');
      }

      req.session.user = {
        id: user.id,
        nombre: user.nombre,
        email: user.email,
        rol: user.rol
      };

      let redirectUrl = '/socio-dashboard';
      if (user.rol === 'admin') {
        redirectUrl = '/admin-dashboard';
      } else if (user.rol === 'entrenador') {
        redirectUrl = '/entrenador-dashboard';
      }

      if (req.xhr || req.headers.accept?.includes('application/json')) {
        return res.status(200).json({
          success: true,
          redirectUrl: redirectUrl,
          user: req.session.user
        });
      }

      return res.redirect(redirectUrl);
    } catch (error) {
      console.error('Error al procesar la autenticacion en PostgreSQL:', error.message);
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
