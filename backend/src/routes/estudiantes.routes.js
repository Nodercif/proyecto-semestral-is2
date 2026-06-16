/**
 * src/routes/estudiantes.routes.js
 * Rutas relacionadas con estudiantes.
 *
 * GET /estudiantes                   → búsqueda por nombre parcial y/o curso (con paginación)
 * GET /estudiantes/:id/incidentes    → historial de incidentes de un estudiante
 */

import { Router } from 'express';
import { PrismaClient } from '@prisma/client';
import authenticate from '../middlewares/authenticate.js';

const router = Router();
const prisma = new PrismaClient();

// Autenticación requerida en todas las rutas
router.use(authenticate);

// ── GET /estudiantes ───────────────────────────────────────────────────────────
// Query params opcionales:
//   nombre  → búsqueda parcial (case-insensitive) en nombres o apellidos
//   curso   → filtro exacto por curso (ej: "3°A")
//   page    → número de página (default: 1)
//   limit   → resultados por página (default: 20)
router.get('/', async (req, res) => {
  const { nombre, curso } = req.query;
  const page  = Math.max(1, parseInt(req.query.page)  || 1);
  const limit = Math.min(100, Math.max(1, parseInt(req.query.limit) || 20));
  const skip  = (page - 1) * limit;

  // Construir filtro dinámicamente según los parámetros recibidos
  const where = {};

  if (nombre && nombre.trim() !== '') {
    // Búsqueda parcial en nombres O apellidos, sin importar mayúsculas
    where.OR = [
      { nombres:   { contains: nombre.trim(), mode: 'insensitive' } },
      { apellidos: { contains: nombre.trim(), mode: 'insensitive' } },
    ];
  }

  if (curso && curso.trim() !== '') {
    where.curso = { equals: curso.trim(), mode: 'insensitive' };
  }

  try {
    // Ejecutar conteo y búsqueda en paralelo para mejor rendimiento
    const [total, estudiantes] = await Promise.all([
      prisma.estudiante.count({ where }),
      prisma.estudiante.findMany({
        where,
        orderBy: [{ apellidos: 'asc' }, { nombres: 'asc' }],
        skip,
        take: limit,
        select: {
          id:        true,
          rut:       true,
          nombres:   true,
          apellidos: true,
          curso:     true,
        },
      }),
    ]);

    return res.status(200).json({
      data: estudiantes,
      paginacion: {
        total,
        page,
        limit,
        totalPaginas: Math.ceil(total / limit),
      },
    });
  } catch (error) {
    console.error('[GET /estudiantes] Error:', error);
    return res.status(500).json({ error: 'Error interno del servidor.' });
  }
});

// ── GET /estudiantes/:id/incidentes ───────────────────────────────────────────
router.get('/:id/incidentes', async (req, res) => {
  const estudianteId = parseInt(req.params.id, 10);

  if (isNaN(estudianteId)) {
    return res.status(400).json({ error: 'El parámetro id debe ser un número entero.' });
  }

  const estudiante = await prisma.estudiante.findUnique({
    where: { id: estudianteId },
    select: { id: true, nombres: true, apellidos: true, curso: true },
  });

  if (!estudiante) {
    return res.status(404).json({ error: `No existe un estudiante con id ${estudianteId}.` });
  }

  const { tipo, gravedad, desde, hasta } = req.query;

  const fechaFiltro = {};
  if (desde) {
    const d = new Date(desde);
    if (isNaN(d.getTime())) {
      return res.status(400).json({ error: 'El parámetro "desde" no es una fecha válida.' });
    }
    fechaFiltro.gte = d;
  }
  if (hasta) {
    const h = new Date(hasta);
    if (isNaN(h.getTime())) {
      return res.status(400).json({ error: 'El parámetro "hasta" no es una fecha válida.' });
    }
    fechaFiltro.lte = h;
  }

  const involucrados = await prisma.involucrado.findMany({
    where: {
      estudianteId,
      incidente: {
        ...(tipo     ? { tipo }     : {}),
        ...(gravedad ? { gravedad } : {}),
        ...(Object.keys(fechaFiltro).length > 0 ? { fecha: fechaFiltro } : {}),
      },
    },
    include: {
      incidente: {
        select: {
          id:          true,
          fecha:       true,
          descripcion: true,
          tipo:        true,
          gravedad:    true,
          registradoPor: {
            select: { id: true, nombres: true, apellidos: true, cargo: true },
          },
        },
      },
    },
    orderBy: { incidente: { fecha: 'desc' } },
  });

  const historial = involucrados.map((inv) => ({
    rol:        inv.rol,
    observacion: inv.observacion,
    incidente:  inv.incidente,
  }));

  res.status(200).json({
    estudiante,
    totalIncidentes: historial.length,
    incidentes: historial,
  });
});

router.get('/curso/:curso/incidentes', async (req, res) => {
  const curso = decodeURIComponent(req.params.curso)

  const estudiantes = await prisma.estudiante.findMany({
    where: { curso },
    select: { id: true, nombres: true, apellidos: true, curso: true },
  })

  if (estudiantes.length === 0) {
    return res.status(404).json({ error: `No existe ningún estudiante en el curso "${curso}".` })
  }

  const { tipo, gravedad, rolInvolucrado, desde, hasta } = req.query

  const fechaFiltro = {}
  if (desde) {
    const d = new Date(desde)
    if (isNaN(d.getTime())) return res.status(400).json({ error: 'El parámetro "desde" no es una fecha válida.' })
    fechaFiltro.gte = d
  }
  if (hasta) {
    const h = new Date(hasta)
    if (isNaN(h.getTime())) return res.status(400).json({ error: 'El parámetro "hasta" no es una fecha válida.' })
    fechaFiltro.lte = h
  }

  const estudianteIds = estudiantes.map(e => e.id)
  const estudianteMap  = Object.fromEntries(estudiantes.map(e => [e.id, e]))

  const involucrados = await prisma.involucrado.findMany({
    where: {
      estudianteId: { in: estudianteIds },
      ...(rolInvolucrado ? { rol: rolInvolucrado } : {}),
      incidente: {
        ...(tipo     ? { tipo }     : {}),
        ...(gravedad ? { gravedad } : {}),
        ...(Object.keys(fechaFiltro).length > 0 ? { fecha: fechaFiltro } : {}),
      },
    },
    include: {
      incidente: {
        select: {
          id: true,
          fecha: true,
          descripcion: true,
          tipo: true,
          gravedad: true,
          registradoPor: {
            select: { id: true, nombres: true, apellidos: true, cargo: true },
          },
        },
      },
    },
    orderBy: { incidente: { fecha: 'desc' } },
  })

  const incidentes = involucrados.map(inv => ({
    rol:        inv.rol,
    observacion: inv.observacion,
    incidente:  inv.incidente,
    estudiante: estudianteMap[inv.estudianteId],
  }))

  res.status(200).json({
    curso,
    totalEstudiantes: estudiantes.length,
    totalIncidentes:  incidentes.length,
    incidentes,
  })
})

export default router;