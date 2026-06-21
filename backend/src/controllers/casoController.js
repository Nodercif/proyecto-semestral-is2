import casoService from '../services/casoService.js';

async function crearCaso(req, res) {
  try {
    const caso = await casoService.crearCaso(req.body);

    return res.status(201).json({
      mensaje: 'Caso creado exitosamente.',
      data: caso,
    });
  } catch (error) {
    if (error.tipo === 'VALIDACION') {
      return res.status(400).json({
        mensaje: 'Error de validación.',
        errores: error.errores,
      });
    }

    console.error('Error al crear caso:', error);
    return res.status(500).json({
      mensaje: 'Error interno del servidor.',
    });
  }
}

async function asociarIncidente(req, res) {
  try {
    const { id } = req.params;
    const { incidenteId } = req.body;

    const caso = await casoService.asociarIncidenteAlCaso(id, incidenteId);

    return res.status(200).json({
      mensaje: 'Incidente asociado al caso exitosamente.',
      data: caso,
    });
  } catch (error) {
    if (error.tipo === 'VALIDACION') {
      return res.status(400).json({
        mensaje: 'Error de validación.',
        errores: error.errores,
      });
    }

    if (error.tipo === 'CONFLICTO') {
      return res.status(409).json({
        mensaje: error.mensaje,
      });
    }

    if (error.tipo === 'NO_ENCONTRADO') {
      return res.status(404).json({
        mensaje: error.mensaje,
      });
    }

    console.error('Error al asociar incidente:', error);
    return res.status(500).json({
      mensaje: 'Error interno del servidor.',
    });
  }
}

async function obtenerCaso(req, res) {
  try {
    const { id } = req.params;

    const caso = await casoService.obtenerCaso(id);

    return res.status(200).json({
      data: caso,
    });
  } catch (error) {
    if (error.tipo === 'NO_ENCONTRADO') {
      return res.status(404).json({
        mensaje: error.mensaje,
      });
    }

    console.error('Error al obtener caso:', error);
    return res.status(500).json({
      mensaje: 'Error interno del servidor.',
    });
  }
}

async function listarCasos(req, res) {
  try {
    const casos = await casoService.listarCasos();

    return res.status(200).json({
      data: casos,
    });
  } catch (error) {
    console.error('Error al listar casos:', error);
    return res.status(500).json({
      mensaje: 'Error interno del servidor.',
    });
  }
}

export default { crearCaso, asociarIncidente, obtenerCaso, listarCasos };