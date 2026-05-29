const express = require('express')
const router = express.Router()
const incidenteController = require('../controllers/incidenteController')

// POST /incidentes — Registrar nuevo incidente (HU1)
router.post('/', incidenteController.registrarIncidente)

module.exports = router
