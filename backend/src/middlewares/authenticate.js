// src/middlewares/authenticate.js
// Verifica el JWT enviado en el header Authorization: Bearer <token>

import jwt from 'jsonwebtoken';

const authenticate = (req, res, next) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1]; // "Bearer <token>"

  if (!token) {
    return res.status(401).json({
      error: 'Unauthorized',
      message: 'Se requiere token de autenticación.',
    });
  }

  try {
    const payload = jwt.verify(token, process.env.JWT_SECRET);
    req.usuario = payload; // { sub, email, rol, funcionarioId }
    next();
  } catch {
    return res.status(401).json({
      error: 'Unauthorized',
      message: 'Token inválido o expirado.',
    });
  }
};

export default authenticate;
