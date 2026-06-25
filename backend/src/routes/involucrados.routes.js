import { Router } from 'express'
import authenticate from '../middlewares/authenticate.js'
import { authorize, ROLES } from '../middlewares/authorize.js'
import prisma from '../config/prisma.js'

const router = Router()

// Valores permitidos (copiados de schema.prisma)
const ROLES_INVOLUCRADO_VALIDOS = ['AFECTADO', 'RESPONSABLE', 'TESTIGO', 'INTERVINIENTE']

// Aplicar autenticación a TODAS las rutas
router.use(authenticate)

// POST /incidentes/:id/involucrados
router.post(
  '/:id/involucrados',
  authorize(ROLES.ADMINISTRADOR, ROLES.ENCARGADO_CONVIVENCIA, ROLES.INSPECTOR, ROLES.DOCENTE),
  async (req, res) => {
    const incidenteId = parseInt(req.params.id, 10)

    if (isNaN(incidenteId)) {
      return res.status(400).json({ error: 'El parámetro id debe ser un número entero.' })
    }

    const { estudianteId, rol, observacion, funcionarioIntervinienteId } = req.body

    // Validación de campos obligatorios
    const errores = []
    if (!estudianteId) errores.push('El campo "estudianteId" es obligatorio.')
    if (!rol) errores.push('El campo "rol" es obligatorio.')
    else if (!ROLES_INVOLUCRADO_VALIDOS.includes(rol)) {
      errores.push(`El campo "rol" debe ser uno de: ${ROLES_INVOLUCRADO_VALIDOS.join(', ')}.`)
    }

    if (errores.length > 0) {
      return res.status(400).json({ error: errores.join(' ') })
    }

    try {
      // Verificar que el incidente existe
      const incidente = await prisma.incidente.findUnique({
        where: { id: incidenteId },
      })
      if (!incidente) {
        return res.status(404).json({ error: `No existe un incidente con id ${incidenteId}.` })
      }

      // Verificar que el estudiante existe
      const estudiante = await prisma.estudiante.findUnique({
        where: { id: parseInt(estudianteId, 10) },
      })
      if (!estudiante) {
        return res.status(404).json({ error: `No existe un estudiante con id ${estudianteId}.` })
      }

      // Crear el involucrado
      const involucrado = await prisma.involucrado.create({
        data: {
          incidenteId,
          estudianteId: parseInt(estudianteId, 10),
          rol,
          observacion: observacion || null,
          funcionarioIntervinienteId: funcionarioIntervinienteId ? parseInt(funcionarioIntervinienteId, 10) : null,
        },
        include: {
          estudiante: true,
          funcionarioInterviniente: true,
        },
      })

      res.status(201).json(involucrado)
    } catch (error) {
      // Violación de restricción única: mismo estudiante + mismo rol + mismo incidente
      if (error?.code === 'P2002') {
        return res.status(409).json({
          error: 'El estudiante ya está registrado con este rol en el incidente.',
        })
      }
      console.error('Error al crear involucrado:', error)
      res.status(500).json({ error: 'Error al crear el involucrado.' })
    }
  }
)

export default router