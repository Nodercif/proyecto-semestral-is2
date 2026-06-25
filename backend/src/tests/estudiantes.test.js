/**
 * Tests — GET /estudiantes (búsqueda por nombre y/o curso)
 * Usa Vitest + Supertest + Prisma mockeado.
 * Se genera un token JWT real para autenticar.
 */

// ── Configuración de entorno ──────────────────────────────────────────────
process.env.JWT_SECRET = 'test_secret_for_students';

// ── Imports ──────────────────────────────────────────────────────────────
import { vi, describe, it, expect, beforeAll, beforeEach } from 'vitest';
import request from 'supertest';
import express from 'express';
import jwt from 'jsonwebtoken';

// ── Mock de Prisma ──────────────────────────────────────────────────────
const mockPrisma = {
  estudiante: {
    findMany: vi.fn(),
    count: vi.fn(),
    findUnique: vi.fn(),
  },
  involucrado: {
    findMany: vi.fn(),
  },
};

vi.mock('@prisma/client', () => {
  function PrismaClientMock() {
    return mockPrisma;
  }
  return { PrismaClient: PrismaClientMock };
});

// ── Datos de prueba ────────────────────────────────────────────────────
const estudiantesMock = [
  { id: 1, rut: '11111111-1', nombres: 'Gabriela', apellidos: 'Muñoz', curso: '3°A' },
  { id: 2, rut: '22222222-2', nombres: 'Gabriel', apellidos: 'Torres', curso: '3°A' },
  { id: 3, rut: '33333333-3', nombres: 'Diego', apellidos: 'Alday', curso: '4°B' },
];

// Generamos un token real
const tokenReal = jwt.sign(
  { sub: 1, email: 'inspector@colegio.cl', rol: 'INSPECTOR', funcionarioId: 10 },
  process.env.JWT_SECRET,
  { expiresIn: '1h' }
);
const TOKEN = `Bearer ${tokenReal}`;

// ── Construir app para tests ──────────────────────────────────────────────
let app;

beforeAll(async () => {
  const mod = await import('../routes/estudiantes.routes.js');
  app = express();
  app.use(express.json());
  app.use('/estudiantes', mod.default);
});

describe('GET /estudiantes', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  // ── Autenticación ──────────────────────────────────────────────────────
  describe('🔒 Autenticación', () => {
    it('debe retornar 401 si no se envía token', async () => {
      const res = await request(app).get('/estudiantes');
      expect(res.status).toBe(401);
    });
  });

  // ── Sin parámetros ──────────────────────────────────────────────────
  describe('📋 Sin parámetros', () => {
    it('debe retornar todos los estudiantes paginados con 200', async () => {
      mockPrisma.estudiante.count.mockResolvedValue(3);
      mockPrisma.estudiante.findMany.mockResolvedValue(estudiantesMock);

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
      mockPrisma.estudiante.count.mockResolvedValue(3);
      mockPrisma.estudiante.findMany.mockResolvedValue([estudiantesMock[0]]);

      const res = await request(app)
        .get('/estudiantes?page=1&limit=1')
        .set('Authorization', TOKEN);

      expect(res.status).toBe(200);
      expect(res.body.paginacion.limit).toBe(1);
      expect(res.body.paginacion.totalPaginas).toBe(3);
    });
  });

  // ── Búsqueda por nombre parcial ────────────────────────────────────────
  describe('🔍 Búsqueda por nombre parcial', () => {
    it('"Gab" debe encontrar a Gabriela y Gabriel', async () => {
      const resultado = estudiantesMock.filter(e => e.nombres.startsWith('Gab'));
      mockPrisma.estudiante.count.mockResolvedValue(resultado.length);
      mockPrisma.estudiante.findMany.mockResolvedValue(resultado);

      const res = await request(app)
        .get('/estudiantes?nombre=Gab')
        .set('Authorization', TOKEN);

      expect(res.status).toBe(200);
      expect(res.body.data).toHaveLength(2);
      expect(res.body.data.map(e => e.nombres)).toContain('Gabriela');
      expect(res.body.data.map(e => e.nombres)).toContain('Gabriel');

      const llamada = mockPrisma.estudiante.findMany.mock.calls[0][0];
      expect(llamada.where.OR).toBeDefined();
      expect(llamada.where.OR[0].nombres.contains).toBe('Gab');
    });

    it('debe retornar [] con 200 si no hay coincidencias', async () => {
      mockPrisma.estudiante.count.mockResolvedValue(0);
      mockPrisma.estudiante.findMany.mockResolvedValue([]);

      const res = await request(app)
        .get('/estudiantes?nombre=XYZ_inexistente')
        .set('Authorization', TOKEN);

      expect(res.status).toBe(200);
      expect(res.body.data).toEqual([]);
      expect(res.body.paginacion.total).toBe(0);
    });
  });

  // ── Búsqueda por curso ──────────────────────────────────────────────────
  describe('🏫 Búsqueda por curso', () => {
    it('debe retornar solo los estudiantes del curso indicado', async () => {
      const resultado = estudiantesMock.filter(e => e.curso === '3°A');
      mockPrisma.estudiante.count.mockResolvedValue(resultado.length);
      mockPrisma.estudiante.findMany.mockResolvedValue(resultado);

      const res = await request(app)
        .get('/estudiantes?curso=3°A')
        .set('Authorization', TOKEN);

      expect(res.status).toBe(200);
      expect(res.body.data).toHaveLength(2);
      expect(res.body.data.every(e => e.curso === '3°A')).toBe(true);

      const llamada = mockPrisma.estudiante.findMany.mock.calls[0][0];
      expect(llamada.where.curso).toBeDefined();
    });
  });

  // ── Combinación de filtros ──────────────────────────────────────────────
  describe('🔗 Combinación nombre + curso', () => {
    it('debe aplicar ambos filtros a la vez', async () => {
      const resultado = [estudiantesMock[0]];
      mockPrisma.estudiante.count.mockResolvedValue(1);
      mockPrisma.estudiante.findMany.mockResolvedValue(resultado);

      const res = await request(app)
        .get('/estudiantes?nombre=Gabriela&curso=3°A')
        .set('Authorization', TOKEN);

      expect(res.status).toBe(200);
      expect(res.body.data).toHaveLength(1);
      expect(res.body.data[0].nombres).toBe('Gabriela');

      const llamada = mockPrisma.estudiante.findMany.mock.calls[0][0];
      expect(llamada.where.OR).toBeDefined();
      expect(llamada.where.curso).toBeDefined();
    });

    it('debe retornar [] si ningún estudiante cumple ambos filtros', async () => {
      mockPrisma.estudiante.count.mockResolvedValue(0);
      mockPrisma.estudiante.findMany.mockResolvedValue([]);

      const res = await request(app)
        .get('/estudiantes?nombre=Diego&curso=3°A')
        .set('Authorization', TOKEN);

      expect(res.status).toBe(200);
      expect(res.body.data).toEqual([]);
    });
  });
});