const incidenteService = require('../services/incidenteService')

/**
 * POST /incidentes
 * Registra un nuevo incidente de convivencia escolar.
 *
 * Body esperado:
 * {
 *   tipo: TipoIncidente,
 *   gravedad: NivelGravedad,
 *   descripcion: string,
 *   lugar: string,
 *   fechaOcurrencia: string (ISO 8601),
 *   reportadoPorId: number,
 *   observaciones?: string   (opcional)
 * }
 */
async function registrarIncidente(req, res) {
  try {
    const incidente = await incidenteService.registrarIncidente(req.body)

    return res.status(201).json({
      mensaje: 'Incidente registrado exitosamente.',
      data: incidente,
    })
  } catch (error) {
    // Error de validación de campos → 400 Bad Request
    if (error.tipo === 'VALIDACION') {
      return res.status(400).json({
        mensaje: 'Error de validación. Revisa los campos enviados.',
        errores: error.errores,
      })
    }

    // Error inesperado → 500 Internal Server Error
    console.error('Error al registrar incidente:', error)
    return res.status(500).json({
      mensaje: 'Error interno del servidor. Intenta nuevamente.',
    })
  }
}

module.exports = { registrarIncidente }
