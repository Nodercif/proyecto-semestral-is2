// src/utils/hash.js
// Utilidad para generar hashes de contraseñas
// Usar en seeds o scripts de creación de usuarios

const bcrypt = require('bcryptjs');

const SALT_ROUNDS = 12; // Factor de costo recomendado para producción

/**
 * Genera un hash bcrypt para una contraseña en texto plano.
 * @param {string} plainPassword
 * @returns {Promise<string>} hash
 */
const hashPassword = async (plainPassword) => {
  return bcrypt.hash(plainPassword, SALT_ROUNDS);
};

/**
 * Verifica si una contraseña coincide con su hash almacenado.
 * @param {string} plainPassword
 * @param {string} hash
 * @returns {Promise<boolean>}
 */
const verifyPassword = async (plainPassword, hash) => {
  return bcrypt.compare(plainPassword, hash);
};

module.exports = { hashPassword, verifyPassword, SALT_ROUNDS };
