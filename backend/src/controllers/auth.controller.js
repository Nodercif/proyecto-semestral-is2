// src/controllers/auth.controller.js
// Controlador de autenticación – login y validación de credenciales

import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import prisma from '../config/prisma.js';

/**
 * POST /auth/login
 * Body: { email, password }
 *
 * Flujo:
 *  1. Busca usuario por email
 *  2. Verifica que esté activo
 *  3. Compara contraseña con hash almacenado
 *  4. Genera y retorna JWT
 */
export const login = async (req, res) => {
  const { email, password } = req.body;

  // Validación básica de campos requeridos
  if (!email || !password) {
    return res.status(400).json({
      error: 'Credenciales incompletas',
      message: 'Se requieren email y contraseña.',
    });
  }

  try {
    // 1. Buscar usuario por email, incluyendo datos del funcionario
    const usuario = await prisma.usuario.findUnique({
      where: { email: email.toLowerCase().trim() },
      include: {
        funcionario: {
          select: { nombres: true, apellidos: true, cargo: true },
        },
      },
    });

    // 2. Verificar existencia
    if (!usuario) {
      return res.status(401).json({
        error: 'Unauthorized',
        message: 'Credenciales inválidas.',
      });
    }

    // 3. Verificar que el usuario esté activo
    if (!usuario.activo) {
      return res.status(401).json({
        error: 'Unauthorized',
        message: 'La cuenta está desactivada. Contacte al administrador.',
      });
    }

    // 4. Comparar contraseña con hash almacenado
    const passwordValida = await bcrypt.compare(
      password,
      usuario.passwordHash
    );

    if (!passwordValida) {
      return res.status(401).json({
        error: 'Unauthorized',
        message: 'Credenciales inválidas.',
      });
    }

    // 5. Generar JWT
    const payload = {
      sub: usuario.id,
      email: usuario.email,
      rol: usuario.rol,
      funcionarioId: usuario.funcionarioId,
    };

    const token = jwt.sign(payload, process.env.JWT_SECRET, {
      expiresIn: process.env.JWT_EXPIRES_IN || '8h',
    });

    // 6. Respuesta exitosa
    return res.status(200).json({
      token,
      usuario: {
        id: usuario.id,
        email: usuario.email,
        rol: usuario.rol,
        nombres: usuario.funcionario?.nombres,
        apellidos: usuario.funcionario?.apellidos,
        cargo: usuario.funcionario?.cargo,
      },
    });
  } catch (error) {
    console.error('[auth.controller] Error en login:', error);

    return res.status(500).json({
      error: 'Error interno',
      message: 'Ocurrió un error al procesar la solicitud.',
    });
  }
};

/**
 * GET /auth/me
 * Retorna los datos del usuario autenticado
 */
export const me = async (req, res) => {
  try {
    const usuario = await prisma.usuario.findUnique({
      where: { id: req.usuario.sub },
      select: {
        id: true,
        email: true,
        rol: true,
        activo: true,
        funcionario: {
          select: {
            nombres: true,
            apellidos: true,
            cargo: true,
            rut: true,
          },
        },
      },
    });

    if (!usuario) {
      return res.status(404).json({
        error: 'Usuario no encontrado.',
      });
    }

    return res.status(200).json({ usuario });
  } catch (error) {
    console.error('[auth.controller] Error en /me:', error);

    return res.status(500).json({
      error: 'Error interno.',
    });
  }
};