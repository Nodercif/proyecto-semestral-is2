const prisma = require('../prismaClient')

/**
 * Repositorio para la entidad Estudiante.
 * Encapsula todas las operaciones de persistencia sobre la tabla `Estudiante`.
 */
class EstudianteRepository {
  /**
   * Crea un nuevo estudiante.
   * @param {Object} data - Datos del estudiante
   * @returns {Promise<Estudiante>}
   */
  async create(data) {
    return prisma.estudiante.create({ data })
  }

  /**
   * Busca un estudiante por su ID.
   * @param {number} id
   * @returns {Promise<Estudiante|null>}
   */
  async findById(id) {
    return prisma.estudiante.findUnique({
      where: { id },
      include: { involucrados: true },
    })
  }

  /**
   * Busca un estudiante por su RUT.
   * @param {string} rut
   * @returns {Promise<Estudiante|null>}
   */
  async findByRut(rut) {
    return prisma.estudiante.findUnique({
      where: { rut },
    })
  }

  /**
   * Retorna todos los estudiantes activos.
   * @returns {Promise<Estudiante[]>}
   */
  async findAll() {
    return prisma.estudiante.findMany({
      where: { activo: true },
      orderBy: [{ apellidos: 'asc' }, { nombres: 'asc' }],
    })
  }

  /**
   * Busca estudiantes por curso.
   * @param {string} curso - Ej: "3°A"
   * @returns {Promise<Estudiante[]>}
   */
  async findByCurso(curso) {
    return prisma.estudiante.findMany({
      where: { curso, activo: true },
      orderBy: { apellidos: 'asc' },
    })
  }

  /**
   * Actualiza los datos de un estudiante.
   * @param {number} id
   * @param {Object} data - Campos a actualizar
   * @returns {Promise<Estudiante>}
   */
  async update(id, data) {
    return prisma.estudiante.update({
      where: { id },
      data,
    })
  }

  /**
   * Desactiva (baja lógica) un estudiante.
   * @param {number} id
   * @returns {Promise<Estudiante>}
   */
  async deactivate(id) {
    return prisma.estudiante.update({
      where: { id },
      data: { activo: false },
    })
  }

  /**
   * Elimina físicamente un estudiante (usar solo en tests o admin).
   * @param {number} id
   * @returns {Promise<Estudiante>}
   */
  async delete(id) {
    return prisma.estudiante.delete({ where: { id } })
  }
}

module.exports = new EstudianteRepository()
