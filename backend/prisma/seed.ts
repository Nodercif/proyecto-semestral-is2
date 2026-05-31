import bcrypt from 'bcryptjs'
import { PrismaClient, RolSistema, TipoIncidente, NivelGravedad, RolInvolucrado, TipoAccion, EstadoCaso } from '@prisma/client'

const prisma = new PrismaClient()

async function main() {
  console.log('Iniciando seed...')

  // Funcionarios
  const [gabriela, carlos, beatriz, diego, elena, roberto] = await Promise.all([
    prisma.funcionarioInstitucional.upsert({
      where: { rut: '21373300-1' },
      update: {},
      create: { rut: '21373300-1', nombres: 'Gabriela',     apellidos: 'Muñoz Castillo',  cargo: RolSistema.ENCARGADO_CONVIVENCIA },
    }),
    prisma.funcionarioInstitucional.upsert({
      where: { rut: '23456789-0' },
      update: {},
      create: { rut: '23456789-0', nombres: 'Carlos',  apellidos: 'Martínez López',  cargo: RolSistema.DOCENTE },
    }),
    prisma.funcionarioInstitucional.upsert({
      where: { rut: '34567890-1' },
      update: {},
      create: { rut: '34567890-1', nombres: 'Beatriz', apellidos: 'Rojas Fuentes',   cargo: RolSistema.INSPECTOR },
    }),
    prisma.funcionarioInstitucional.upsert({
      where: { rut: '45678901-2' },
      update: {},
      create: { rut: '45678901-2', nombres: 'Diego',   apellidos: 'Herrera Soto',    cargo: RolSistema.ORIENTADOR },
    }),
    prisma.funcionarioInstitucional.upsert({
      where: { rut: '56789012-3' },
      update: {},
      create: { rut: '56789012-3', nombres: 'Elena',   apellidos: 'Castro Vidal',    cargo: RolSistema.EQUIPO_DIRECTIVO },
    }),
    prisma.funcionarioInstitucional.upsert({
      where: { rut: '98765432-1' },
      update: {},
      create: { rut: '98765432-1', nombres: 'Roberto', apellidos: 'Sánchez Mora',    cargo: RolSistema.ADMINISTRADOR },
    }),
  ])
  console.log('Funcionarios creados')

  // Hash de contraseña real (todos usan la misma para pruebas)
  // Contraseña: Admin1234!
  // Usuarios
  const passwordHash = await bcrypt.hash('Admin1234!', 10)

  await Promise.all([
    prisma.usuario.upsert({
      where: { email: 'gabriela.munoz@colegio.cl' },
      update: { passwordHash },
      create: { email: 'gabriela.munoz@colegio.cl', passwordHash, rol: RolSistema.ENCARGADO_CONVIVENCIA, funcionarioId: gabriela.id },
    }),
    prisma.usuario.upsert({
      where: { email: 'carlos.martinez@colegio.cl' },
      update: { passwordHash },
      create: { email: 'carlos.martinez@colegio.cl', passwordHash, rol: RolSistema.DOCENTE, funcionarioId: carlos.id },
    }),
    prisma.usuario.upsert({
      where: { email: 'beatriz.rojas@colegio.cl' },
      update: { passwordHash },
      create: { email: 'beatriz.rojas@colegio.cl', passwordHash, rol: RolSistema.INSPECTOR, funcionarioId: beatriz.id },
    }),
    prisma.usuario.upsert({
      where: { email: 'diego.herrera@colegio.cl' },
      update: { passwordHash },
      create: { email: 'diego.herrera@colegio.cl', passwordHash, rol: RolSistema.ORIENTADOR, funcionarioId: diego.id },
    }),
    prisma.usuario.upsert({
      where: { email: 'elena.castro@colegio.cl' },
      update: { passwordHash },
      create: { email: 'elena.castro@colegio.cl', passwordHash, rol: RolSistema.EQUIPO_DIRECTIVO, funcionarioId: elena.id },
    }),
    prisma.usuario.upsert({
      where: { email: 'admin@colegio.cl' },
      update: { passwordHash },
      create: { email: 'admin@colegio.cl', passwordHash, rol: RolSistema.ADMINISTRADOR, funcionarioId: roberto.id },
    }),
  ])
  console.log('Usuarios creados')

  // Estudiantes
  const [martin, sofia, joaquin, valentina, sebastian, camila] = await Promise.all([
    prisma.estudiante.upsert({ where: { rut: '11111111-1' }, update: {}, create: { rut: '11111111-1', nombres: 'Martín',    apellidos: 'Alvarado Torres',  curso: '1°A' } }),
    prisma.estudiante.upsert({ where: { rut: '22222222-2' }, update: {}, create: { rut: '22222222-2', nombres: 'Sofía',     apellidos: 'Becerra Núñez',    curso: '1°A' } }),
    prisma.estudiante.upsert({ where: { rut: '33333333-3' }, update: {}, create: { rut: '33333333-3', nombres: 'Joaquín',   apellidos: 'Contreras Ríos',   curso: '2°B' } }),
    prisma.estudiante.upsert({ where: { rut: '44444444-4' }, update: {}, create: { rut: '44444444-4', nombres: 'Valentina', apellidos: 'Díaz Morales',     curso: '2°B' } }),
    prisma.estudiante.upsert({ where: { rut: '55555555-5' }, update: {}, create: { rut: '55555555-5', nombres: 'Sebastián', apellidos: 'Espinoza Aguilar', curso: '3°C' } }),
    prisma.estudiante.upsert({ where: { rut: '66666666-6' }, update: {}, create: { rut: '66666666-6', nombres: 'Camila',    apellidos: 'Flores Pizarro',   curso: '3°C' } }),
  ])
  console.log('Estudiantes creados')

  // Incidente 1 
  const incidente1 = await prisma.incidente.create({
    data: {
      fecha:       new Date('2026-04-10T10:30:00'),
      descripcion: 'Pelea entre estudiantes durante el recreo. Martín golpeó a Joaquín sin motivo aparente.',
      tipo:        TipoIncidente.AGRESION_FISICA,
      gravedad:    NivelGravedad.GRAVE,
      registradoPorId: gabriela.id,
      involucrados: {
        create: [
          { rol: RolInvolucrado.RESPONSABLE, estudianteId: martin.id,    observacion: 'Inició la agresión física' },
          { rol: RolInvolucrado.AFECTADO,    estudianteId: joaquin.id,   observacion: 'Recibió el golpe, sin lesiones graves' },
          { rol: RolInvolucrado.TESTIGO,     estudianteId: sofia.id },
          { rol: RolInvolucrado.TESTIGO,     estudianteId: valentina.id },
        ]
      }
    }
  })

  // Caso 1 + acción de intervención
  await prisma.caso.create({
    data: {
      titulo: 'Agresión física en recreo — Martín A. vs Joaquín C.',
      estado: EstadoCaso.EN_SEGUIMIENTO,
      casoIncidentes: { create: { incidenteId: incidente1.id } },
      acciones: {
        create: [
          { tipo: TipoAccion.CITACION,               fecha: new Date('2026-04-10T11:00:00'), descripcion: 'Citación de apoderado de Martín para el 12/04 a las 14:00' },
          { tipo: TipoAccion.DERIVACION_ORIENTACION, fecha: new Date('2026-04-10T11:30:00'), descripcion: 'Derivación de Joaquín al orientador' },
        ]
      }
    }
  })
  console.log('Incidente 1 + Caso 1 creados')

  // Incidente 2 (reincidencia de Martín, para probar RF16)
  const incidente2 = await prisma.incidente.create({
    data: {
      fecha:       new Date('2026-04-22T08:15:00'),
      descripcion: 'Martín insultó a compañero en sala de clases durante matemáticas.',
      tipo:        TipoIncidente.AGRESION_VERBAL,
      gravedad:    NivelGravedad.MODERADO,
      registradoPorId: carlos.id,
      involucrados: {
        create: [
          { rol: RolInvolucrado.RESPONSABLE, estudianteId: martin.id,    observacion: 'Reincidencia: segundo incidente registrado' },
          { rol: RolInvolucrado.AFECTADO,    estudianteId: sebastian.id, observacion: 'Insultos reiterados' },
          { rol: RolInvolucrado.TESTIGO,     estudianteId: camila.id },
        ]
      }
    }
  })

  await prisma.caso.create({
    data: {
      titulo: 'Agresión verbal en aula — Martín A. (reincidencia)',
      estado: EstadoCaso.ABIERTO,
      casoIncidentes: { create: { incidenteId: incidente2.id } },
    }
  })
  console.log('Incidente 2 + Caso 2 creados (reincidencia)')

  console.log('\nSeed completado exitosamente')
}

main()
  .catch((e) => { console.error('Error en seed:', e); process.exit(1) })
  .finally(async () => { await prisma.$disconnect() })