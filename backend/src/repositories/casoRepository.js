import prisma from '../prismaClient.js';

class CasoRepository {
  async create(data) {
    return prisma.caso.create({
      data,
      include: {
        casoIncidentes: {
          include: {
            incidente: {
              include: {
                involucrados: { include: { estudiante: true } },
                registradoPor: true,
              },
            },
          },
        },
        acciones: true,
      },
    });
  }

  async findById(id) {
    return prisma.caso.findUnique({
      where: { id: Number(id) },
      include: {
        casoIncidentes: {
          include: {
            incidente: {
              include: {
                involucrados: { include: { estudiante: true } },
                registradoPor: true,
              },
            },
          },
        },
        acciones: true,
      },
    });
  }

  async findAll() {
    return prisma.caso.findMany({
      include: {
        casoIncidentes: {
          include: {
            incidente: true,
          },
        },
        acciones: true,
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  async findByEstado(estado) {
    return prisma.caso.findMany({
      where: { estado },
      include: {
        casoIncidentes: {
          include: {
            incidente: true,
          },
        },
        acciones: true,
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  async getIncidentesDeCaso(casoId) {
    const caso = await prisma.caso.findUnique({
      where: { id: Number(casoId) },
      include: {
        casoIncidentes: {
          include: {
            incidente: {
              include: {
                involucrados: { include: { estudiante: true } },
                registradoPor: true,
              },
            },
          },
        },
      },
    });

    return caso?.casoIncidentes.map((ci) => ci.incidente) || [];
  }

  async update(id, data) {
    return prisma.caso.update({
      where: { id: Number(id) },
      data,
      include: {
        casoIncidentes: {
          include: {
            incidente: true,
          },
        },
        acciones: true,
      },
    });
  }

  async delete(id) {
    return prisma.caso.delete({
      where: { id: Number(id) },
    });
  }
}

export default new CasoRepository();