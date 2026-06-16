// src/middlewares/authorize.js
// Verifica que el usuario autenticado tenga uno de los roles permitidos

export const ROLES = {
  ADMINISTRADOR: 'ADMINISTRADOR',
  ENCARGADO_CONVIVENCIA: 'ENCARGADO_CONVIVENCIA',
  DOCENTE: 'DOCENTE',
  INSPECTOR: 'INSPECTOR',
  ORIENTADOR: 'ORIENTADOR',
  EQUIPO_DIRECTIVO: 'EQUIPO_DIRECTIVO',
};

/**
 * Middleware de autorización por rol.
 * Uso: authorize(ROLES.INSPECTOR, ROLES.ADMINISTRADOR)
 */
export const authorize = (...rolesPermitidos) => {
  return (req, res, next) => {
    if (!req.usuario) {
      return res.status(401).json({
        error: 'Unauthorized',
        message: 'No autenticado.',
      });
    }

    if (!rolesPermitidos.includes(req.usuario.rol)) {
      return res.status(403).json({
        error: 'Forbidden',
        message: 'No tienes permisos para realizar esta acción.',
      });
    }

    next();
  };
};
