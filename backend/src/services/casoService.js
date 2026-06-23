const prisma = require('../prismaClient')

function validarDatosCaso(datos) {
  const errores = []
  if (!datos.titulo || datos.titulo.trim() === '') {
    errores.push('El campo "titulo" es obligatorio.')
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
    data: { titulo: datos.titulo.trim(), estado: 'ABIERTO' },
    include: {
      casoIncidentes: { include: { incidente: { include: { involucrados: { include: { estudiante: true } }, registradoPor: true } } } },
      acciones: true,
    },
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

  return prisma.caso.findUnique({
    where: { id: casoId },
    include: {
      casoIncidentes: { include: { incidente: { include: { involucrados: { include: { estudiante: true } }, registradoPor: true } } } },
      acciones: true,
    },
  })
}

async function obtenerCaso(casoId) {
  casoId = Number(casoId)
  const caso = await prisma.caso.findUnique({
    where: { id: casoId },
    include: {
      casoIncidentes: { include: { incidente: { include: { involucrados: { include: { estudiante: true } }, registradoPor: true } } } },
      acciones: true,
    },
  })
  if (!caso) {
    const error = new Error('El caso no existe.')
    error.tipo = 'NO_ENCONTRADO'
    throw error
  }
  return caso
}

async function listarCasos() {
  return prisma.caso.findMany({
    include: { casoIncidentes: { include: { incidente: true } }, acciones: true },
    orderBy: { createdAt: 'desc' },
  })
}

module.exports = { crearCaso, asociarIncidenteAlCaso, obtenerCaso, listarCasos, validarDatosCaso }