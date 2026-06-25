// tests/incidentesEdit.test.js
import { describe, it, expect, vi, beforeAll, beforeEach } from 'vitest'
import express from 'express'
import request from 'supertest'
import jwt from 'jsonwebtoken'

process.env.JWT_SECRET = 'test_secret_key'

// ─────────────────────────────────────────────────────────────────────────────
// Mock de @prisma/client
// ─────────────────────────────────────────────────────────────────────────────
const { prismaMock } = vi.hoisted(() => {
  const prismaMock = {
    incidente: {
      findUnique: vi.fn(),
      update: vi.fn(),
    },
    estudiante: {
      findUnique: vi.fn(),
    },
    funcionarioInstitucional: {
      findUnique: vi.fn(),
    },
    involucrado: {
      findMany: vi.fn(),
      update: vi.fn(),
      create: vi.fn(),
      deleteMany: vi.fn(),
    },
    $transaction: vi.fn((callback) => callback(prismaMock)),
  }
  return { prismaMock }
})

vi.mock('@prisma/client', () => ({
  PrismaClient: vi.fn(function () {
    return prismaMock
  }),
}))

// ─────────────────────────────────────────────────────────────────────────────
// Mock de jsonwebtoken para evitar dependencia de JWT_SECRET en tests
// ─────────────────────────────────────────────────────────────────────────────
vi.mock('jsonwebtoken', () => ({
  default: {
    sign: vi.fn((payload) => `token-${payload.rol}`), // token incluye el rol
    verify: vi.fn((token) => {
      if (token && token.includes('DOCENTE')) {
        return { id: 'u1', rol: 'DOCENTE', funcionarioId: 1, sub: 1, email: 'docente@colegio.cl' }
      }
      if (token && token.includes('ENCARGADO_CONVIVENCIA')) {
        return { id: 'u1', rol: 'ENCARGADO_CONVIVENCIA', funcionarioId: 1, sub: 1, email: 'encargado@colegio.cl' }
      }
      return { id: 'u1', rol: 'ADMINISTRADOR', funcionarioId: 1, sub: 1, email: 'admin@colegio.cl' }
    }),
  },
}))

// ─────────────────────────────────────────────────────────────────────────────
// Helpers de fixtures
// ─────────────────────────────────────────────────────────────────────────────
const generarToken = (rol = 'ADMINISTRADOR') => {
  const payload = { id: 'u1', rol, funcionarioId: 1 }
  return jwt.sign(payload, process.env.JWT_SECRET)
}

const incidenteBase = {
  id: 5,
  fecha: new Date('2026-01-10T10:00:00.000Z'),
  descripcion: 'Descripción original',
  tipo: 'ACOSO',
  gravedad: 'MODERADO',
  registradoPorId: 1,
}

const estudianteEj = { id: 10, nombres: 'Martín', apellidos: 'Alvarado', curso: '1°A' }

let app

beforeAll(async () => {
  // Importamos el router DESPUÉS de que vi.mock('@prisma/client') quedó activo
  const incidentesRouter = (await import('../src/routes/incidentes.routes.js')).default

  app = express()
  app.use(express.json())
  app.use('/incidentes', incidentesRouter)
})

beforeEach(() => {
  vi.clearAllMocks()
  // Comportamiento por defecto: $transaction ejecuta el callback normalmente
  prismaMock.$transaction.mockImplementation((callback) => callback(prismaMock))
})

// ═══════════════════════════════════════════════════════════════════════════
// GET /incidentes/:id
// ═══════════════════════════════════════════════════════════════════════════
describe('GET /incidentes/:id', () => {
  it('400 — id no numérico', async () => {
    const res = await request(app)
      .get('/incidentes/abc')
      .set('Authorization', `Bearer ${generarToken()}`)

    expect(res.status).toBe(400)
    expect(res.body.error).toMatch(/número entero/)
  })

  it('404 — el incidente no existe', async () => {
    prismaMock.incidente.findUnique.mockResolvedValue(null)

    const res = await request(app)
      .get('/incidentes/999')
      .set('Authorization', `Bearer ${generarToken()}`)

    expect(res.status).toBe(404)
    expect(res.body.error).toMatch(/No existe un incidente/)
  })

  it('200 — devuelve el incidente con sus involucrados', async () => {
    prismaMock.incidente.findUnique.mockResolvedValue({
      ...incidenteBase,
      involucrados: [
        { id: 1, estudianteId: 10, rol: 'AFECTADO', observacion: null, estudiante: estudianteEj },
      ],
    })

    const res = await request(app)
      .get('/incidentes/5')
      .set('Authorization', `Bearer ${generarToken()}`)

    expect(res.status).toBe(200)
    expect(res.body.id).toBe(5)
    expect(res.body.involucrados).toHaveLength(1)
    expect(prismaMock.incidente.findUnique).toHaveBeenCalledWith(
      expect.objectContaining({ where: { id: 5 } })
    )
  })

  it('401 — sin token', async () => {
    const res = await request(app).get('/incidentes/5')
    expect(res.status).toBe(401)
  })
})

// ═══════════════════════════════════════════════════════════════════════════
// PUT /incidentes/:id
// ═══════════════════════════════════════════════════════════════════════════
describe('PUT /incidentes/:id', () => {
  describe('Autenticación y autorización', () => {
    it('401 — sin token', async () => {
      const res = await request(app).put('/incidentes/5').send({ descripcion: 'x' })
      expect(res.status).toBe(401)
    })

    it('403 — rol sin permiso para editar (p. ej. DOCENTE)', async () => {
      const res = await request(app)
        .put('/incidentes/5')
        .set('Authorization', `Bearer ${generarToken('DOCENTE')}`)
        .send({ descripcion: 'x' })

      expect(res.status).toBe(403)
      expect(prismaMock.incidente.findUnique).not.toHaveBeenCalled()
    })

    it('200 — ENCARGADO_CONVIVENCIA sí puede editar', async () => {
      prismaMock.incidente.findUnique
        .mockResolvedValueOnce(incidenteBase) // verificación de existencia
        .mockResolvedValueOnce({ ...incidenteBase, descripcion: 'Editado' }) // retorno final

      const res = await request(app)
        .put('/incidentes/5')
        .set('Authorization', `Bearer ${generarToken('ENCARGADO_CONVIVENCIA')}`)
        .send({ descripcion: 'Editado' })

      expect(res.status).toBe(200)
    })
  })

  describe('Validaciones básicas', () => {
    it('400 — id no numérico', async () => {
      const res = await request(app)
        .put('/incidentes/abc')
        .set('Authorization', `Bearer ${generarToken()}`)
        .send({ descripcion: 'x' })

      expect(res.status).toBe(400)
      expect(res.body.error).toMatch(/número entero/)
    })

    it('404 — el incidente no existe', async () => {
      prismaMock.incidente.findUnique.mockResolvedValue(null)

      const res = await request(app)
        .put('/incidentes/999')
        .set('Authorization', `Bearer ${generarToken()}`)
        .send({ descripcion: 'x' })

      expect(res.status).toBe(404)
      expect(res.body.error).toMatch(/No existe un incidente/)
    })

    it('400 — "tipo" inválido', async () => {
      prismaMock.incidente.findUnique.mockResolvedValue(incidenteBase)

      const res = await request(app)
        .put('/incidentes/5')
        .set('Authorization', `Bearer ${generarToken()}`)
        .send({ tipo: 'NO_EXISTE' })

      expect(res.status).toBe(400)
      expect(res.body.errores.join(' ')).toMatch(/tipo/)
    })

    it('400 — "gravedad" inválida', async () => {
      prismaMock.incidente.findUnique.mockResolvedValue(incidenteBase)

      const res = await request(app)
        .put('/incidentes/5')
        .set('Authorization', `Bearer ${generarToken()}`)
        .send({ gravedad: 'CATASTROFICO' })

      expect(res.status).toBe(400)
      expect(res.body.errores.join(' ')).toMatch(/gravedad/)
    })

    it('400 — "descripcion" vacía', async () => {
      prismaMock.incidente.findUnique.mockResolvedValue(incidenteBase)

      const res = await request(app)
        .put('/incidentes/5')
        .set('Authorization', `Bearer ${generarToken()}`)
        .send({ descripcion: '   ' })

      expect(res.status).toBe(400)
      expect(res.body.errores.join(' ')).toMatch(/descripcion/)
    })

    it('400 — "fecha" inválida', async () => {
      prismaMock.incidente.findUnique.mockResolvedValue(incidenteBase)

      const res = await request(app)
        .put('/incidentes/5')
        .set('Authorization', `Bearer ${generarToken()}`)
        .send({ fecha: 'no-es-una-fecha' })

      expect(res.status).toBe(400)
      expect(res.body.errores.join(' ')).toMatch(/fecha/)
    })

    it('200 — actualiza solo los campos básicos sin tocar involucrados', async () => {
      prismaMock.incidente.findUnique
        .mockResolvedValueOnce(incidenteBase) // verificación de existencia
        .mockResolvedValueOnce({ ...incidenteBase, descripcion: 'Nueva descripción', involucrados: [] }) // retorno final

      const res = await request(app)
        .put('/incidentes/5')
        .set('Authorization', `Bearer ${generarToken()}`)
        .send({ descripcion: 'Nueva descripción' })

      expect(res.status).toBe(200)
      expect(res.body.data.descripcion).toBe('Nueva descripción')
      expect(prismaMock.incidente.update).toHaveBeenCalledWith({
        where: { id: 5 },
        data: { descripcion: 'Nueva descripción' },
      })
      // Al no enviar "involucrados", no se debe tocar esa tabla
      expect(prismaMock.involucrado.findMany).not.toHaveBeenCalled()
      expect(prismaMock.involucrado.deleteMany).not.toHaveBeenCalled()
      expect(prismaMock.involucrado.create).not.toHaveBeenCalled()
      expect(prismaMock.involucrado.update).not.toHaveBeenCalled()
    })
  })

  describe('Validación de involucrados', () => {
    it('400 — "involucrados" no es un arreglo', async () => {
      prismaMock.incidente.findUnique.mockResolvedValue(incidenteBase)

      const res = await request(app)
        .put('/incidentes/5')
        .set('Authorization', `Bearer ${generarToken()}`)
        .send({ involucrados: 'no-es-arreglo' })

      expect(res.status).toBe(400)
      expect(res.body.errores.join(' ')).toMatch(/arreglo/)
    })

    it('400 — falta "estudianteId" en un involucrado', async () => {
      prismaMock.incidente.findUnique.mockResolvedValue(incidenteBase)

      const res = await request(app)
        .put('/incidentes/5')
        .set('Authorization', `Bearer ${generarToken()}`)
        .send({ involucrados: [{ rol: 'TESTIGO' }] })

      expect(res.status).toBe(400)
      expect(res.body.errores.join(' ')).toMatch(/estudianteId/)
    })

    it('400 — "rol" inválido en un involucrado', async () => {
      prismaMock.incidente.findUnique.mockResolvedValue(incidenteBase)

      const res = await request(app)
        .put('/incidentes/5')
        .set('Authorization', `Bearer ${generarToken()}`)
        .send({ involucrados: [{ estudianteId: 10, rol: 'NO_VALIDO' }] })

      expect(res.status).toBe(400)
      expect(res.body.errores.join(' ')).toMatch(/rol/)
    })

    it('404 — el estudiante referenciado no existe', async () => {
      prismaMock.incidente.findUnique.mockResolvedValue(incidenteBase)
      prismaMock.estudiante.findUnique.mockResolvedValue(null)

      const res = await request(app)
        .put('/incidentes/5')
        .set('Authorization', `Bearer ${generarToken()}`)
        .send({ involucrados: [{ estudianteId: 999, rol: 'AFECTADO' }] })

      expect(res.status).toBe(404)
      expect(res.body.error).toMatch(/estudiante/)
    })

    it('404 — el funcionario interviniente referenciado no existe', async () => {
      prismaMock.incidente.findUnique.mockResolvedValue(incidenteBase)
      prismaMock.estudiante.findUnique.mockResolvedValue(estudianteEj)
      prismaMock.funcionarioInstitucional.findUnique.mockResolvedValue(null)

      const res = await request(app)
        .put('/incidentes/5')
        .set('Authorization', `Bearer ${generarToken()}`)
        .send({ involucrados: [{ estudianteId: 10, rol: 'AFECTADO', funcionarioIntervinienteId: 99 }] })

      expect(res.status).toBe(404)
      expect(res.body.error).toMatch(/funcionario/)
    })

    it('409 — estudianteId + rol duplicado dentro del mismo payload', async () => {
      prismaMock.incidente.findUnique.mockResolvedValue(incidenteBase)
      prismaMock.estudiante.findUnique.mockResolvedValue(estudianteEj)

      const res = await request(app)
        .put('/incidentes/5')
        .set('Authorization', `Bearer ${generarToken()}`)
        .send({
          involucrados: [
            { estudianteId: 10, rol: 'AFECTADO' },
            { estudianteId: 10, rol: 'AFECTADO' },
          ],
        })

      expect(res.status).toBe(409)
      expect(res.body.error).toMatch(/duplicado/)
    })
  })

  describe('Reemplazo de la lista de involucrados (200)', () => {
    it('actualiza un involucrado existente (con id), crea uno nuevo (sin id) y elimina el que ya no viene', async () => {
      prismaMock.incidente.findUnique
        .mockResolvedValueOnce(incidenteBase) // existencia
        .mockResolvedValueOnce({ ...incidenteBase, involucrados: [] }) // retorno final

      prismaMock.estudiante.findUnique.mockResolvedValue(estudianteEj)

      // Involucrados que ya existían en BD antes del PUT
      const existentes = [
        { id: 1, incidenteId: 5, estudianteId: 10, rol: 'AFECTADO' },
        { id: 2, incidenteId: 5, estudianteId: 11, rol: 'TESTIGO' }, // este no viene en el body → debe eliminarse
      ]
      prismaMock.involucrado.findMany.mockResolvedValue(existentes)

      const res = await request(app)
        .put('/incidentes/5')
        .set('Authorization', `Bearer ${generarToken()}`)
        .send({
          involucrados: [
            { id: 1, estudianteId: 10, rol: 'RESPONSABLE', observacion: 'Cambió de rol' }, // se actualiza
            { estudianteId: 12, rol: 'TESTIGO' }, // se crea (sin id)
          ],
        })

      expect(res.status).toBe(200)

      // Se eliminó el involucrado id=2, que no vino en la lista enviada
      expect(prismaMock.involucrado.deleteMany).toHaveBeenCalledWith({ where: { id: { in: [2] } } })

      // Se actualizó el involucrado id=1
      expect(prismaMock.involucrado.update).toHaveBeenCalledWith({
        where: { id: 1 },
        data: {
          estudianteId: 10,
          rol: 'RESPONSABLE',
          observacion: 'Cambió de rol',
          funcionarioIntervinienteId: null,
        },
      })

      // Se creó el involucrado nuevo (sin id)
      expect(prismaMock.involucrado.create).toHaveBeenCalledWith({
        data: {
          incidenteId: 5,
          estudianteId: 12,
          rol: 'TESTIGO',
          observacion: null,
          funcionarioIntervinienteId: null,
        },
      })
    })
  })

  describe('Errores al persistir', () => {
    it('409 — Prisma lanza P2002 (restricción única) dentro de la transacción', async () => {
      prismaMock.incidente.findUnique.mockResolvedValue(incidenteBase)
      prismaMock.estudiante.findUnique.mockResolvedValue(estudianteEj)
      prismaMock.involucrado.findMany.mockResolvedValue([])

      prismaMock.$transaction.mockImplementation(async () => {
        const error = new Error('Unique constraint failed')
        error.code = 'P2002'
        throw error
      })

      const res = await request(app)
        .put('/incidentes/5')
        .set('Authorization', `Bearer ${generarToken()}`)
        .send({ involucrados: [{ estudianteId: 10, rol: 'AFECTADO' }] })

      expect(res.status).toBe(409)
      expect(res.body.error).toMatch(/ya está registrado/)
    })

    it('500 — error inesperado al actualizar', async () => {
      prismaMock.incidente.findUnique.mockResolvedValue(incidenteBase)

      prismaMock.$transaction.mockImplementation(async () => {
        throw new Error('Fallo de conexión inesperado')
      })

      const res = await request(app)
        .put('/incidentes/5')
        .set('Authorization', `Bearer ${generarToken()}`)
        .send({ descripcion: 'Nueva' })

      expect(res.status).toBe(500)
      expect(res.body.error).toMatch(/Error al actualizar/)
    })
  })
})