/**
 * Tests unitarios — EstudianteRepository
 *
 * Usamos jest.mock para simular Prisma y no necesitar una base de datos real.
 * Esto permite correr los tests en cualquier entorno (CI, local sin DB, etc.)
 */

jest.mock('../src/prismaClient', () => ({
  estudiante: {
    create: jest.fn(),
    findUnique: jest.fn(),
    findMany: jest.fn(),
    update: jest.fn(),
    delete: jest.fn(),
  },
}))

const prisma = require('../src/prismaClient')
const estudianteRepo = require('../src/repositories/EstudianteRepository')

// ── Datos de prueba ──────────────────────────────────────────────────────────

const estudianteMock = {
  id: 1,
  rut: '12345678-9',
  nombres: 'Juan Carlos',
  apellidos: 'Pérez González',
  fechaNacimiento: new Date('2008-03-15'),
  genero: 'MASCULINO',
  curso: '3°A',
  nivel: 'Media',
  anioIngreso: 2022,
  activo: true,
  createdAt: new Date(),
  updatedAt: new Date(),
}

// ── Tests ────────────────────────────────────────────────────────────────────

describe('EstudianteRepository', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  // ── CREATE ─────────────────────────────────────────────────────────────────
  describe('create()', () => {
    it('debe crear un estudiante y retornarlo', async () => {
      prisma.estudiante.create.mockResolvedValue(estudianteMock)

      const input = {
        rut: '12345678-9',
        nombres: 'Juan Carlos',
        apellidos: 'Pérez González',
        fechaNacimiento: new Date('2008-03-15'),
        genero: 'MASCULINO',
        curso: '3°A',
        nivel: 'Media',
        anioIngreso: 2022,
      }

      const resultado = await estudianteRepo.create(input)

      expect(prisma.estudiante.create).toHaveBeenCalledWith({ data: input })
      expect(resultado).toEqual(estudianteMock)
      expect(resultado.id).toBe(1)
    })
  })

  // ── FIND BY ID ─────────────────────────────────────────────────────────────
  describe('findById()', () => {
    it('debe retornar el estudiante cuando existe', async () => {
      prisma.estudiante.findUnique.mockResolvedValue(estudianteMock)

      const resultado = await estudianteRepo.findById(1)

      expect(prisma.estudiante.findUnique).toHaveBeenCalledWith({
        where: { id: 1 },
        include: { involucrados: true },
      })
      expect(resultado).toEqual(estudianteMock)
    })

    it('debe retornar null cuando el estudiante no existe', async () => {
      prisma.estudiante.findUnique.mockResolvedValue(null)

      const resultado = await estudianteRepo.findById(999)

      expect(resultado).toBeNull()
    })
  })

  // ── FIND BY RUT ────────────────────────────────────────────────────────────
  describe('findByRut()', () => {
    it('debe encontrar estudiante por RUT', async () => {
      prisma.estudiante.findUnique.mockResolvedValue(estudianteMock)

      const resultado = await estudianteRepo.findByRut('12345678-9')

      expect(prisma.estudiante.findUnique).toHaveBeenCalledWith({
        where: { rut: '12345678-9' },
      })
      expect(resultado.rut).toBe('12345678-9')
    })
  })

  // ── FIND ALL ───────────────────────────────────────────────────────────────
  describe('findAll()', () => {
    it('debe retornar una lista de estudiantes activos', async () => {
      const lista = [estudianteMock, { ...estudianteMock, id: 2, rut: '98765432-1' }]
      prisma.estudiante.findMany.mockResolvedValue(lista)

      const resultado = await estudianteRepo.findAll()

      expect(prisma.estudiante.findMany).toHaveBeenCalledWith({
        where: { activo: true },
        orderBy: [{ apellidos: 'asc' }, { nombres: 'asc' }],
      })
      expect(resultado).toHaveLength(2)
    })
  })

  // ── UPDATE ─────────────────────────────────────────────────────────────────
  describe('update()', () => {
    it('debe actualizar el curso de un estudiante', async () => {
      const actualizado = { ...estudianteMock, curso: '4°A' }
      prisma.estudiante.update.mockResolvedValue(actualizado)

      const resultado = await estudianteRepo.update(1, { curso: '4°A' })

      expect(prisma.estudiante.update).toHaveBeenCalledWith({
        where: { id: 1 },
        data: { curso: '4°A' },
      })
      expect(resultado.curso).toBe('4°A')
    })
  })

  // ── DEACTIVATE ─────────────────────────────────────────────────────────────
  describe('deactivate()', () => {
    it('debe desactivar (baja lógica) un estudiante', async () => {
      const desactivado = { ...estudianteMock, activo: false }
      prisma.estudiante.update.mockResolvedValue(desactivado)

      const resultado = await estudianteRepo.deactivate(1)

      expect(prisma.estudiante.update).toHaveBeenCalledWith({
        where: { id: 1 },
        data: { activo: false },
      })
      expect(resultado.activo).toBe(false)
    })
  })

  // ── DELETE ─────────────────────────────────────────────────────────────────
  describe('delete()', () => {
    it('debe eliminar un estudiante', async () => {
      prisma.estudiante.delete.mockResolvedValue(estudianteMock)

      const resultado = await estudianteRepo.delete(1)

      expect(prisma.estudiante.delete).toHaveBeenCalledWith({ where: { id: 1 } })
      expect(resultado.id).toBe(1)
    })
  })
})
