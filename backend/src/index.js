import 'dotenv/config';
import express from 'express';
import prisma from './config/prisma.js';

import authRoutes from './routes/auth.routes.js';
import incidentesRoutes from './routes/incidentes.routes.js';
import involucradosRoutes from './routes/involucrados.routes.js';
import estudiantesRoutes from './routes/estudiantes.routes.js';
import casosRoutes from './routes/casos.routes.js';

const app = express();
const PORT = process.env.PORT || 3000;

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.get('/health', (req, res) => {
  res.json({
    status: 'ok',
    modulo: 'autenticacion',
    timestamp: new Date().toISOString(),
  });
});

app.use('/auth', authRoutes);
app.use('/incidentes', incidentesRoutes);
app.use('/incidentes', involucradosRoutes);
app.use('/estudiantes', estudiantesRoutes);
app.use('/casos', casosRoutes);

app.use((req, res) => {
  res.status(404).json({
    error: 'Not Found',
    message: `Ruta ${req.method} ${req.originalUrl} no existe.`,
  });
});

app.use((err, req, res, next) => {
  console.error('[Error no manejado]', err);

  res.status(500).json({
    error: 'Error interno del servidor',
    message:
      process.env.NODE_ENV === 'development'
        ? err.message
        : 'Ocurrió un error inesperado.',
  });
});

let server;

if (process.env.NODE_ENV !== 'test') {
  server = app.listen(PORT, async () => {
    try {
      await prisma.$connect();
      console.log(`Servidor activo en puerto ${PORT}`);
    } catch (error) {
      console.error(error);
      process.exit(1);
    }
  });
}

const shutdown = async (signal) => {
  console.log(`${signal} recibido`);

  if (server) {
    server.close(async () => {
      await prisma.$disconnect();
      process.exit(0);
    });
  }
};

process.on('SIGTERM', () => shutdown('SIGTERM'));
process.on('SIGINT', () => shutdown('SIGINT'));

export default app;