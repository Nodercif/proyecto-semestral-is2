const prisma = require('../prismaClient')

/**
 * Repositorio para la entidad FuncionarioInstitucional.
 * Encapsula todas las operaciones de persistencia sobre la tabla `FuncionarioInstitucional`.
 */
class FuncionarioInstitucionalRepository {
  /**
   * Crea un nuevo funcionario.
   * @param {Object} data
   * @returns {Promise<FuncionarioInstitucional>}
   */
  async create(data) {
    return prisma.funcionarioInstitucional.create({ data })
  }

  /**
   * Busca un funcionario por su ID.
   * @param {number} id
   * @returns {Promise<FuncionarioInstitucional|null>}
   */
  async findById(id) {
    return prisma.funcionarioInstitucional.findUnique({
      where: { id },
      include: {
        incidentesReportados: true,
        incidentesAtendidos: true,
      },
    })
  }

  /**
   * Busca un funcionario por su RUT.
   * @param {string} rut
   * @returns {Promise<FuncionarioInstitucional|null>}
   */
  async findByRut(rut) {
    return prisma.funcionarioInstitucional.findUnique({ where: { rut } })
  }

  /**
   * Busca un funcionario por su correo electrónico.
   * @param {string} correo
   * @returns {Promise<FuncionarioInstitucional|null>}
   */
  async findByCorreo(correo) {
    return prisma.funcionarioInstitucional.findUnique({ where: { correo } })
  }

  /**
   * Retorna todos los funcionarios activos.
   * @returns {Promise<FuncionarioInstitucional[]>}
   */
  async findAll() {
    return prisma.funcionarioInstitucional.findMany({
      where: { activo: true },
      orderBy: { apellidos: 'asc' },
    })
  }

  /**
   * Busca funcionarios por cargo.
   * @param {string} cargo - Ej: "Inspector"
   * @returns {Promise<FuncionarioInstitucional[]>}
   */
  async findByCargo(cargo) {
    return prisma.funcionarioInstitucional.findMany({
      where: { cargo, activo: true },
    })
  }

  /**
   * Actualiza los datos de un funcionario.
   * @param {number} id
   * @param {Object} data
   * @returns {Promise<FuncionarioInstitucional>}
   */
  async update(id, data) {
    return prisma.funcionarioInstitucional.update({ where: { id }, data })
  }

  /**
   * Desactiva (baja lógica) un funcionario.
   * @param {number} id
   * @returns {Promise<FuncionarioInstitucional>}
   */
  async deactivate(id) {
    return prisma.funcionarioInstitucional.update({
      where: { id },
      data: { activo: false },
    })
  }

  /**
   * Elimina físicamente un funcionario (usar solo en tests o admin).
   * @param {number} id
   * @returns {Promise<FuncionarioInstitucional>}
   */
  async delete(id) {
    return prisma.funcionarioInstitucional.delete({ where: { id } })
  }
}

module.exports = new FuncionarioInstitucionalRepository()
