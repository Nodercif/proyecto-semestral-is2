import prisma from '../config/prisma.js'

const ESTADOS_VALIDOS = ['ABIERTO', 'EN_SEGUIMIENTO', 'RESUELTO', 'CERRADO', 'DERIVADO']
const TIPOS_ACCION_VALIDOS = ['CITACION', 'DERIVACION_ORIENTACION', 'ENTREVISTA', 'DERIVACION_PSICOLOGO']

const INCLUDE_CASO_COMPLETO = {
  casoIncidentes: {
    include: {
      incidente: {
        include: { involucrados: { include: { estudiante: true } }, registradoPor: true },
      },
    },
  },
  acciones: true,
}

function validarDatosCaso(datos) {
  const errores = []
  if (!datos.titulo || datos.titulo.trim() === '') {
    errores.push('El campo "titulo" es obligatorio.')
  }
  if (datos.descripcion !== undefined && datos.descripcion !== null && String(datos.descripcion).trim() === '') {
    errores.push('El campo "descripcion" no puede estar vacío si se envía.')
  }
  return errores
}

function validarDatosAccion(datos) {
  const errores = []
  if (!datos.tipo || !TIPOS_ACCION_VALIDOS.includes(datos.tipo)) {
    errores.push(`El campo "tipo" es obligatorio y debe ser uno de: ${TIPOS_ACCION_VALIDOS.join(', ')}.`)
  }
  if (datos.fecha !== undefined && isNaN(new Date(datos.fecha).getTime())) {
    errores.push('El campo "fecha" debe ser una fecha válida (ISO 8601).')
  }
  return errores
}

async function crearCaso(datos) {
  const errores = validarDatosCaso(datos)
  if (errores.length > 0) {
    const error = new Error('Datos inválidos')
    error.tipo = 'VALIDACION'
    error.errores = errores
    throw error
  }
  return prisma.caso.create({
    data: {
      titulo: datos.titulo.trim(),
      descripcion: datos.descripcion ? String(datos.descripcion).trim() : null,
      estado: 'ABIERTO',
    },
    include: INCLUDE_CASO_COMPLETO,
  })
}

async function asociarIncidenteAlCaso(casoId, incidenteId) {
  casoId = Number(casoId)
  incidenteId = Number(incidenteId)

  const caso = await prisma.caso.findUnique({ where: { id: casoId }, include: { casoIncidentes: true } })
  if (!caso) {
    const error = new Error('El caso no existe.')
    error.tipo = 'NO_ENCONTRADO'
    throw error
  }

  const incidente = await prisma.incidente.findUnique({ where: { id: incidenteId } })
  if (!incidente) {
    const error = new Error('El incidente no existe.')
    error.tipo = 'NO_ENCONTRADO'
    throw error
  }

  const yaAsociado = caso.casoIncidentes.some((ci) => ci.incidenteId === incidenteId)
  if (yaAsociado) {
    const error = new Error('El incidente ya está asociado a este caso.')
    error.tipo = 'CONFLICTO'
    throw error
  }

  await prisma.casoIncidente.create({ data: { casoId, incidenteId } })

  return prisma.caso.findUnique({ where: { id: casoId }, include: INCLUDE_CASO_COMPLETO })
}

async function obtenerCaso(casoId) {
  casoId = Number(casoId)
  const caso = await prisma.caso.findUnique({
    where: { id: casoId },
    include: INCLUDE_CASO_COMPLETO,
  })
  if (!caso) {
    const error = new Error('El caso no existe.')
    error.tipo = 'NO_ENCONTRADO'
    throw error
  }
  return caso
}

async function listarCasos(filtros = {}) {
  const where = {}

  if (filtros.estado) {
    where.estado = filtros.estado
  }

  if (filtros.texto) {
    where.OR = [
      { titulo: { contains: filtros.texto, mode: 'insensitive' } },
      { descripcion: { contains: filtros.texto, mode: 'insensitive' } },
    ]
  }

  if (filtros.desde || filtros.hasta) {
    where.createdAt = {}
    if (filtros.desde) where.createdAt.gte = new Date(filtros.desde)
    if (filtros.hasta) where.createdAt.lte = new Date(`${filtros.hasta}T23:59:59.999Z`)
  }

  return prisma.caso.findMany({
    where,
    include: { casoIncidentes: { include: { incidente: true } }, acciones: true },
    orderBy: { createdAt: 'desc' },
  })
}

async function registrarAccion(casoId, datos) {
  casoId = Number(casoId)

  const errores = validarDatosAccion(datos)
  if (errores.length > 0) {
    const error = new Error('Datos inválidos')
    error.tipo = 'VALIDACION'
    error.errores = errores
    throw error
  }

  const caso = await prisma.caso.findUnique({ where: { id: casoId } })
  if (!caso) {
    const error = new Error('El caso no existe.')
    error.tipo = 'NO_ENCONTRADO'
    throw error
  }

  await prisma.accionIntervencion.create({
    data: {
      casoId,
      tipo: datos.tipo,
      descripcion: datos.descripcion ? String(datos.descripcion).trim() : null,
      ...(datos.fecha ? { fecha: new Date(datos.fecha) } : {}),
    },
  })

  return prisma.caso.findUnique({ where: { id: casoId }, include: INCLUDE_CASO_COMPLETO })
}

async function actualizarEstadoCaso(casoId, nuevoEstado) {
  casoId = Number(casoId)

  if (!nuevoEstado || !ESTADOS_VALIDOS.includes(nuevoEstado)) {
    const error = new Error(`El campo "estado" debe ser uno de: ${ESTADOS_VALIDOS.join(', ')}.`)
    error.tipo = 'VALIDACION'
    error.errores = [error.message]
    throw error
  }

  const caso = await prisma.caso.findUnique({ where: { id: casoId } })
  if (!caso) {
    const error = new Error('El caso no existe.')
    error.tipo = 'NO_ENCONTRADO'
    throw error
  }

  return prisma.caso.update({
    where: { id: casoId },
    data: { estado: nuevoEstado },
    include: INCLUDE_CASO_COMPLETO,
  })
}

async function eliminarCaso(casoId) {
  casoId = Number(casoId)

  const caso = await prisma.caso.findUnique({ where: { id: casoId } })
  if (!caso) {
    const error = new Error('El caso no existe.')
    error.tipo = 'NO_ENCONTRADO'
    throw error
  }

  // Borrado permanente en cascada: primero las relaciones que dependen
  // del caso (acciones y asociaciones con incidentes), y al final el caso.
  // Los incidentes en sí NO se eliminan, solo se desasocian de este caso.
  await prisma.$transaction([
    prisma.accionIntervencion.deleteMany({ where: { casoId } }),
    prisma.casoIncidente.deleteMany({ where: { casoId } }),
    prisma.caso.delete({ where: { id: casoId } }),
  ])
}

async function editarCaso(casoId, datos) {
  casoId = Number(casoId)

  const caso = await prisma.caso.findUnique({ where: { id: casoId } })
  if (!caso) {
    const error = new Error('El caso no existe.')
    error.tipo = 'NO_ENCONTRADO'
    throw error
  }

  const errores = []
  if (datos.titulo !== undefined && String(datos.titulo).trim() === '') {
    errores.push('El campo "titulo" no puede estar vacío.')
  }
  if (datos.descripcion !== undefined && datos.descripcion !== null && String(datos.descripcion).trim() === '') {
    errores.push('El campo "descripcion" no puede estar vacío si se envía.')
  }
  if (errores.length > 0) {
    const error = new Error('Datos inválidos')
    error.tipo = 'VALIDACION'
    error.errores = errores
    throw error
  }

  const data = {}
  if (datos.titulo !== undefined) data.titulo = String(datos.titulo).trim()
  if (datos.descripcion !== undefined) {
    data.descripcion = datos.descripcion === null ? null : String(datos.descripcion).trim()
  }

  return prisma.caso.update({
    where: { id: casoId },
    data,
    include: INCLUDE_CASO_COMPLETO,
  })
}

async function desasociarIncidenteDelCaso(casoId, incidenteId) {
  casoId = Number(casoId)
  incidenteId = Number(incidenteId)

  const relacion = await prisma.casoIncidente.findUnique({
    where: { casoId_incidenteId: { casoId, incidenteId } },
  })
  if (!relacion) {
    const error = new Error('El incidente no está asociado a este caso.')
    error.tipo = 'NO_ENCONTRADO'
    throw error
  }

  await prisma.casoIncidente.delete({
    where: { casoId_incidenteId: { casoId, incidenteId } },
  })

  return prisma.caso.findUnique({ where: { id: casoId }, include: INCLUDE_CASO_COMPLETO })
}

async function editarAccion(casoId, accionId, datos) {
  casoId = Number(casoId)
  accionId = Number(accionId)

  const accion = await prisma.accionIntervencion.findUnique({ where: { id: accionId } })
  if (!accion || accion.casoId !== casoId) {
    const error = new Error('La acción no existe en este caso.')
    error.tipo = 'NO_ENCONTRADO'
    throw error
  }

  const errores = []
  if (datos.tipo !== undefined && !TIPOS_ACCION_VALIDOS.includes(datos.tipo)) {
    errores.push(`El campo "tipo" debe ser uno de: ${TIPOS_ACCION_VALIDOS.join(', ')}.`)
  }
  if (datos.fecha !== undefined && isNaN(new Date(datos.fecha).getTime())) {
    errores.push('El campo "fecha" debe ser una fecha válida (ISO 8601).')
  }
  if (errores.length > 0) {
    const error = new Error('Datos inválidos')
    error.tipo = 'VALIDACION'
    error.errores = errores
    throw error
  }

  const data = {}
  if (datos.tipo !== undefined) data.tipo = datos.tipo
  if (datos.descripcion !== undefined) {
    data.descripcion = datos.descripcion === null ? null : String(datos.descripcion).trim()
  }
  if (datos.fecha !== undefined) data.fecha = new Date(datos.fecha)

  await prisma.accionIntervencion.update({ where: { id: accionId }, data })

  return prisma.caso.findUnique({ where: { id: casoId }, include: INCLUDE_CASO_COMPLETO })
}

async function eliminarAccion(casoId, accionId) {
  casoId = Number(casoId)
  accionId = Number(accionId)

  const accion = await prisma.accionIntervencion.findUnique({ where: { id: accionId } })
  if (!accion || accion.casoId !== casoId) {
    const error = new Error('La acción no existe en este caso.')
    error.tipo = 'NO_ENCONTRADO'
    throw error
  }

  await prisma.accionIntervencion.delete({ where: { id: accionId } })

  return prisma.caso.findUnique({ where: { id: casoId }, include: INCLUDE_CASO_COMPLETO })
}

export {
  crearCaso,
  asociarIncidenteAlCaso,
  desasociarIncidenteDelCaso,
  obtenerCaso,
  listarCasos,
  registrarAccion,
  editarAccion,
  eliminarAccion,
  actualizarEstadoCaso,
  editarCaso,
  eliminarCaso,
  validarDatosCaso,
  validarDatosAccion,
}