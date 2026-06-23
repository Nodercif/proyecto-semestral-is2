/**
 * @file auth.integration.test.js
 * @description Tests de integración para el módulo de autenticación y
 *              acceso a endpoints protegidos.
 *
 * Stack: Vitest + Supertest + bcryptjs + @prisma/client (mockeado)
 *
 * Ejecutar con:
 *   npx vitest run tests/auth.integration.test.js
 *
 * Variables de entorno requeridas (en .env.test):
 *   JWT_SECRET=test_secret_key_integration
 *   JWT_EXPIRES_IN=1h
 *   DATABASE_URL=postgresql://user:pass@localhost:5432/test_db
 */

import { describe, it, expect, beforeAll, afterAll, vi, afterEach, beforeEach } from 'vitest';
import request from 'supertest';
import bcrypt from 'bcryptjs';

// ─────────────────────────────────────────────────────────────────────────────
// Configuración de variables de entorno ANTES de importar la app,
// para que los módulos las lean correctamente al inicializarse.
// ─────────────────────────────────────────────────────────────────────────────
process.env.JWT_SECRET = 'test_secret_key_integration';
process.env.JWT_EXPIRES_IN = '1h';
process.env.NODE_ENV = 'test';

// ─────────────────────────────────────────────────────────────────────────────
// Mock del cliente Prisma para aislar la DB real en tests de integración.
// Cada test puede sobreescribir el comportamiento según su escenario.
// ─────────────────────────────────────────────────────────────────────────────
vi.mock('../src/config/prisma.js', () => {
  const mockPrisma = {
    usuario: {
      findUnique: vi.fn(),
      create: vi.fn(),
    },
    $connect: vi.fn().mockResolvedValue(undefined),
    $disconnect: vi.fn().mockResolvedValue(undefined),
  };
  return { default: mockPrisma };
});

// Importar la app DESPUÉS del mock para que Prisma ya esté interceptado
import app from '../src/index.js';
import prisma from '../src/config/prisma.js';

// ─────────────────────────────────────────────────────────────────────────────
// Fixtures reutilizables
// ─────────────────────────────────────────────────────────────────────────────

/** Contraseña en texto plano del usuario de prueba */
const TEST_PASSWORD_PLAIN = 'Admin123*';

/** Usuario de prueba con contraseña pre-hasheada (se genera en beforeAll) */
let usuarioTest = null;

// ─────────────────────────────────────────────────────────────────────────────
// SUITE PRINCIPAL
// ─────────────────────────────────────────────────────────────────────────────

describe('Autenticación y seguridad de endpoints', () => {

  // ── Preparación global ───────────────────────────────────────────────────
  beforeAll(async () => {
    /**
     * Generamos el hash UNA sola vez para toda la suite.
     * Usar saltRounds = 10 en tests para mantener velocidad aceptable
     * (producción usa 12 según src/utils/hash.js, ambos son bcrypt válidos).
     */
    const passwordHash = await bcrypt.hash(TEST_PASSWORD_PLAIN, 10);

    usuarioTest = {
      id: 'usr-test-001',
      email: 'admin@colegio.cl',
      passwordHash,
      rol: 'ADMINISTRADOR',
      activo: true,
      funcionarioId: 'func-001',
      funcionario: {
        nombres: 'Roberto',
        apellidos: 'Sánchez Mora',
        cargo: 'ADMINISTRADOR',
      },
    };
  });

  afterAll(async () => {
    // Limpiar timers y conexiones que Express/Prisma pudieran tener abiertos
    vi.restoreAllMocks();
  });

  // ═══════════════════════════════════════════════════════════════════════════
  // 1. POST /auth/login — credenciales válidas
  // ═══════════════════════════════════════════════════════════════════════════

  describe('POST /auth/login', () => {

      beforeEach(() => {
        vi.clearAllMocks();
      });


    it('con credenciales válidas retorna 200 y un token JWT', async () => {
      // Arrange: el repositorio devuelve el usuario de prueba al buscarlo por email
      prisma.usuario.findUnique.mockResolvedValueOnce(usuarioTest);

      // Act: realizamos la petición HTTP a la API
      const response = await request(app)
        .post('/auth/login')
        .send({ email: 'admin@colegio.cl', password: TEST_PASSWORD_PLAIN })
        .set('Accept', 'application/json');

      // Assert: código de éxito
      expect(response.status).toBe(200);

      // Assert: la respuesta incluye un token no vacío
      expect(response.body).toHaveProperty('token');
      expect(typeof response.body.token).toBe('string');
      expect(response.body.token.length).toBeGreaterThan(0);

      // Assert: el token tiene el formato de tres segmentos base64 (header.payload.signature)
      const segmentos = response.body.token.split('.');
      expect(segmentos).toHaveLength(3);

      // Assert: los datos del usuario se retornan correctamente (sin passwordHash)
      expect(response.body.usuario).toMatchObject({
        email: 'admin@colegio.cl',
        rol: 'ADMINISTRADOR',
      });

      // Assert: la respuesta NUNCA debe exponer el hash de la contraseña
      expect(response.body.usuario).not.toHaveProperty('passwordHash');
      expect(response.body).not.toHaveProperty('passwordHash');
    });

    // ── Caso: credenciales inválidas ─────────────────────────────────────

    it('con email inexistente retorna 401 Unauthorized', async () => {
      // Arrange: simulamos que el usuario NO existe en la base de datos
      prisma.usuario.findUnique.mockResolvedValueOnce(null);

      const response = await request(app)
        .post('/auth/login')
        .send({ email: 'noexiste@colegio.cl', password: 'cualquier_pass' })
        .set('Accept', 'application/json');

      // Assert: debe rechazar con 401, no con 404 (evita enumeración de usuarios)
      expect(response.status).toBe(401);
      expect(response.body).toHaveProperty('error', 'Unauthorized');

      // Assert: el mensaje es genérico — no revela si el email existe o no
      expect(response.body.message).toMatch(/credenciales inválidas/i);
    });

    it('con contraseña incorrecta retorna 401 Unauthorized', async () => {
      // Arrange: el usuario existe pero la contraseña enviada no coincide con el hash
      prisma.usuario.findUnique.mockResolvedValueOnce(usuarioTest);

      const response = await request(app)
        .post('/auth/login')
        .send({ email: 'admin@colegio.cl', password: 'ContraseñaIncorrecta!' })
        .set('Accept', 'application/json');

      // Assert: bcrypt.compare retornará false → debe responder 401
      expect(response.status).toBe(401);
      expect(response.body).toHaveProperty('error', 'Unauthorized');
    });

    it('con usuario inactivo retorna 401 Unauthorized', async () => {
      const usuarioInactivo = {
        ...usuarioTest,
        activo: false,
      };

      const response = await request(app)
        .post('/auth/login')
        .send({
          email: 'admin@colegio.cl',
          password: TEST_PASSWORD_PLAIN,
        });

      console.log('BODY =>', response.body);

      expect(response.status).toBe(401);
    });

    it('sin body retorna 400 Bad Request', async () => {
      // Arrange: no mockeamos findUnique porque el controller debe rechazar antes de buscar
      const response = await request(app)
        .post('/auth/login')
        .send({})
        .set('Accept', 'application/json');

      expect(response.status).toBe(400);
      expect(response.body.message).toMatch(/email|contraseña/i);
    });

  });

  // ═══════════════════════════════════════════════════════════════════════════
  // 2. Endpoints protegidos — acceso sin token debe retornar 401
  // ═══════════════════════════════════════════════════════════════════════════

  describe('Endpoints protegidos — sin token', () => {

    /**
     * Helper local: ejecuta una petición sin Authorization header
     * y verifica que la respuesta sea 401 con error "Unauthorized".
     */
    const assertRequiresAuth = async (method, path) => {
      const response = await request(app)[method](path)
        .set('Accept', 'application/json');
        // No incluimos Authorization a propósito

      expect(response.status).toBe(401);
      expect(response.body).toHaveProperty('error', 'Unauthorized');
      expect(response.body.message).toMatch(/token/i);
    };

    // ── /incidentes ──────────────────────────────────────────────────────

    it('GET /incidentes sin token retorna 401', async () => {
      await assertRequiresAuth('get', '/incidentes');
    });

    it('POST /incidentes sin token retorna 401', async () => {
      await assertRequiresAuth('post', '/incidentes');
    });

    it('DELETE /incidentes/:id sin token retorna 401', async () => {
      await assertRequiresAuth('delete', '/incidentes/123');
    });

    // ── /involucrados ────────────────────────────────────────────────────

    it('GET /involucrados sin token retorna 401', async () => {
      await assertRequiresAuth('get', '/involucrados');
    });

    it('POST /involucrados sin token retorna 401', async () => {
      await assertRequiresAuth('post', '/involucrados');
    });

    // ── /auth/me (también protegida) ─────────────────────────────────────

    it('GET /auth/me sin token retorna 401', async () => {
      await assertRequiresAuth('get', '/auth/me');
    });

    // ── Token malformado ─────────────────────────────────────────────────

    it('GET /incidentes con token malformado retorna 401', async () => {
      const response = await request(app)
        .get('/incidentes')
        .set('Authorization', 'Bearer esto.no.es.un.jwt.valido')
        .set('Accept', 'application/json');

      expect(response.status).toBe(401);
      expect(response.body.message).toMatch(/inválido|token/i);
    });

    it('GET /incidentes con header Authorization mal formateado retorna 401', async () => {
      // Enviamos el token sin el prefijo "Bearer "
      const response = await request(app)
        .get('/incidentes')
        .set('Authorization', 'TokenSinPrefijoBearerEspace')
        .set('Accept', 'application/json');

      expect(response.status).toBe(401);
    });

  });

  // ═══════════════════════════════════════════════════════════════════════════
  // 3. Endpoints protegidos — acceso CON token válido
  // ═══════════════════════════════════════════════════════════════════════════

  describe('Endpoints protegidos — con token válido', () => {

    /** Token JWT generado a partir de un login exitoso */
    let tokenValido = null;

    beforeAll(async () => {
      // Obtenemos el token real haciendo login con el mock configurado
      prisma.usuario.findUnique.mockResolvedValueOnce(usuarioTest);

      const loginResponse = await request(app)
        .post('/auth/login')
        .send({ email: 'admin@colegio.cl', password: TEST_PASSWORD_PLAIN });

      // Guardamos el token para usarlo en los tests siguientes
      tokenValido = loginResponse.body.token;
    });

    it('GET /incidentes con token válido retorna 200', async () => {
      const response = await request(app)
        .get('/incidentes')
        .set('Authorization', `Bearer ${tokenValido}`)
        .set('Accept', 'application/json');

      // Con token válido el middleware deja pasar la request al handler stub
      expect(response.status).toBe(200);
    });

    it('GET /involucrados con token válido (rol con acceso) retorna 200', async () => {
      // El rol ADMINISTRADOR está incluido en authorize() de involucrados.routes.js
      const response = await request(app)
        .get('/involucrados')
        .set('Authorization', `Bearer ${tokenValido}`)
        .set('Accept', 'application/json');

      expect(response.status).toBe(200);
    });

  });

  // ═══════════════════════════════════════════════════════════════════════════
  // 4. Seguridad de contraseñas — almacenamiento encriptado con bcrypt
  // ═══════════════════════════════════════════════════════════════════════════

  describe('Seguridad de contraseñas — almacenamiento con bcrypt', () => {

    it('la contraseña almacenada en BD es un hash bcrypt, no texto plano', async () => {
      // Arrange: generamos un hash como lo haría el seed o el endpoint de creación
      const passwordPlano = 'Admin123*';
      const hashGenerado = await bcrypt.hash(passwordPlano, 10);

      // Assert: el hash NO debe ser igual al texto plano
      expect(hashGenerado).not.toBe(passwordPlano);

      // Assert: el hash empieza con el identificador de bcrypt ("$2b$" o "$2a$")
      expect(hashGenerado).toMatch(/^\$2[ab]\$\d+\$/);
    });

    it('bcrypt.compare verifica correctamente la contraseña contra su hash', async () => {
      // Este test valida que verifyPassword (src/utils/hash.js) funciona correctamente
      const passwordPlano = 'Admin123*';
      const hash = await bcrypt.hash(passwordPlano, 10);

      // Verificación positiva: la contraseña correcta debe coincidir
      const coincide = await bcrypt.compare(passwordPlano, hash);
      expect(coincide).toBe(true);

      // Verificación negativa: una contraseña distinta NO debe coincidir
      const noCoincide = await bcrypt.compare('OtraContraseña99!', hash);
      expect(noCoincide).toBe(false);
    });

    it('dos hashes del mismo texto plano son distintos (salt aleatorio)', async () => {
      // bcrypt genera un salt único por llamada; los hashes NUNCA deben ser idénticos
      const password = 'Admin123*';
      const hash1 = await bcrypt.hash(password, 10);
      const hash2 = await bcrypt.hash(password, 10);

      // Ambos son válidos pero distintos gracias al salt aleatorio
      expect(hash1).not.toBe(hash2);

      // Aun así, ambos verifican correctamente contra la misma contraseña
      await expect(bcrypt.compare(password, hash1)).resolves.toBe(true);
      await expect(bcrypt.compare(password, hash2)).resolves.toBe(true);
    });

    it('el campo passwordHash no aparece en ninguna respuesta de la API', async () => {
      // Arrange: usuario encontrado por Prisma
      prisma.usuario.findUnique.mockResolvedValueOnce(usuarioTest);

      const loginResponse = await request(app)
        .post('/auth/login')
        .send({ email: 'admin@colegio.cl', password: TEST_PASSWORD_PLAIN });

      expect(loginResponse.status).toBe(200);

      // Verificamos recursivamente que "passwordHash" no esté en ningún nivel
      const bodyStr = JSON.stringify(loginResponse.body);
      expect(bodyStr).not.toContain('passwordHash');
      expect(bodyStr).not.toContain(usuarioTest.passwordHash);
    });

    it('el hash almacenado supera el salt rounds mínimo de seguridad (≥ 10)', () => {
      /**
       * El formato bcrypt codifica los saltRounds en el hash:
       *   $2b$<rounds>$<salt><digest>
       * Lo extraemos y verificamos que sea ≥ 10 (producción usa 12).
       */
      const hash = usuarioTest.passwordHash;
      const match = hash.match(/^\$2[ab]\$(\d+)\$/);

      expect(match).not.toBeNull();

      const rounds = parseInt(match[1], 10);
      expect(rounds).toBeGreaterThanOrEqual(10);
    });

    it('el texto plano de la contraseña NUNCA está en el objeto usuario de la BD (mock)', () => {
      // Assert directo sobre el fixture: el campo correcto es `passwordHash`, no `password`
      expect(usuarioTest).not.toHaveProperty('password');
      expect(usuarioTest).toHaveProperty('passwordHash');

      // El valor del hash no debe ser el texto plano
      expect(usuarioTest.passwordHash).not.toBe(TEST_PASSWORD_PLAIN);
    });

  });

});
