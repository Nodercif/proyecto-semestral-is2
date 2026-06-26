/**
 * src/routes/estudiantes.routes.js
 * Rutas relacionadas con estudiantes.
 *
 * GET /estudiantes                   → búsqueda por nombre parcial y/o curso (con paginación)
 * GET /estudiantes/:id/incidentes    → historial de incidentes de un estudiante
 * GET /estudiantes/curso/:curso/incidentes → historial por curso
 * POST /estudiantes                  → crear un nuevo estudiante
 * PUT /estudiantes/:id               → actualizar un estudiante
 * DELETE /estudiantes/:id            → eliminar un estudiante (solo si no tiene incidentes)
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

  const where = {};

  if (nombre && nombre.trim() !== '') {
    where.OR = [
      { nombres:   { contains: nombre.trim(), mode: 'insensitive' } },
      { apellidos: { contains: nombre.trim(), mode: 'insensitive' } },
    ];
  }

  if (curso && curso.trim() !== '') {
    where.curso = { equals: curso.trim(), mode: 'insensitive' };
  }

  try {
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

// ── GET /estudiantes/curso/:curso/incidentes ─────────────────────────────────
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
});

// ── POST /estudiantes ─────────────────────────────────────────────────────────
// Crear un nuevo estudiante
router.post('/', async (req, res) => {
  const { rut, nombres, apellidos, curso } = req.body;

  const errores = [];
  if (!rut || rut.trim() === '') errores.push('RUT es obligatorio.');
  if (!nombres || nombres.trim() === '') errores.push('Nombres son obligatorios.');
  if (!apellidos || apellidos.trim() === '') errores.push('Apellidos son obligatorios.');
  if (!curso || curso.trim() === '') errores.push('Curso es obligatorio.');

  if (errores.length > 0) {
    return res.status(400).json({ errores });
  }

  try {
    // Verificar RUT único
    const existente = await prisma.estudiante.findUnique({
      where: { rut: rut.trim() }
    });
    if (existente) {
      return res.status(409).json({ error: `Ya existe un estudiante con RUT ${rut}.` });
    }

    const nuevo = await prisma.estudiante.create({
      data: {
        rut: rut.trim(),
        nombres: nombres.trim(),
        apellidos: apellidos.trim(),
        curso: curso.trim(),
      },
    });

    return res.status(201).json({ data: nuevo });
  } catch (error) {
    console.error('[POST /estudiantes] Error:', error);
    return res.status(500).json({ error: 'Error al crear el estudiante.' });
  }
});

// ── PUT /estudiantes/:id ──────────────────────────────────────────────────────
// Actualizar un estudiante existente
router.put('/:id', async (req, res) => {
  const id = parseInt(req.params.id, 10);
  if (isNaN(id)) {
    return res.status(400).json({ error: 'ID inválido.' });
  }

  const { rut, nombres, apellidos, curso } = req.body;

  const errores = [];
  if (rut && rut.trim() === '') errores.push('RUT no puede estar vacío.');
  if (nombres && nombres.trim() === '') errores.push('Nombres no pueden estar vacíos.');
  if (apellidos && apellidos.trim() === '') errores.push('Apellidos no pueden estar vacíos.');
  if (curso && curso.trim() === '') errores.push('Curso no puede estar vacío.');

  if (errores.length > 0) {
    return res.status(400).json({ errores });
  }

  try {
    const existente = await prisma.estudiante.findUnique({ where: { id } });
    if (!existente) {
      return res.status(404).json({ error: `Estudiante con id ${id} no encontrado.` });
    }

    // Si se cambia el RUT, verificar que no esté en uso por otro estudiante
    if (rut && rut.trim() !== existente.rut) {
      const duplicado = await prisma.estudiante.findUnique({
        where: { rut: rut.trim() }
      });
      if (duplicado) {
        return res.status(409).json({ error: `El RUT ${rut} ya está registrado por otro estudiante.` });
      }
    }

    const data = {};
    if (rut) data.rut = rut.trim();
    if (nombres) data.nombres = nombres.trim();
    if (apellidos) data.apellidos = apellidos.trim();
    if (curso) data.curso = curso.trim();

    const actualizado = await prisma.estudiante.update({
      where: { id },
      data,
    });

    return res.status(200).json({ data: actualizado });
  } catch (error) {
    console.error('[PUT /estudiantes/:id] Error:', error);
    return res.status(500).json({ error: 'Error al actualizar el estudiante.' });
  }
});

// ── DELETE /estudiantes/:id ───────────────────────────────────────────────────
// Eliminar un estudiante (solo si no tiene incidentes asociados)
router.delete('/:id', async (req, res) => {
  const id = parseInt(req.params.id, 10);
  if (isNaN(id)) {
    return res.status(400).json({ error: 'ID inválido.' });
  }

  try {
    const existente = await prisma.estudiante.findUnique({ where: { id } });
    if (!existente) {
      return res.status(404).json({ error: `Estudiante con id ${id} no encontrado.` });
    }

    // Verificar si tiene involucrados (incidentes asociados)
    const involucrados = await prisma.involucrado.count({
      where: { estudianteId: id }
    });
    if (involucrados > 0) {
      return res.status(409).json({
        error: 'No se puede eliminar el estudiante porque tiene incidentes asociados. Elimine los incidentes primero.'
      });
    }

    await prisma.estudiante.delete({ where: { id } });
    return res.status(204).send();
  } catch (error) {
    console.error('[DELETE /estudiantes/:id] Error:', error);
    return res.status(500).json({ error: 'Error al eliminar el estudiante.' });
  }
});

export default router;