/**
 * Tests — GET /estudiantes (búsqueda por nombre y/o curso)
 *
 * Se mockea Prisma para no necesitar base de datos real.
 * Se usa Supertest para simular requests HTTP.
 *
 * Cubre todos los criterios de aceptación de la tarea:
 * - Búsqueda por nombre parcial
 * - Búsqueda por curso exacto
 * - Combinación de ambos filtros
 * - Sin coincidencias retorna [] con 200
 * - Sin parámetros retorna todos (paginado)
 * - Requiere autenticación (401 sin token)
 */

// ── Mock de Prisma ─────────────────────────────────────────────────────────────
jest.mock('@prisma/client', () => {
  const mockPrisma = {
    estudiante: {
      findMany: jest.fn(),
      count: jest.fn(),
      findUnique: jest.fn(),
    },
    involucrado: {
      findMany: jest.fn(),
    },
  };
  return { PrismaClient: jest.fn(() => mockPrisma) };
});

// ── Mock de JWT para simular autenticación ────────────────────────────────────
jest.mock('jsonwebtoken', () => ({
  verify: jest.fn(() => ({
    sub: 1,
    email: 'inspector@colegio.cl',
    rol: 'INSPECTOR',
    funcionarioId: 10,
  })),
  sign: jest.fn(() => 'token-mock'),
}));

const request  = require('supertest');
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

// Importar app DESPUÉS de los mocks
let app;
beforeAll(async () => {
  const mod = await import('../src/routes/estudiantes.routes.js');
  const express = (await import('express')).default;
  app = express();
  app.use(express.json());
  app.use('/estudiantes', mod.default);
});

// ── Datos de prueba ────────────────────────────────────────────────────────────
const estudiantesMock = [
  { id: 1, rut: '11111111-1', nombres: 'Gabriela', apellidos: 'Muñoz', curso: '3°A' },
  { id: 2, rut: '22222222-2', nombres: 'Gabriel',  apellidos: 'Torres', curso: '3°A' },
  { id: 3, rut: '33333333-3', nombres: 'Diego',    apellidos: 'Alday',  curso: '4°B' },
];

const TOKEN = 'Bearer token-valido';

// ── Tests ──────────────────────────────────────────────────────────────────────
describe('GET /estudiantes', () => {
  beforeEach(() => jest.clearAllMocks());

  // ── Autenticación ────────────────────────────────────────────────────────────
  describe('🔒 Autenticación', () => {
    it('debe retornar 401 si no se envía token', async () => {
      const res = await request(app).get('/estudiantes');
      expect(res.status).toBe(401);
    });
  });

  // ── Sin parámetros → todos paginados ─────────────────────────────────────────
  describe('📋 Sin parámetros', () => {
    it('debe retornar todos los estudiantes paginados con 200', async () => {
      prisma.estudiante.count.mockResolvedValue(3);
      prisma.estudiante.findMany.mockResolvedValue(estudiantesMock);

      const res = await request(app)
        .get('/estudiantes')
        .set('Authorization', TOKEN);

      expect(res.status).toBe(200);
      expect(res.body.data).toHaveLength(3);
      expect(res.body.paginacion).toBeDefined();
      expect(res.body.paginacion.total).toBe(3);
      expect(res.body.paginacion.page).toBe(1);
    });

    it('debe respetar los parámetros de paginación page y limit', async () => {
      prisma.estudiante.count.mockResolvedValue(3);
      prisma.estudiante.findMany.mockResolvedValue([estudiantesMock[0]]);

      const res = await request(app)
        .get('/estudiantes?page=1&limit=1')
        .set('Authorization', TOKEN);

      expect(res.status).toBe(200);
      expect(res.body.paginacion.limit).toBe(1);
      expect(res.body.paginacion.totalPaginas).toBe(3);
    });
  });

  // ── Búsqueda por nombre parcial ───────────────────────────────────────────────
  describe('🔍 Búsqueda por nombre parcial', () => {
    it('"Gab" debe encontrar a Gabriela y Gabriel', async () => {
      const resultado = estudiantesMock.filter(e => e.nombres.startsWith('Gab'));
      prisma.estudiante.count.mockResolvedValue(resultado.length);
      prisma.estudiante.findMany.mockResolvedValue(resultado);

      const res = await request(app)
        .get('/estudiantes?nombre=Gab')
        .set('Authorization', TOKEN);

      expect(res.status).toBe(200);
      expect(res.body.data).toHaveLength(2);
      expect(res.body.data.map(e => e.nombres)).toContain('Gabriela');
      expect(res.body.data.map(e => e.nombres)).toContain('Gabriel');

      // Verifica que Prisma recibió el filtro correcto
      const llamada = prisma.estudiante.findMany.mock.calls[0][0];
      expect(llamada.where.OR).toBeDefined();
      expect(llamada.where.OR[0].nombres.contains).toBe('Gab');
    });

    it('debe retornar [] con 200 si no hay coincidencias', async () => {
      prisma.estudiante.count.mockResolvedValue(0);
      prisma.estudiante.findMany.mockResolvedValue([]);

      const res = await request(app)
        .get('/estudiantes?nombre=XYZ_inexistente')
        .set('Authorization', TOKEN);

      expect(res.status).toBe(200);
      expect(res.body.data).toEqual([]);
      expect(res.body.paginacion.total).toBe(0);
    });
  });

  // ── Búsqueda por curso ────────────────────────────────────────────────────────
  describe('🏫 Búsqueda por curso', () => {
    it('debe retornar solo los estudiantes del curso indicado', async () => {
      const resultado = estudiantesMock.filter(e => e.curso === '3°A');
      prisma.estudiante.count.mockResolvedValue(resultado.length);
      prisma.estudiante.findMany.mockResolvedValue(resultado);

      const res = await request(app)
        .get('/estudiantes?curso=3°A')
        .set('Authorization', TOKEN);

      expect(res.status).toBe(200);
      expect(res.body.data).toHaveLength(2);
      expect(res.body.data.every(e => e.curso === '3°A')).toBe(true);

      const llamada = prisma.estudiante.findMany.mock.calls[0][0];
      expect(llamada.where.curso).toBeDefined();
    });
  });

  // ── Combinación de filtros ────────────────────────────────────────────────────
  describe('🔗 Combinación nombre + curso', () => {
    it('debe aplicar ambos filtros a la vez', async () => {
      const resultado = [estudiantesMock[0]]; // solo Gabriela en 3°A
      prisma.estudiante.count.mockResolvedValue(1);
      prisma.estudiante.findMany.mockResolvedValue(resultado);

      const res = await request(app)
        .get('/estudiantes?nombre=Gabriela&curso=3°A')
        .set('Authorization', TOKEN);

      expect(res.status).toBe(200);
      expect(res.body.data).toHaveLength(1);
      expect(res.body.data[0].nombres).toBe('Gabriela');

      // Verifica que el filtro tiene tanto OR (nombre) como curso
      const llamada = prisma.estudiante.findMany.mock.calls[0][0];
      expect(llamada.where.OR).toBeDefined();
      expect(llamada.where.curso).toBeDefined();
    });

    it('debe retornar [] si ningún estudiante cumple ambos filtros', async () => {
      prisma.estudiante.count.mockResolvedValue(0);
      prisma.estudiante.findMany.mockResolvedValue([]);

      const res = await request(app)
        .get('/estudiantes?nombre=Diego&curso=3°A')
        .set('Authorization', TOKEN);

      expect(res.status).toBe(200);
      expect(res.body.data).toEqual([]);
    });
  });
});
