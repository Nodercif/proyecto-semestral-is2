import * as casoService from '../services/casoService.js'

export const crearCaso = async (req, res) => {
  try {
    const caso = await casoService.crearCaso(req.body)
    res.status(201).json({ data: caso })
  } catch (error) {
    if (error.tipo === 'VALIDACION') {
      return res.status(400).json({ errores: error.errores })
    }
    console.error('Error al crear caso:', error)
    res.status(500).json({ error: 'Error al crear el caso.' })
  }
}

export const asociarIncidente = async (req, res) => {
  try {
    const casoId = parseInt(req.params.id, 10)
    const { incidenteId } = req.body

    if (isNaN(casoId)) {
      return res.status(400).json({ error: 'El id del caso debe ser un número.' })
    }

    if (!incidenteId || isNaN(parseInt(incidenteId, 10))) {
      return res.status(400).json({ error: 'El incidenteId es obligatorio y debe ser un número.' })
    }

    const caso = await casoService.asociarIncidenteAlCaso(casoId, parseInt(incidenteId, 10))
    res.status(200).json({ data: caso })
  } catch (error) {
    if (error.tipo === 'NO_ENCONTRADO') {
      return res.status(404).json({ error: error.message })
    }
    if (error.tipo === 'CONFLICTO') {
      return res.status(409).json({ error: error.message })
    }
    console.error('Error al asociar incidente:', error)
    res.status(500).json({ error: 'Error al asociar el incidente al caso.' })
  }
}

export const obtenerCaso = async (req, res) => {
  try {
    const casoId = parseInt(req.params.id, 10)
    if (isNaN(casoId)) {
      return res.status(400).json({ error: 'El id del caso debe ser un número.' })
    }
    const caso = await casoService.obtenerCaso(casoId)
    res.status(200).json({ data: caso })
  } catch (error) {
    if (error.tipo === 'NO_ENCONTRADO') {
      return res.status(404).json({ error: error.message })
    }
    console.error('Error al obtener caso:', error)
    res.status(500).json({ error: 'Error al obtener el caso.' })
  }
}

export const listarCasos = async (req, res) => {
  try {
    const { estado, texto, desde, hasta } = req.query
    const casos = await casoService.listarCasos({ estado, texto, desde, hasta })
    res.status(200).json({ data: casos })
  } catch (error) {
    console.error('Error al listar casos:', error)
    res.status(500).json({ error: 'Error al listar los casos.' })
  }
}

export const registrarAccion = async (req, res) => {
  try {
    const casoId = parseInt(req.params.id, 10)
    if (isNaN(casoId)) {
      return res.status(400).json({ error: 'El id del caso debe ser un número.' })
    }
    const caso = await casoService.registrarAccion(casoId, req.body)
    res.status(201).json({ data: caso })
  } catch (error) {
    if (error.tipo === 'VALIDACION') {
      return res.status(400).json({ errores: error.errores })
    }
    if (error.tipo === 'NO_ENCONTRADO') {
      return res.status(404).json({ error: error.message })
    }
    console.error('Error al registrar acción:', error)
    res.status(500).json({ error: 'Error al registrar la acción de intervención.' })
  }
}

export const actualizarEstado = async (req, res) => {
  try {
    const casoId = parseInt(req.params.id, 10)
    if (isNaN(casoId)) {
      return res.status(400).json({ error: 'El id del caso debe ser un número.' })
    }
    const caso = await casoService.actualizarEstadoCaso(casoId, req.body.estado)
    res.status(200).json({ data: caso })
  } catch (error) {
    if (error.tipo === 'VALIDACION') {
      return res.status(400).json({ errores: error.errores })
    }
    if (error.tipo === 'NO_ENCONTRADO') {
      return res.status(404).json({ error: error.message })
    }
    console.error('Error al actualizar estado del caso:', error)
    res.status(500).json({ error: 'Error al actualizar el estado del caso.' })
  }
}

export const eliminarCaso = async (req, res) => {
  try {
    const casoId = parseInt(req.params.id, 10)
    if (isNaN(casoId)) {
      return res.status(400).json({ error: 'El id del caso debe ser un número.' })
    }
    await casoService.eliminarCaso(casoId)
    res.status(204).send()
  } catch (error) {
    if (error.tipo === 'NO_ENCONTRADO') {
      return res.status(404).json({ error: error.message })
    }
    console.error('Error al eliminar caso:', error)
    res.status(500).json({ error: 'Error al eliminar el caso.' })
  }
}

export const editarCaso = async (req, res) => {
  try {
    const casoId = parseInt(req.params.id, 10)
    if (isNaN(casoId)) {
      return res.status(400).json({ error: 'El id del caso debe ser un número.' })
    }
    const caso = await casoService.editarCaso(casoId, req.body)
    res.status(200).json({ data: caso })
  } catch (error) {
    if (error.tipo === 'VALIDACION') {
      return res.status(400).json({ errores: error.errores })
    }
    if (error.tipo === 'NO_ENCONTRADO') {
      return res.status(404).json({ error: error.message })
    }
    console.error('Error al editar caso:', error)
    res.status(500).json({ error: 'Error al editar el caso.' })
  }
}

export const desasociarIncidente = async (req, res) => {
  try {
    const casoId = parseInt(req.params.id, 10)
    const incidenteId = parseInt(req.params.incidenteId, 10)
    if (isNaN(casoId) || isNaN(incidenteId)) {
      return res.status(400).json({ error: 'El id del caso y del incidente deben ser números.' })
    }
    const caso = await casoService.desasociarIncidenteDelCaso(casoId, incidenteId)
    res.status(200).json({ data: caso })
  } catch (error) {
    if (error.tipo === 'NO_ENCONTRADO') {
      return res.status(404).json({ error: error.message })
    }
    console.error('Error al desasociar incidente:', error)
    res.status(500).json({ error: 'Error al desasociar el incidente del caso.' })
  }
}

export const editarAccion = async (req, res) => {
  try {
    const casoId = parseInt(req.params.id, 10)
    const accionId = parseInt(req.params.accionId, 10)
    if (isNaN(casoId) || isNaN(accionId)) {
      return res.status(400).json({ error: 'El id del caso y de la acción deben ser números.' })
    }
    const caso = await casoService.editarAccion(casoId, accionId, req.body)
    res.status(200).json({ data: caso })
  } catch (error) {
    if (error.tipo === 'VALIDACION') {
      return res.status(400).json({ errores: error.errores })
    }
    if (error.tipo === 'NO_ENCONTRADO') {
      return res.status(404).json({ error: error.message })
    }
    console.error('Error al editar acción:', error)
    res.status(500).json({ error: 'Error al editar la acción.' })
  }
}

export const eliminarAccion = async (req, res) => {
  try {
    const casoId = parseInt(req.params.id, 10)
    const accionId = parseInt(req.params.accionId, 10)
    if (isNaN(casoId) || isNaN(accionId)) {
      return res.status(400).json({ error: 'El id del caso y de la acción deben ser números.' })
    }
    const caso = await casoService.eliminarAccion(casoId, accionId)
    res.status(200).json({ data: caso })
  } catch (error) {
    if (error.tipo === 'NO_ENCONTRADO') {
      return res.status(404).json({ error: error.message })
    }
    console.error('Error al eliminar acción:', error)
    res.status(500).json({ error: 'Error al eliminar la acción.' })
  }
}