/**
 * Tests unitarios — IncidenteRepository
 *
 * Se simulan las llamadas a Prisma para no requerir una base de datos real.
 */

jest.mock('../src/prismaClient', () => ({
  incidente: {
    create: jest.fn(),
    findUnique: jest.fn(),
    findMany: jest.fn(),
    update: jest.fn(),
    delete: jest.fn(),
  },
}))

const prisma = require('../src/prismaClient')
const incidenteRepo = require('../src/repositories/IncidenteRepository')

// ── Datos de prueba ──────────────────────────────────────────────────────────

const funcionarioMock = {
  id: 10,
  nombres: 'María',
  apellidos: 'Torres',
  cargo: 'Inspectora',
}

const incidenteMock = {
  id: 1,
  tipo: 'BULLYING',
  gravedad: 'MODERADO',
  estado: 'ABIERTO',
  descripcion: 'Grupo de estudiantes acosa sistemáticamente a un compañero en el recreo.',
  lugar: 'Patio central',
  fechaOcurrencia: new Date('2024-05-10T10:30:00'),
  accioesTomadas: null,
  observaciones: null,
  reportadoPorId: 10,
  atendidoPorId: null,
  reportadoPor: funcionarioMock,
  atendidoPor: null,
  involucrados: [],
  createdAt: new Date(),
  updatedAt: new Date(),
}

// ── Tests ────────────────────────────────────────────────────────────────────

describe('IncidenteRepository', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  // ── CREATE ─────────────────────────────────────────────────────────────────
  describe('create()', () => {
    it('debe crear un incidente y retornarlo', async () => {
      prisma.incidente.create.mockResolvedValue(incidenteMock)

      const input = {
        tipo: 'BULLYING',
        gravedad: 'MODERADO',
        descripcion: 'Grupo de estudiantes acosa sistemáticamente a un compañero en el recreo.',
        lugar: 'Patio central',
        fechaOcurrencia: new Date('2024-05-10T10:30:00'),
        reportadoPorId: 10,
      }

      const resultado = await incidenteRepo.create(input)

      expect(prisma.incidente.create).toHaveBeenCalledWith({ data: input })
      expect(resultado.tipo).toBe('BULLYING')
      expect(resultado.gravedad).toBe('MODERADO')
      expect(resultado.estado).toBe('ABIERTO')
    })
  })

  // ── FIND BY ID ─────────────────────────────────────────────────────────────
  describe('findById()', () => {
    it('debe retornar el incidente con sus relaciones cuando existe', async () => {
      prisma.incidente.findUnique.mockResolvedValue(incidenteMock)

      const resultado = await incidenteRepo.findById(1)

      expect(prisma.incidente.findUnique).toHaveBeenCalledWith({
        where: { id: 1 },
        include: {
          involucrados: { include: { estudiante: true } },
          reportadoPor: true,
          atendidoPor: true,
        },
      })
      expect(resultado.reportadoPor).toEqual(funcionarioMock)
    })

    it('debe retornar null cuando el incidente no existe', async () => {
      prisma.incidente.findUnique.mockResolvedValue(null)

      const resultado = await incidenteRepo.findById(9999)

      expect(resultado).toBeNull()
    })
  })

  // ── FIND BY TIPO ───────────────────────────────────────────────────────────
  describe('findByTipo()', () => {
    it('debe filtrar incidentes por tipo BULLYING', async () => {
      prisma.incidente.findMany.mockResolvedValue([incidenteMock])

      const resultado = await incidenteRepo.findByTipo('BULLYING')

      expect(prisma.incidente.findMany).toHaveBeenCalledWith({
        where: { tipo: 'BULLYING' },
        orderBy: { fechaOcurrencia: 'desc' },
      })
      expect(resultado).toHaveLength(1)
      expect(resultado[0].tipo).toBe('BULLYING')
    })
  })

  // ── FIND BY GRAVEDAD ───────────────────────────────────────────────────────
  describe('findByGravedad()', () => {
    it('debe filtrar incidentes por nivel de gravedad GRAVE', async () => {
      const grave = { ...incidenteMock, gravedad: 'GRAVE' }
      prisma.incidente.findMany.mockResolvedValue([grave])

      const resultado = await incidenteRepo.findByGravedad('GRAVE')

      expect(resultado[0].gravedad).toBe('GRAVE')
    })
  })

  // ── CAMBIAR ESTADO ─────────────────────────────────────────────────────────
  describe('cambiarEstado()', () => {
    it('debe cambiar el estado de un incidente a EN_PROCESO', async () => {
      const enProceso = { ...incidenteMock, estado: 'EN_PROCESO' }
      prisma.incidente.update.mockResolvedValue(enProceso)

      const resultado = await incidenteRepo.cambiarEstado(1, 'EN_PROCESO')

      expect(prisma.incidente.update).toHaveBeenCalledWith({
        where: { id: 1 },
        data: { estado: 'EN_PROCESO' },
      })
      expect(resultado.estado).toBe('EN_PROCESO')
    })
  })

  // ── UPDATE ─────────────────────────────────────────────────────────────────
  describe('update()', () => {
    it('debe actualizar las acciones tomadas de un incidente', async () => {
      const accion = 'Se citó a los apoderados involucrados.'
      const actualizado = { ...incidenteMock, accioesTomadas: accion }
      prisma.incidente.update.mockResolvedValue(actualizado)

      const resultado = await incidenteRepo.update(1, { accioesTomadas: accion })

      expect(resultado.accioesTomadas).toBe(accion)
    })
  })

  // ── DELETE ─────────────────────────────────────────────────────────────────
  describe('delete()', () => {
    it('debe eliminar un incidente', async () => {
      prisma.incidente.delete.mockResolvedValue(incidenteMock)

      const resultado = await incidenteRepo.delete(1)

      expect(prisma.incidente.delete).toHaveBeenCalledWith({ where: { id: 1 } })
      expect(resultado.id).toBe(1)
    })
  })
})
