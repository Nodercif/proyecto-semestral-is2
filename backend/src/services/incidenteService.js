const incidenteRepository = require('../repositories/incidenteRepository')

// Valores permitidos según el schema.prisma
const TIPOS_VALIDOS = [
  'AGRESION_FISICA',
  'AGRESION_VERBAL',
  'BULLYING',
  'CIBERBULLYING',
  'DANO_MATERIAL',
  'CONDUCTA_DISRUPTIVA',
  'OTRO',
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

  if (!datos.lugar || datos.lugar.trim() === '') {
    errores.push('El campo "lugar" es obligatorio.')
  }

  if (!datos.fechaOcurrencia) {
    errores.push('El campo "fechaOcurrencia" es obligatorio.')
  } else if (isNaN(new Date(datos.fechaOcurrencia).getTime())) {
    errores.push('El campo "fechaOcurrencia" debe ser una fecha válida (ISO 8601).')
  }

  if (!datos.reportadoPorId) {
    errores.push('El campo "reportadoPorId" es obligatorio.')
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
    lugar: datos.lugar.trim(),
    fechaOcurrencia: new Date(datos.fechaOcurrencia),
    reportadoPorId: Number(datos.reportadoPorId),
    ...(datos.observaciones && { observaciones: datos.observaciones.trim() }),
  }

  return incidenteRepository.create(nuevoIncidente)
}

module.exports = { registrarIncidente, validarDatosIncidente }
