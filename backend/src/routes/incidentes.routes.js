import { Router } from 'express';

import authenticate from '../middlewares/authenticate.js';
import { authorize, ROLES } from '../middlewares/authorize.js';
const router = Router();

import { PrismaClient } from '@prisma/client'
const prisma = new PrismaClient()

// ── Valores permitidos según el schema.prisma ──────────────────────────────
const TIPOS_VALIDOS = [
  'CONFLICTO',
  'AGRESION_FISICA',
  'AGRESION_VERBAL',
  'ACOSO',
  'DANO_MATERIAL',
]
const GRAVEDADES_VALIDAS = ['LEVE', 'MODERADO', 'GRAVE', 'MUY_GRAVE']
const ROLES_INVOLUCRADO_VALIDOS = ['AFECTADO', 'RESPONSABLE', 'TESTIGO', 'INTERVINIENTE']

// ── Aplicar autenticación a TODAS las rutas ────────────────────────────────
router.use(authenticate);

// ── GET /incidentes ────────────────────────────────────────────────────────
// Lista incidentes con filtros opcionales por query params:
// ?texto=, ?tipo=, ?gravedad=, ?desde=, ?hasta=
router.get(
  '/',
  authorize(
    ROLES.ADMINISTRADOR,
    ROLES.ENCARGADO_CONVIVENCIA,
    ROLES.INSPECTOR,
    ROLES.DOCENTE,
    ROLES.ORIENTADOR,
    ROLES.EQUIPO_DIRECTIVO
  ),
  async (req, res) => {
    const { texto, tipo, gravedad, desde, hasta } = req.query
    const where = {}

    if (tipo) {
      if (!TIPOS_VALIDOS.includes(tipo)) {
        return res.status(400).json({ error: `El parámetro "tipo" debe ser uno de: ${TIPOS_VALIDOS.join(', ')}.` })
      }
      where.tipo = tipo
    }

    if (gravedad) {
      if (!GRAVEDADES_VALIDAS.includes(gravedad)) {
        return res.status(400).json({ error: `El parámetro "gravedad" debe ser uno de: ${GRAVEDADES_VALIDAS.join(', ')}.` })
      }
      where.gravedad = gravedad
    }

    if (texto) {
      const idTexto = parseInt(texto, 10)
      where.OR = [
        { descripcion: { contains: texto, mode: 'insensitive' } },
        ...(!isNaN(idTexto) ? [{ id: idTexto }] : []),
      ]
    }

    if (desde || hasta) {
      where.fecha = {}
      if (desde) where.fecha.gte = new Date(desde)
      if (hasta) where.fecha.lte = new Date(`${hasta}T23:59:59.999Z`)
    }

    try {
      const incidentes = await prisma.incidente.findMany({
        where,
        include: {
          involucrados: { include: { estudiante: true } },
          registradoPor: true,
        },
        orderBy: { fecha: 'desc' },
      })
      res.status(200).json({ data: incidentes })
    } catch (error) {
      console.error('Error al listar incidentes:', error)
      res.status(500).json({ error: 'Error al listar los incidentes.' })
    }
  }
)

// ── GET /incidentes/:id ─────────────────────────────────────────────────────
// Devuelve el detalle completo de un incidente (incluye involucrados),
// necesario para precargar el formulario de edición.
router.get(
  '/:id',
  authorize(
    ROLES.ADMINISTRADOR,
    ROLES.ENCARGADO_CONVIVENCIA,
    ROLES.INSPECTOR,
    ROLES.DOCENTE,
    ROLES.ORIENTADOR,
    ROLES.EQUIPO_DIRECTIVO
  ),
  async (req, res) => {
    const incidenteId = parseInt(req.params.id, 10)

    if (isNaN(incidenteId)) {
      return res.status(400).json({ error: 'El parámetro id debe ser un número entero.' })
    }

    try {
      const incidente = await prisma.incidente.findUnique({
        where: { id: incidenteId },
        include: {
          involucrados: {
            include: {
              estudiante: true,
              funcionarioInterviniente: true,
            },
          },
          registradoPor: true,
        },
      })

      if (!incidente) {
        return res.status(404).json({ error: `No existe un incidente con id ${incidenteId}.` })
      }

      res.status(200).json(incidente)
    } catch (error) {
      console.error('Error al obtener incidente:', error)
      res.status(500).json({ error: 'Error al obtener el incidente.' })
    }
  }
)

// ── POST /incidentes ───────────────────────────────────────────────────────
router.post(
  '/',
  authorize(ROLES.ADMINISTRADOR, ROLES.ENCARGADO_CONVIVENCIA, ROLES.INSPECTOR, ROLES.DOCENTE, ROLES.ORIENTADOR, ROLES.EQUIPO_DIRECTIVO),
  async (req, res) => {
    const { fecha, descripcion, tipo, gravedad, involucrados } = req.body;
    const registradoPorId = req.usuario.funcionarioId;

    // Validación básica
    const errores = [];
    if (!fecha || isNaN(new Date(fecha).getTime())) errores.push('Fecha inválida.');
    if (!descripcion || descripcion.trim() === '') errores.push('Descripción obligatoria.');
    if (!tipo || !TIPOS_VALIDOS.includes(tipo)) errores.push('Tipo inválido.');
    if (!gravedad || !GRAVEDADES_VALIDAS.includes(gravedad)) errores.push('Gravedad inválida.');
    if (!Array.isArray(involucrados)) errores.push('El campo "involucrados" debe ser un arreglo.');

    if (errores.length > 0) {
      return res.status(400).json({ errores });
    }

    // Validar cada involucrado
    for (let i = 0; i < involucrados.length; i++) {
      const inv = involucrados[i];
      if (!inv.estudianteId) errores.push(`Involucrado ${i+1}: estudianteId obligatorio.`);
      if (!inv.rol || !ROLES_INVOLUCRADO_VALIDOS.includes(inv.rol)) {
        errores.push(`Involucrado ${i+1}: rol inválido.`);
      }
    }
    if (errores.length > 0) {
      return res.status(400).json({ errores });
    }

    try {
      const resultado = await prisma.$transaction(async (tx) => {
        // 1. Crear incidente
        const incidente = await tx.incidente.create({
          data: {
            fecha: new Date(fecha),
            descripcion: descripcion.trim(),
            tipo,
            gravedad,
            registradoPorId,
          },
        });

        // 2. Crear involucrados (si los hay)
        for (const inv of involucrados) {
          await tx.involucrado.create({
            data: {
              incidenteId: incidente.id,
              estudianteId: Number(inv.estudianteId),
              rol: inv.rol,
              observacion: inv.observacion || null,
              funcionarioIntervinienteId: inv.funcionarioIntervinienteId ? Number(inv.funcionarioIntervinienteId) : null,
            },
          });
        }

        // 3. Devolver incidente con sus involucrados
        return tx.incidente.findUnique({
          where: { id: incidente.id },
          include: {
            involucrados: { include: { estudiante: true, funcionarioInterviniente: true } },
            registradoPor: true,
          },
        });
      });

      res.status(201).json({ mensaje: 'Incidente registrado exitosamente.', data: resultado });
    } catch (error) {
      if (error.code === 'P2002') {
        return res.status(409).json({ error: 'Conflicto: estudiante ya tiene ese rol en el incidente.' });
      }
      console.error(error);
      res.status(500).json({ error: 'Error al registrar incidente.' });
    }
  }
);

// ── PUT /incidentes/:id ──────────────────────────────────────────────────────
// Permite editar un incidente ya registrado: sus datos básicos (fecha, tipo,
// gravedad, descripción) y la lista completa de involucrados (estudiante,
// rol, observación y funcionario interviniente). Reemplaza por completo la
// lista de involucrados enviada en el body: los que no se incluyan se
// eliminan, los que incluyan "id" se actualizan y los que no tengan "id"
// se crean.
//
// Body esperado (todos los campos son opcionales; solo se actualiza lo enviado):
// {
//   fecha?: string (ISO 8601),
//   descripcion?: string,
//   tipo?: TipoIncidente,
//   gravedad?: NivelGravedad,
//   involucrados?: [
//     {
//       id?: number,                          // si se omite, se crea uno nuevo
//       estudianteId: number,
//       rol: "AFECTADO" | "RESPONSABLE" | "TESTIGO" | "INTERVINIENTE",
//       observacion?: string,
//       funcionarioIntervinienteId?: number
//     }
//   ]
// }
router.put(
  '/:id',
  authorize(
    ROLES.ADMINISTRADOR,
    ROLES.ENCARGADO_CONVIVENCIA
  ),
  async (req, res) => {
    const incidenteId = parseInt(req.params.id, 10)

    if (isNaN(incidenteId)) {
      return res.status(400).json({ error: 'El parámetro id debe ser un número entero.' })
    }

    const incidenteExistente = await prisma.incidente.findUnique({ where: { id: incidenteId } })

    if (!incidenteExistente) {
      return res.status(404).json({ error: `No existe un incidente con id ${incidenteId}.` })
    }

    const { fecha, descripcion, tipo, gravedad, involucrados } = req.body
    const errores = []

    // ── Validación de los campos del incidente (solo si fueron enviados) ──
    if (tipo !== undefined && !TIPOS_VALIDOS.includes(tipo)) {
      errores.push(`El campo "tipo" debe ser uno de: ${TIPOS_VALIDOS.join(', ')}.`)
    }

    if (gravedad !== undefined && !GRAVEDADES_VALIDAS.includes(gravedad)) {
      errores.push(`El campo "gravedad" debe ser uno de: ${GRAVEDADES_VALIDAS.join(', ')}.`)
    }

    if (descripcion !== undefined && String(descripcion).trim() === '') {
      errores.push('El campo "descripcion" no puede estar vacío.')
    }

    if (fecha !== undefined && isNaN(new Date(fecha).getTime())) {
      errores.push('El campo "fecha" debe ser una fecha válida (ISO 8601).')
    }

    // ── Validación de los involucrados (si se envió la lista) ─────────────
    let involucradosValidados = null

    if (involucrados !== undefined) {
      if (!Array.isArray(involucrados)) {
        errores.push('El campo "involucrados" debe ser un arreglo.')
      } else {
        involucradosValidados = involucrados.map((inv, idx) => {
          const estudianteId = Number(inv.estudianteId)

          if (!inv.estudianteId || isNaN(estudianteId)) {
            errores.push(`Involucrado #${idx + 1}: "estudianteId" es obligatorio y debe ser un número.`)
          }

          if (!inv.rol || !ROLES_INVOLUCRADO_VALIDOS.includes(inv.rol)) {
            errores.push(`Involucrado #${idx + 1}: "rol" debe ser uno de: ${ROLES_INVOLUCRADO_VALIDOS.join(', ')}.`)
          }

          let funcionarioIntervinienteId = null
          if (inv.funcionarioIntervinienteId !== undefined && inv.funcionarioIntervinienteId !== null) {
            funcionarioIntervinienteId = Number(inv.funcionarioIntervinienteId)
            if (isNaN(funcionarioIntervinienteId)) {
              errores.push(`Involucrado #${idx + 1}: "funcionarioIntervinienteId" debe ser un número.`)
            }
          }

          return {
            id: inv.id !== undefined && inv.id !== null ? Number(inv.id) : undefined,
            estudianteId,
            rol: inv.rol,
            observacion: inv.observacion ?? null,
            funcionarioIntervinienteId,
          }
        })
      }
    }

    if (errores.length > 0) {
      return res.status(400).json({
        mensaje: 'Error de validación. Revisa los campos enviados.',
        errores,
      })
    }

    // ── Verificar existencia de las entidades referenciadas ────────────────
    if (involucradosValidados) {
      for (const inv of involucradosValidados) {
        const estudiante = await prisma.estudiante.findUnique({ where: { id: inv.estudianteId } })
        if (!estudiante) {
          return res.status(404).json({ error: `No existe un estudiante con id ${inv.estudianteId}.` })
        }

        if (inv.funcionarioIntervinienteId) {
          const funcionario = await prisma.funcionarioInstitucional.findUnique({
            where: { id: inv.funcionarioIntervinienteId },
          })
          if (!funcionario) {
            return res.status(404).json({
              error: `No existe un funcionario con id ${inv.funcionarioIntervinienteId}.`,
            })
          }
        }
      }

      // Si un mismo involucrado (id) fue enviado dos veces, o si dos
      // involucrados nuevos comparten estudiante+rol, evitamos el conflicto
      // antes de tocar la base de datos.
      const claves = new Set()
      for (const inv of involucradosValidados) {
        const clave = `${inv.estudianteId}-${inv.rol}`
        if (claves.has(clave)) {
          return res.status(409).json({
            error: `El estudiante con id ${inv.estudianteId} está duplicado con el rol '${inv.rol}' en la lista enviada.`,
          })
        }
        claves.add(clave)
      }
    }

    // ── Persistir cambios en una transacción ───────────────────────────────
    try {
      const incidenteActualizado = await prisma.$transaction(async (tx) => {
        const dataIncidente = {}
        if (fecha !== undefined) dataIncidente.fecha = new Date(fecha)
        if (descripcion !== undefined) dataIncidente.descripcion = String(descripcion).trim()
        if (tipo !== undefined) dataIncidente.tipo = tipo
        if (gravedad !== undefined) dataIncidente.gravedad = gravedad

        if (Object.keys(dataIncidente).length > 0) {
          await tx.incidente.update({ where: { id: incidenteId }, data: dataIncidente })
        }

        if (involucradosValidados) {
          const existentes = await tx.involucrado.findMany({ where: { incidenteId } })
          const idsEnviados = involucradosValidados
            .filter((inv) => inv.id !== undefined)
            .map((inv) => inv.id)

          // Eliminar los involucrados existentes que ya no vienen en la lista
          const aEliminar = existentes.filter((e) => !idsEnviados.includes(e.id))
          if (aEliminar.length > 0) {
            await tx.involucrado.deleteMany({ where: { id: { in: aEliminar.map((e) => e.id) } } })
          }

          // Actualizar los existentes y crear los nuevos
          for (const inv of involucradosValidados) {
            const dataInv = {
              estudianteId: inv.estudianteId,
              rol: inv.rol,
              observacion: inv.observacion,
              funcionarioIntervinienteId: inv.funcionarioIntervinienteId,
            }

            const yaExiste = inv.id !== undefined && existentes.some((e) => e.id === inv.id)

            if (yaExiste) {
              await tx.involucrado.update({ where: { id: inv.id }, data: dataInv })
            } else {
              await tx.involucrado.create({ data: { incidenteId, ...dataInv } })
            }
          }
        }

        return tx.incidente.findUnique({
          where: { id: incidenteId },
          include: {
            involucrados: {
              include: { estudiante: true, funcionarioInterviniente: true },
            },
            registradoPor: true,
          },
        })
      })

      res.status(200).json({
        mensaje: 'Incidente actualizado exitosamente.',
        data: incidenteActualizado,
      })
    } catch (error) {
      // Violación de restricción única: mismo estudiante + mismo rol + mismo incidente
      if (error?.code === 'P2002') {
        return res.status(409).json({
          error: 'Uno de los estudiantes ya está registrado con ese rol en este incidente.',
        })
      }
      console.error('Error al actualizar incidente:', error)
      res.status(500).json({ error: 'Error al actualizar el incidente.' })
    }
  }
)

// ── DELETE /incidentes/:id ────────────────────────────────────────────────
// Borrado permanente en cascada: elimina los involucrados del incidente y
// sus asociaciones a casos (CasoIncidente), pero NO elimina los casos en sí.
router.delete(
  '/:id',
  authorize(ROLES.ADMINISTRADOR, ROLES.ENCARGADO_CONVIVENCIA),
  async (req, res) => {
    const incidenteId = parseInt(req.params.id, 10)

    if (isNaN(incidenteId)) {
      return res.status(400).json({ error: 'El parámetro id debe ser un número entero.' })
    }

    try {
      const incidente = await prisma.incidente.findUnique({ where: { id: incidenteId } })
      if (!incidente) {
        return res.status(404).json({ error: `No existe un incidente con id ${incidenteId}.` })
      }

      await prisma.$transaction([
        prisma.involucrado.deleteMany({ where: { incidenteId } }),
        prisma.casoIncidente.deleteMany({ where: { incidenteId } }),
        prisma.incidente.delete({ where: { id: incidenteId } }),
      ])

      res.status(204).send()
    } catch (error) {
      console.error('Error al eliminar incidente:', error)
      res.status(500).json({ error: 'Error al eliminar el incidente.' })
    }
  }
);

export default router;