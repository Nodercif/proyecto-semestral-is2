// src/middleware/authorize.js

// Middleware de autorización por roles – usa el payload del JWT ya verificado

/**
 * Roles válidos del sistema
 * (deben coincidir con el enum RolSistema en BD)
 */
export const ROLES = {
  ADMINISTRADOR: 'ADMINISTRADOR',
  ENCARGADO_CONVIVENCIA: 'ENCARGADO_CONVIVENCIA',
  DOCENTE: 'DOCENTE',
  INSPECTOR: 'INSPECTOR',
  ORIENTADOR: 'ORIENTADOR',
  EQUIPO_DIRECTIVO: 'EQUIPO_DIRECTIVO',
};

/**
 * Factory de middleware de autorización.
 *
 * Uso:
 * authorize('ADMINISTRADOR', 'ENCARGADO_CONVIVENCIA')
 *
 * IMPORTANTE: debe usarse DESPUÉS de authenticate.
 *
 * @param  {...string} rolesPermitidos
 */
export const authorize = (...rolesPermitidos) => {
  return (req, res, next) => {
    // authenticate ya debió ejecutarse antes
    if (!req.usuario) {
      return res.status(401).json({
        error: 'Unauthorized',
        message: 'No autenticado.',
      });
    }

    const rolUsuario = req.usuario.rol;

    if (!rolesPermitidos.includes(rolUsuario)) {
      return res.status(403).json({
        error: 'Forbidden',
        message: `Acceso denegado. Se requiere uno de los siguientes roles: ${rolesPermitidos.join(', ')}.`,
      });
    }

    return next();
  };
};