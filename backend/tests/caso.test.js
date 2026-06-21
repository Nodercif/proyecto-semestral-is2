jest.mock('../src/prismaClient', () => ({
  caso: {
    create:     jest.fn(),
    findUnique: jest.fn(),
    findMany:   jest.fn(),
  },
  incidente: {
    findUnique: jest.fn(),
  },
  casoIncidente: {
    create: jest.fn(),
  },
}))

const request = require('supertest')
const app     = require('../src/app')
const prisma  = require('../src/prismaClient')

const incidenteMock = {
  id:              1,
  tipo:            'ACOSO',
  gravedad:        'MODERADO',
  descripcion:     'Incidente de prueba',
  fecha:           new Date('2024-05-10T10:30:00.000Z'),
  registradoPorId: 10,
  registradoPor:   { id: 10, nombres: 'María', apellidos: 'Torres', cargo: 'INSPECTOR' },
  involucrados:    [],
}

const casoBase = {
  id:             1,
  titulo:         'Caso de prueba',
  estado:         'ABIERTO',
  createdAt:      new Date(),
  updatedAt:      new Date(),
  acciones:       [],
  casoIncidentes: [],
}

const casoConIncidente = {
  ...casoBase,
  casoIncidentes: [
    {
      casoId:      1,
      incidenteId: 1,
      asignadoEn:  new Date(),
      incidente:   incidenteMock,
    },
  ],
}

beforeEach(() => jest.clearAllMocks())

// =============================================================================
// POST /casos
// =============================================================================

describe('POST /casos', () => {

  describe('Datos válidos', () => {
    it('debe retornar 201 y el caso creado con estado ABIERTO', async () => {
      prisma.caso.create.mockResolvedValue(casoBase)

      const res = await request(app)
        .post('/casos')
        .send({ titulo: 'Caso de prueba' })

      expect(res.status).toBe(201)
      expect(res.body.data).toBeDefined()
      expect(res.body.data.id).toBe(1)
      expect(res.body.data.estado).toBe('ABIERTO')
      expect(res.body.data.titulo).toBe('Caso de prueba')
      expect(prisma.caso.create).toHaveBeenCalledTimes(1)
    })

    it('debe llamar a prisma.caso.create con estado ABIERTO forzado por el servicio', async () => {
      prisma.caso.create.mockResolvedValue(casoBase)

      await request(app)
        .post('/casos')
        .send({ titulo: 'Cualquier título' })

      const argData = prisma.caso.create.mock.calls[0][0].data
      expect(argData.estado).toBe('ABIERTO')
    })

    it('debe recortar espacios del título', async () => {
      prisma.caso.create.mockResolvedValue({ ...casoBase, titulo: 'Caso limpio' })

      const res = await request(app)
        .post('/casos')
        .send({ titulo: '   Caso limpio   ' })

      expect(res.status).toBe(201)
      const argData = prisma.caso.create.mock.calls[0][0].data
      expect(argData.titulo).toBe('Caso limpio')
    })
  })

  describe('Validaciones — campo título', () => {
    it('debe retornar 400 si falta el campo "titulo"', async () => {
      const res = await request(app)
        .post('/casos')
        .send({})

      expect(res.status).toBe(400)
      expect(res.body.errores).toContain('El campo "titulo" es obligatorio.')
      expect(prisma.caso.create).not.toHaveBeenCalled()
    })

    it('debe retornar 400 si el título es una cadena vacía', async () => {
      const res = await request(app)
        .post('/casos')
        .send({ titulo: '' })

      expect(res.status).toBe(400)
      expect(res.body.errores).toContain('El campo "titulo" es obligatorio.')
    })

    it('debe retornar 400 si el título solo tiene espacios en blanco', async () => {
      const res = await request(app)
        .post('/casos')
        .send({ titulo: '   ' })

      expect(res.status).toBe(400)
      expect(res.body.errores).toContain('El campo "titulo" es obligatorio.')
    })
  })

  describe('Error interno del servidor', () => {
    it('debe retornar 500 si prisma.caso.create lanza una excepción inesperada', async () => {
      prisma.caso.create.mockRejectedValue(new Error('DB connection lost'))

      const res = await request(app)
        .post('/casos')
        .send({ titulo: 'Caso válido' })

      expect(res.status).toBe(500)
    })
  })
})

// =============================================================================
// POST /casos/:id/incidentes
// =============================================================================

describe('POST /casos/:id/incidentes', () => {

  describe('Asociación exitosa', () => {
    it('debe retornar 200 y el caso actualizado al asociar un incidente existente', async () => {
      prisma.caso.findUnique
        .mockResolvedValueOnce({ ...casoBase, casoIncidentes: [] })
        .mockResolvedValueOnce(casoConIncidente)

      prisma.incidente.findUnique.mockResolvedValue(incidenteMock)
      prisma.casoIncidente.create.mockResolvedValue({})

      const res = await request(app)
        .post('/casos/1/incidentes')
        .send({ incidenteId: 1 })

      expect(res.status).toBe(200)
      expect(res.body.data).toBeDefined()
      expect(res.body.data.casoIncidentes).toHaveLength(1)
      expect(prisma.casoIncidente.create).toHaveBeenCalledTimes(1)
    })

    it('debe llamar a casoIncidente.create con los ids correctos', async () => {
      prisma.caso.findUnique
        .mockResolvedValueOnce({ ...casoBase, casoIncidentes: [] })
        .mockResolvedValueOnce(casoConIncidente)

      prisma.incidente.findUnique.mockResolvedValue(incidenteMock)
      prisma.casoIncidente.create.mockResolvedValue({})

      await request(app)
        .post('/casos/1/incidentes')
        .send({ incidenteId: 1 })

      expect(prisma.casoIncidente.create).toHaveBeenCalledWith({
        data: { casoId: 1, incidenteId: 1 },
      })
    })
  })

  describe('Recursos no encontrados', () => {
    it('debe retornar 404 si el caso no existe', async () => {
      prisma.caso.findUnique.mockResolvedValue(null)

      const res = await request(app)
        .post('/casos/999/incidentes')
        .send({ incidenteId: 1 })

      expect(res.status).toBe(404)
      expect(prisma.casoIncidente.create).not.toHaveBeenCalled()
    })

    it('debe retornar 404 si el incidente no existe', async () => {
      prisma.caso.findUnique.mockResolvedValueOnce({ ...casoBase, casoIncidentes: [] })
      prisma.incidente.findUnique.mockResolvedValue(null)

      const res = await request(app)
        .post('/casos/1/incidentes')
        .send({ incidenteId: 999 })

      expect(res.status).toBe(404)
      expect(prisma.casoIncidente.create).not.toHaveBeenCalled()
    })
  })

  describe('Conflicto — incidente ya asociado', () => {
    it('no se puede asociar el mismo incidente dos veces al mismo caso (409 Conflict)', async () => {
      const casoYaAsociado = {
        ...casoBase,
        casoIncidentes: [{ casoId: 1, incidenteId: 1 }],
      }
      prisma.caso.findUnique.mockResolvedValue(casoYaAsociado)
      prisma.incidente.findUnique.mockResolvedValue(incidenteMock)

      const res = await request(app)
        .post('/casos/1/incidentes')
        .send({ incidenteId: 1 })

      expect(res.status).toBe(409)
      expect(prisma.casoIncidente.create).not.toHaveBeenCalled()
    })
  })

  describe('Validaciones de entrada', () => {
    it('debe retornar 404 si incidenteId no corresponde a un incidente existente', async () => {
      prisma.caso.findUnique.mockResolvedValueOnce({ ...casoBase, casoIncidentes: [] })
      prisma.incidente.findUnique.mockResolvedValue(null)

      const res = await request(app)
        .post('/casos/1/incidentes')
        .send({ incidenteId: 9999 })

      expect(res.status).toBe(404)
      expect(prisma.casoIncidente.create).not.toHaveBeenCalled()
    })
  })
})

// =============================================================================
// GET /casos/:id
// =============================================================================

describe('GET /casos/:id', () => {

  describe('Caso encontrado', () => {
    it('debe retornar 200 con el caso y sus incidentes asociados', async () => {
      prisma.caso.findUnique.mockResolvedValue(casoConIncidente)

      const res = await request(app).get('/casos/1')

      expect(res.status).toBe(200)
      expect(res.body.data).toBeDefined()
      expect(res.body.data.id).toBe(1)
      expect(res.body.data.estado).toBe('ABIERTO')
      expect(res.body.data.casoIncidentes).toHaveLength(1)
    })

    it('debe incluir la información del incidente anidada en casoIncidentes', async () => {
      prisma.caso.findUnique.mockResolvedValue(casoConIncidente)

      const res = await request(app).get('/casos/1')

      const incidente = res.body.data.casoIncidentes[0].incidente
      expect(incidente).toBeDefined()
      expect(incidente.id).toBe(1)
      expect(incidente.tipo).toBe('ACOSO')
    })
  })

  describe('Caso no encontrado', () => {
    it('debe retornar 404 cuando el caso no existe', async () => {
      prisma.caso.findUnique.mockResolvedValue(null)

      const res = await request(app).get('/casos/999')

      expect(res.status).toBe(404)
    })
  })

  describe('Error interno', () => {
    it('debe retornar 500 si prisma lanza una excepción inesperada', async () => {
      prisma.caso.findUnique.mockRejectedValue(new Error('Timeout'))

      const res = await request(app).get('/casos/1')

      expect(res.status).toBe(500)
    })
  })
})

// =============================================================================
// GET /casos
// =============================================================================

describe('GET /casos', () => {

  it('debe retornar 200 con la lista de todos los casos', async () => {
    prisma.caso.findMany.mockResolvedValue([casoBase])

    const res = await request(app).get('/casos')

    expect(res.status).toBe(200)
    expect(res.body.data).toBeDefined()
    expect(Array.isArray(res.body.data)).toBe(true)
    expect(res.body.data).toHaveLength(1)
  })

  it('debe retornar una lista vacía [] cuando no hay casos registrados', async () => {
    prisma.caso.findMany.mockResolvedValue([])

    const res = await request(app).get('/casos')

    expect(res.status).toBe(200)
    expect(res.body.data).toEqual([])
  })

  it('debe retornar los casos ordenados por createdAt descendente', async () => {
    const caso1 = { ...casoBase, id: 1, createdAt: new Date('2024-01-01') }
    const caso2 = { ...casoBase, id: 2, createdAt: new Date('2024-06-01') }
    prisma.caso.findMany.mockResolvedValue([caso2, caso1])

    const res = await request(app).get('/casos')

    expect(res.status).toBe(200)
    expect(res.body.data[0].id).toBe(2)
  })

  it('debe retornar 500 si prisma falla al listar', async () => {
    prisma.caso.findMany.mockRejectedValue(new Error('DB error'))

    const res = await request(app).get('/casos')

    expect(res.status).toBe(500)
  })
})