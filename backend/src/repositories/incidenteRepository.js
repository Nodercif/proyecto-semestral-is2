const prisma = require('../prismaClient')

/**
 * Repositorio para la entidad Incidente.
 * Campos según schema.prisma: fecha, descripcion, tipo, gravedad, registradoPorId
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
        registradoPor: true,
      },
    })
  }

  async findAll() {
    return prisma.incidente.findMany({
      include: {
        involucrados: { include: { estudiante: true } },
        registradoPor: true,
      },
      orderBy: { fecha: 'desc' },
    })
  }

  async findByTipo(tipo) {
    return prisma.incidente.findMany({
      where: { tipo },
      orderBy: { fecha: 'desc' },
    })
  }

  async findByGravedad(gravedad) {
    return prisma.incidente.findMany({
      where: { gravedad },
      orderBy: { fecha: 'desc' },
    })
  }

  async findByEstudiante(estudianteId) {
    return prisma.incidente.findMany({
      where: { involucrados: { some: { estudianteId } } },
      include: {
        involucrados: { include: { estudiante: true } },
        registradoPor: true,
      },
      orderBy: { fecha: 'desc' },
    })
  }

  async update(id, data) {
    return prisma.incidente.update({ where: { id }, data })
  }

  async delete(id) {
    return prisma.incidente.delete({ where: { id } })
  }
}

module.exports = new IncidenteRepository()
