const incidenteRepository = require('../repositories/incidenteRepository')

// Valores permitidos según el schema.prisma del equipo
const TIPOS_VALIDOS = [
  'CONFLICTO',
  'AGRESION_FISICA',
  'AGRESION_VERBAL',
  'ACOSO',
  'DANO_MATERIAL',
]

const GRAVEDADES_VALIDAS = ['LEVE', 'MODERADO', 'GRAVE', 'MUY_GRAVE']

/**
 * Valida los campos obligatorios y los enums antes de persistir.
 * Lanza un error descriptivo si algo falla.
 */
function validarDatosIncidente(datos) {
  const errores = []

  if (!datos.tipo) {
    errores.push('El campo "tipo" es obligatorio.')
  } else if (!TIPOS_VALIDOS.includes(datos.tipo)) {
    errores.push(`El campo "tipo" debe ser uno de: ${TIPOS_VALIDOS.join(', ')}.`)
  }

  if (!datos.gravedad) {
    errores.push('El campo "gravedad" es obligatorio.')
  } else if (!GRAVEDADES_VALIDAS.includes(datos.gravedad)) {
    errores.push(`El campo "gravedad" debe ser uno de: ${GRAVEDADES_VALIDAS.join(', ')}.`)
  }

  if (!datos.descripcion || datos.descripcion.trim() === '') {
    errores.push('El campo "descripcion" es obligatorio.')
  }

  if (!datos.fecha) {
    errores.push('El campo "fecha" es obligatorio.')
  } else if (isNaN(new Date(datos.fecha).getTime())) {
    errores.push('El campo "fecha" debe ser una fecha válida (ISO 8601).')
  }

  if (!datos.registradoPorId) {
    errores.push('El campo "registradoPorId" es obligatorio.')
  }

  return errores
}

/**
 * Registra un nuevo incidente.
 * @param {Object} datos - Cuerpo del request
 * @returns {Promise<Incidente>} El incidente creado
 * @throws {Object} { tipo: 'VALIDACION', errores } si los datos son inválidos
 */
async function registrarIncidente(datos) {
  const errores = validarDatosIncidente(datos)

  if (errores.length > 0) {
    const error = new Error('Datos inválidos')
    error.tipo = 'VALIDACION'
    error.errores = errores
    throw error
  }

  const nuevoIncidente = {
    tipo: datos.tipo,
    gravedad: datos.gravedad,
    descripcion: datos.descripcion.trim(),
    fecha: new Date(datos.fecha),
    registradoPorId: Number(datos.registradoPorId),
  }

  return incidenteRepository.create(nuevoIncidente)
}

module.exports = { registrarIncidente, validarDatosIncidente }
