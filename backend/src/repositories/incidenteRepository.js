const prisma = require('../prismaClient')

/**
 * Repositorio para la entidad Incidente.
 * Encapsula todas las operaciones de persistencia sobre la tabla `Incidente`.
 */
class IncidenteRepository {
  async create(data) {
    return prisma.incidente.create({ data })
  }

  async findById(id) {
    return prisma.incidente.findUnique({
      where: { id },
      include: {
        involucrados: { include: { estudiante: true } },
        reportadoPor: true,
        atendidoPor: true,
      },
    })
  }

  async findAll() {
    return prisma.incidente.findMany({
      include: {
        involucrados: { include: { estudiante: true } },
        reportadoPor: true,
        atendidoPor: true,
      },
      orderBy: { fechaOcurrencia: 'desc' },
    })
  }

  async findByTipo(tipo) {
    return prisma.incidente.findMany({
      where: { tipo },
      orderBy: { fechaOcurrencia: 'desc' },
    })
  }

  async findByGravedad(gravedad) {
    return prisma.incidente.findMany({
      where: { gravedad },
      orderBy: { fechaOcurrencia: 'desc' },
    })
  }

  async findByEstado(estado) {
    return prisma.incidente.findMany({
      where: { estado },
      orderBy: { fechaOcurrencia: 'desc' },
    })
  }

  async findByEstudiante(estudianteId) {
    return prisma.incidente.findMany({
      where: { involucrados: { some: { estudianteId } } },
      include: {
        involucrados: { include: { estudiante: true } },
        reportadoPor: true,
      },
      orderBy: { fechaOcurrencia: 'desc' },
    })
  }

  async update(id, data) {
    return prisma.incidente.update({ where: { id }, data })
  }

  async cambiarEstado(id, estado) {
    return prisma.incidente.update({ where: { id }, data: { estado } })
  }

  async delete(id) {
    return prisma.incidente.delete({ where: { id } })
  }
}

module.exports = new IncidenteRepository()
