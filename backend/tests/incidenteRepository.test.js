/**
 * Tests unitarios — incidenteRepository
 * Ajustado al schema.prisma del equipo:
 * - campo: fecha (no fechaOcurrencia)
 * - relación: registradoPor (no reportadoPor, no atendidoPor)
 * - TipoIncidente: CONFLICTO | AGRESION_FISICA | AGRESION_VERBAL | ACOSO | DANO_MATERIAL
 * - sin método cambiarEstado (el estado pertenece a Caso, no a Incidente)
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
const incidenteRepo = require('../src/repositories/incidenteRepository')

// ── Datos de prueba ──────────────────────────────────────────────────────────

const funcionarioMock = {
  id: 10,
  nombres: 'María',
  apellidos: 'Torres',
  cargo: 'INSPECTOR',
}

const incidenteMock = {
  id: 1,
  tipo: 'ACOSO',
  gravedad: 'MODERADO',
  descripcion: 'Grupo de estudiantes acosa a un compañero en el recreo.',
  fecha: new Date('2024-05-10T10:30:00'),
  registradoPorId: 10,
  registradoPor: funcionarioMock,
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
        tipo: 'ACOSO',
        gravedad: 'MODERADO',
        descripcion: 'Grupo de estudiantes acosa a un compañero en el recreo.',
        fecha: new Date('2024-05-10T10:30:00'),
        registradoPorId: 10,
      }

      const resultado = await incidenteRepo.create(input)

      expect(prisma.incidente.create).toHaveBeenCalledWith({ data: input })
      expect(resultado.tipo).toBe('ACOSO')
      expect(resultado.gravedad).toBe('MODERADO')
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
          registradoPor: true,
        },
      })
      expect(resultado.registradoPor).toEqual(funcionarioMock)
    })

    it('debe retornar null cuando el incidente no existe', async () => {
      prisma.incidente.findUnique.mockResolvedValue(null)

      const resultado = await incidenteRepo.findById(9999)

      expect(resultado).toBeNull()
    })
  })

  // ── FIND BY TIPO ───────────────────────────────────────────────────────────
  describe('findByTipo()', () => {
    it('debe filtrar incidentes por tipo ACOSO', async () => {
      prisma.incidente.findMany.mockResolvedValue([incidenteMock])

      const resultado = await incidenteRepo.findByTipo('ACOSO')

      expect(prisma.incidente.findMany).toHaveBeenCalledWith({
        where: { tipo: 'ACOSO' },
        orderBy: { fecha: 'desc' },
      })
      expect(resultado).toHaveLength(1)
      expect(resultado[0].tipo).toBe('ACOSO')
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

  // ── UPDATE ─────────────────────────────────────────────────────────────────
  describe('update()', () => {
    it('debe actualizar la descripción de un incidente', async () => {
      const nuevaDesc = 'Descripción actualizada tras investigación.'
      const actualizado = { ...incidenteMock, descripcion: nuevaDesc }
      prisma.incidente.update.mockResolvedValue(actualizado)

      const resultado = await incidenteRepo.update(1, { descripcion: nuevaDesc })

      expect(prisma.incidente.update).toHaveBeenCalledWith({
        where: { id: 1 },
        data: { descripcion: nuevaDesc },
      })
      expect(resultado.descripcion).toBe(nuevaDesc)
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
