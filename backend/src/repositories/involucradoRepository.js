const prisma = require('../prismaClient')

/**
 * Repositorio para la entidad Involucrado.
 * Relaciona estudiantes con incidentes mediante un rol específico.
 */
class InvolucradoRepository {
  /**
   * Agrega un estudiante como involucrado en un incidente.
   * @param {Object} data - { incidenteId, estudianteId, rol, descripcion? }
   * @returns {Promise<Involucrado>}
   */
  async create(data) {
    return prisma.involucrado.create({
      data,
      include: { estudiante: true, incidente: true },
    })
  }

  /**
   * Busca un involucrado por su ID.
   * @param {number} id
   * @returns {Promise<Involucrado|null>}
   */
  async findById(id) {
    return prisma.involucrado.findUnique({
      where: { id },
      include: { estudiante: true, incidente: true },
    })
  }

  /**
   * Retorna todos los involucrados de un incidente.
   * @param {number} incidenteId
   * @returns {Promise<Involucrado[]>}
   */
  async findByIncidente(incidenteId) {
    return prisma.involucrado.findMany({
      where: { incidenteId },
      include: { estudiante: true },
    })
  }

  /**
   * Retorna todos los incidentes en que aparece un estudiante.
   * @param {number} estudianteId
   * @returns {Promise<Involucrado[]>}
   */
  async findByEstudiante(estudianteId) {
    return prisma.involucrado.findMany({
      where: { estudianteId },
      include: { incidente: true },
    })
  }

  /**
   * Retorna involucrados filtrados por rol dentro de un incidente.
   * @param {number} incidenteId
   * @param {RolInvolucrado} rol
   * @returns {Promise<Involucrado[]>}
   */
  async findByRolEnIncidente(incidenteId, rol) {
    return prisma.involucrado.findMany({
      where: { incidenteId, rol },
      include: { estudiante: true },
    })
  }

  /**
   * Actualiza el rol o descripción de un involucrado.
   * @param {number} id
   * @param {Object} data
   * @returns {Promise<Involucrado>}
   */
  async update(id, data) {
    return prisma.involucrado.update({ where: { id }, data })
  }

  /**
   * Elimina un involucrado del incidente.
   * @param {number} id
   * @returns {Promise<Involucrado>}
   */
  async delete(id) {
    return prisma.involucrado.delete({ where: { id } })
  }
}

module.exports = new InvolucradoRepository()
