/**
 * Tests — POST /incidentes (HU1)
 * Ajustado al schema.prisma del equipo:
 * - campo: fecha (no fechaOcurrencia)
 * - campo: registradoPorId (no reportadoPorId)
 * - TipoIncidente: CONFLICTO | AGRESION_FISICA | AGRESION_VERBAL | ACOSO | DANO_MATERIAL
 */

jest.mock('../src/repositories/incidenteRepository', () => ({
  create: jest.fn(),
}))

const request = require('supertest')
const app = require('../src/app')
const incidenteRepository = require('../src/repositories/incidenteRepository')

// ── Datos base ────────────────────────────────────────────────────────────────

const datosValidos = {
  tipo: 'ACOSO',
  gravedad: 'MODERADO',
  descripcion: 'Grupo de estudiantes acosa a un compañero en el recreo.',
  fecha: '2024-05-10T10:30:00.000Z',
  registradoPorId: 1,
}

const incidenteCreado = {
  id: 42,
  tipo: 'ACOSO',
  gravedad: 'MODERADO',
  descripcion: 'Grupo de estudiantes acosa a un compañero en el recreo.',
  fecha: new Date('2024-05-10T10:30:00.000Z'),
  registradoPorId: 1,
  createdAt: new Date(),
  updatedAt: new Date(),
}

// ── Tests ─────────────────────────────────────────────────────────────────────

describe('POST /incidentes', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  // ── 201 Created ────────────────────────────────────────────────────────────
  describe('✅ Datos válidos', () => {
    it('debe retornar 201 y el incidente creado con su ID', async () => {
      incidenteRepository.create.mockResolvedValue(incidenteCreado)

      const res = await request(app).post('/incidentes').send(datosValidos)

      expect(res.status).toBe(201)
      expect(res.body.data).toBeDefined()
      expect(res.body.data.id).toBe(42)
      expect(res.body.data.tipo).toBe('ACOSO')
      expect(res.body.data.gravedad).toBe('MODERADO')
      expect(incidenteRepository.create).toHaveBeenCalledTimes(1)
    })

    it('debe llamar al repositorio con los datos correctos', async () => {
      incidenteRepository.create.mockResolvedValue(incidenteCreado)

      await request(app).post('/incidentes').send(datosValidos)

      const llamada = incidenteRepository.create.mock.calls[0][0]
      expect(llamada.tipo).toBe('ACOSO')
      expect(llamada.gravedad).toBe('MODERADO')
      expect(llamada.registradoPorId).toBe(1)
      expect(llamada.fecha).toBeInstanceOf(Date)
    })
  })

  // ── 400 — Campos faltantes ─────────────────────────────────────────────────
  describe('❌ Campos obligatorios faltantes', () => {
    it('debe retornar 400 si falta el campo "tipo"', async () => {
      const { tipo, ...sinTipo } = datosValidos
      const res = await request(app).post('/incidentes').send(sinTipo)
      expect(res.status).toBe(400)
      expect(res.body.errores).toContain('El campo "tipo" es obligatorio.')
      expect(incidenteRepository.create).not.toHaveBeenCalled()
    })

    it('debe retornar 400 si falta el campo "gravedad"', async () => {
      const { gravedad, ...sinGravedad } = datosValidos
      const res = await request(app).post('/incidentes').send(sinGravedad)
      expect(res.status).toBe(400)
      expect(res.body.errores).toContain('El campo "gravedad" es obligatorio.')
    })

    it('debe retornar 400 si falta el campo "descripcion"', async () => {
      const { descripcion, ...sinDescripcion } = datosValidos
      const res = await request(app).post('/incidentes').send(sinDescripcion)
      expect(res.status).toBe(400)
      expect(res.body.errores).toContain('El campo "descripcion" es obligatorio.')
    })

    it('debe retornar 400 si falta el campo "fecha"', async () => {
      const { fecha, ...sinFecha } = datosValidos
      const res = await request(app).post('/incidentes').send(sinFecha)
      expect(res.status).toBe(400)
      expect(res.body.errores).toContain('El campo "fecha" es obligatorio.')
    })

    it('debe retornar 400 si falta el campo "registradoPorId"', async () => {
      const { registradoPorId, ...sinRegistrador } = datosValidos
      const res = await request(app).post('/incidentes').send(sinRegistrador)
      expect(res.status).toBe(400)
      expect(res.body.errores).toContain('El campo "registradoPorId" es obligatorio.')
    })

    it('debe retornar 400 con múltiples errores si faltan varios campos', async () => {
      const res = await request(app).post('/incidentes').send({})
      expect(res.status).toBe(400)
      expect(res.body.errores.length).toBeGreaterThan(1)
    })
  })

  // ── 400 — Enums inválidos ──────────────────────────────────────────────────
  describe('❌ Valores de enum inválidos', () => {
    it('debe retornar 400 si el tipo de incidente no es un valor permitido', async () => {
      const res = await request(app)
        .post('/incidentes')
        .send({ ...datosValidos, tipo: 'BULLYING' })
      expect(res.status).toBe(400)
      expect(res.body.errores[0]).toContain('CONFLICTO')
    })

    it('debe retornar 400 si el nivel de gravedad no es un valor permitido', async () => {
      const res = await request(app)
        .post('/incidentes')
        .send({ ...datosValidos, gravedad: 'EXTREMO' })
      expect(res.status).toBe(400)
      expect(res.body.errores[0]).toContain('LEVE')
    })

    it('debe aceptar todos los tipos de incidente válidos', async () => {
      incidenteRepository.create.mockResolvedValue(incidenteCreado)
      const tipos = ['CONFLICTO', 'AGRESION_FISICA', 'AGRESION_VERBAL', 'ACOSO', 'DANO_MATERIAL']
      for (const tipo of tipos) {
        const res = await request(app).post('/incidentes').send({ ...datosValidos, tipo })
        expect(res.status).toBe(201)
      }
    })

    it('debe aceptar todos los niveles de gravedad válidos', async () => {
      incidenteRepository.create.mockResolvedValue(incidenteCreado)
      const gravedades = ['LEVE', 'MODERADO', 'GRAVE', 'MUY_GRAVE']
      for (const gravedad of gravedades) {
        const res = await request(app).post('/incidentes').send({ ...datosValidos, gravedad })
        expect(res.status).toBe(201)
      }
    })
  })

  // ── 400 — Fecha inválida ───────────────────────────────────────────────────
  describe('❌ Fecha inválida', () => {
    it('debe retornar 400 si fecha no es una fecha válida', async () => {
      const res = await request(app)
        .post('/incidentes')
        .send({ ...datosValidos, fecha: 'no-es-una-fecha' })
      expect(res.status).toBe(400)
      expect(res.body.errores[0]).toContain('fecha válida')
    })
  })
})
