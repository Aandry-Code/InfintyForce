function requireAuth(req, res, next) {
  if (!req.session || !req.session.user) {
    return res.redirect('/login');
  }
  next();
}

function requireRole(allowedRoles) {
  const roles = Array.isArray(allowedRoles) ? allowedRoles : [allowedRoles];

  return (req, res, next) => {
    if (!req.session || !req.session.user) {
      return res.redirect('/login');
    }

    const userRole = req.session.user.rol;

    // Regla de permisos:
    // 1. Coincidencia directa de rol
    // 2. El rol 'entrenador' tiene permiso extendido para acceder a las vistas y modulos del socio
    const isAllowed = roles.includes(userRole) || (roles.includes('socio') && userRole === 'entrenador');

    if (!isAllowed) {
      if (userRole === 'admin') {
        return res.redirect('/admin-dashboard');
      }
      if (userRole === 'entrenador') {
        return res.redirect('/entrenador-dashboard');
      }
      return res.redirect('/socio-dashboard');
    }

    next();
  };
}

module.exports = {
  requireAuth,
  requireRole
};
