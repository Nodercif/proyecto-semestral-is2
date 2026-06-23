const express = require('express')
const app = express()

app.use(express.json())

const casoService = require('./services/casoService')

// ── POST /casos ──────────────────────────────────────────────────────────────
app.post('/casos', async (req, res) => {
  try {
    const caso = await casoService.crearCaso(req.body)
    return res.status(201).json({ mensaje: 'Caso creado exitosamente.', data: caso })
  } catch (error) {
    if (error.tipo === 'VALIDACION') {
      return res.status(400).json({ mensaje: 'Error de validación.', errores: error.errores })
    }
    return res.status(500).json({ mensaje: 'Error interno del servidor.' })
  }
})

// ── GET /casos ───────────────────────────────────────────────────────────────
app.get('/casos', async (req, res) => {
  try {
    const casos = await casoService.listarCasos()
    return res.status(200).json({ data: casos })
  } catch (error) {
    return res.status(500).json({ mensaje: 'Error interno del servidor.' })
  }
})

// ── GET /casos/:id ───────────────────────────────────────────────────────────
app.get('/casos/:id', async (req, res) => {
  try {
    const caso = await casoService.obtenerCaso(req.params.id)
    return res.status(200).json({ data: caso })
  } catch (error) {
    if (error.tipo === 'NO_ENCONTRADO') {
      return res.status(404).json({ mensaje: error.mensaje })
    }
    return res.status(500).json({ mensaje: 'Error interno del servidor.' })
  }
})

// ── POST /casos/:id/incidentes ───────────────────────────────────────────────
app.post('/casos/:id/incidentes', async (req, res) => {
  try {
    const caso = await casoService.asociarIncidenteAlCaso(req.params.id, req.body.incidenteId)
    return res.status(200).json({ mensaje: 'Incidente asociado al caso exitosamente.', data: caso })
  } catch (error) {
    if (error.tipo === 'VALIDACION') {
      return res.status(400).json({ mensaje: 'Error de validación.', errores: error.errores })
    }
    if (error.tipo === 'CONFLICTO') {
      return res.status(409).json({ mensaje: error.mensaje })
    }
    if (error.tipo === 'NO_ENCONTRADO') {
      return res.status(404).json({ mensaje: error.mensaje })
    }
    return res.status(500).json({ mensaje: 'Error interno del servidor.' })
  }
})

module.exports = app