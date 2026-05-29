const express = require('express')
const app = express()

// Middleware para parsear JSON en el body del request
app.use(express.json())

// Rutas
const incidenteRoutes = require('./routes/incidenteRoutes')
app.use('/incidentes', incidenteRoutes)

// Ruta raíz para verificar que el servidor funciona
app.get('/', (req, res) => {
  res.json({ mensaje: 'API Convivencia Escolar activa.' })
})

module.exports = app
