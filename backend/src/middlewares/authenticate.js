import jwt from 'jsonwebtoken';

/**
 * Extrae el token del header Authorization: Bearer <token>
 */
const extractToken = (req) => {
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return null;
  }

  return authHeader.split(' ')[1];
};

/**
 * Middleware de autenticación
 */
const authenticate = (req, res, next) => {
  const token = extractToken(req);

  if (!token) {
    return res.status(401).json({
      error: 'Unauthorized',
      message: 'Se requiere autenticación. Token no proporcionado.',
    });
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    req.usuario = decoded;

    return next();
  } catch (error) {
    if (error.name === 'TokenExpiredError') {
      return res.status(401).json({
        error: 'Unauthorized',
        message: 'El token ha expirado. Inicie sesión nuevamente.',
      });
    }

    return res.status(401).json({
      error: 'Unauthorized',
      message: 'Token inválido.',
    });
  }
};

export default authenticate;