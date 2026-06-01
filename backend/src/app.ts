import express from 'express'
import incidentesRouter from './routes/incidentes'
import estudiantesRouter from './routes/estudiantes'
import authRouter from './routes/auth.routes.js'
import incidentesRoutesRouter from './routes/incidentes.routes.js'

const app = express()
app.use(express.json())

app.use('/incidentes', incidentesRoutesRouter)
app.use('/incidentes', incidentesRouter)
app.use('/estudiantes', estudiantesRouter)
app.use('/auth', authRouter)

app.get('/health', (_req, res) => {
  res.json({ status: 'ok' })
})

export default app