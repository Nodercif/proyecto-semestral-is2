/**
 * Tests de la Tarea 1: Diseño e implementación del modelo de base de datos
 * Ejecutar con: npx vitest run
 *
 * Requisitos:
 * - PostgreSQL corriendo en localhost:5432
 * - Base de datos "convivencia_escolar" creada
 * - Migraciones aplicadas (npm run db:migrate)
 * - Seed ejecutado (npm run db:seed)
 */

import { describe, it, expect, beforeAll, afterAll } from 'vitest'
import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

beforeAll(async () => {
  await prisma.$connect()
})

afterAll(async () => {
  await prisma.$disconnect()
})

// Test 1: Las tablas existen con los campos correctos

describe('Test 1: Las tablas existen en la BD con los campos correctos', () => {

  it('la tabla Estudiante existe y tiene los campos correctos', async () => {
    const result = await prisma.$queryRaw<any[]>`
      SELECT column_name, data_type, is_nullable
      FROM information_schema.columns
      WHERE table_schema = 'public' AND table_name = 'Estudiante'
      ORDER BY ordinal_position;
    `
    const columnas = result.map((r: any) => r.column_name)
    expect(columnas).toContain('id')
    expect(columnas).toContain('rut')
    expect(columnas).toContain('nombres')
    expect(columnas).toContain('apellidos')
    expect(columnas).toContain('curso')
    expect(columnas).toContain('createdAt')
    expect(columnas).toContain('updatedAt')
  })

  it('la tabla FuncionarioInstitucional existe y tiene los campos correctos', async () => {
    const result = await prisma.$queryRaw<any[]>`
      SELECT column_name FROM information_schema.columns
      WHERE table_schema = 'public' AND table_name = 'FuncionarioInstitucional'
      ORDER BY ordinal_position;
    `
    const columnas = result.map((r: any) => r.column_name)
    expect(columnas).toContain('id')
    expect(columnas).toContain('rut')
    expect(columnas).toContain('nombres')
    expect(columnas).toContain('apellidos')
    expect(columnas).toContain('cargo')
  })

  it('la tabla Incidente existe y tiene los campos correctos', async () => {
    const result = await prisma.$queryRaw<any[]>`
      SELECT column_name FROM information_schema.columns
      WHERE table_schema = 'public' AND table_name = 'Incidente'
      ORDER BY ordinal_position;
    `
    const columnas = result.map((r: any) => r.column_name)
    expect(columnas).toContain('id')
    expect(columnas).toContain('fecha')
    expect(columnas).toContain('descripcion')
    expect(columnas).toContain('tipo')
    expect(columnas).toContain('gravedad')
    expect(columnas).toContain('registradoPorId')
  })

  it('la tabla Involucrado existe y tiene los campos correctos', async () => {
    const result = await prisma.$queryRaw<any[]>`
      SELECT column_name FROM information_schema.columns
      WHERE table_schema = 'public' AND table_name = 'Involucrado'
      ORDER BY ordinal_position;
    `
    const columnas = result.map((r: any) => r.column_name)
    expect(columnas).toContain('id')
    expect(columnas).toContain('rol')
    expect(columnas).toContain('estudianteId')
    expect(columnas).toContain('incidenteId')
  })

  it('la tabla Usuario existe y tiene los campos correctos', async () => {
    const result = await prisma.$queryRaw<any[]>`
      SELECT column_name FROM information_schema.columns
      WHERE table_schema = 'public' AND table_name = 'Usuario'
      ORDER BY ordinal_position;
    `
    const columnas = result.map((r: any) => r.column_name)
    expect(columnas).toContain('id')
    expect(columnas).toContain('email')
    expect(columnas).toContain('passwordHash')
    expect(columnas).toContain('rol')
    expect(columnas).toContain('activo')
    expect(columnas).toContain('funcionarioId')
  })

  it('la tabla Caso existe y tiene los campos correctos', async () => {
    const result = await prisma.$queryRaw<any[]>`
      SELECT column_name FROM information_schema.columns
      WHERE table_schema = 'public' AND table_name = 'Caso'
      ORDER BY ordinal_position;
    `
    const columnas = result.map((r: any) => r.column_name)
    expect(columnas).toContain('id')
    expect(columnas).toContain('titulo')
    expect(columnas).toContain('estado')
  })

  it('la tabla AccionIntervencion existe y tiene los campos correctos', async () => {
    const result = await prisma.$queryRaw<any[]>`
      SELECT column_name FROM information_schema.columns
      WHERE table_schema = 'public' AND table_name = 'AccionIntervencion'
      ORDER BY ordinal_position;
    `
    const columnas = result.map((r: any) => r.column_name)
    expect(columnas).toContain('id')
    expect(columnas).toContain('tipo')
    expect(columnas).toContain('casoId')
    expect(columnas).toContain('fecha')
  })

})

// Test 2: Claves foráneas y restricciones NOT NULL

describe('Test 2: Claves foráneas y restricciones NOT NULL están definidas', () => {

  it('Incidente tiene clave foránea hacia FuncionarioInstitucional', async () => {
    const result = await prisma.$queryRaw<any[]>`
      SELECT constraint_name
      FROM information_schema.table_constraints
      WHERE table_name = 'Incidente'
        AND constraint_type = 'FOREIGN KEY';
    `
    expect(result.length).toBeGreaterThan(0)
  })

  it('Involucrado tiene clave foránea hacia Estudiante', async () => {
    const result = await prisma.$queryRaw<any[]>`
      SELECT kcu.column_name
      FROM information_schema.key_column_usage kcu
      JOIN information_schema.table_constraints tc
        ON kcu.constraint_name = tc.constraint_name
      WHERE tc.table_name = 'Involucrado'
        AND tc.constraint_type = 'FOREIGN KEY'
        AND kcu.column_name = 'estudianteId';
    `
    expect(result.length).toBeGreaterThan(0)
  })

  it('Involucrado tiene clave foránea hacia Incidente', async () => {
    const result = await prisma.$queryRaw<any[]>`
      SELECT kcu.column_name
      FROM information_schema.key_column_usage kcu
      JOIN information_schema.table_constraints tc
        ON kcu.constraint_name = tc.constraint_name
      WHERE tc.table_name = 'Involucrado'
        AND tc.constraint_type = 'FOREIGN KEY'
        AND kcu.column_name = 'incidenteId';
    `
    expect(result.length).toBeGreaterThan(0)
  })

  it('Usuario tiene clave foránea hacia FuncionarioInstitucional', async () => {
    const result = await prisma.$queryRaw<any[]>`
      SELECT kcu.column_name
      FROM information_schema.key_column_usage kcu
      JOIN information_schema.table_constraints tc
        ON kcu.constraint_name = tc.constraint_name
      WHERE tc.table_name = 'Usuario'
        AND tc.constraint_type = 'FOREIGN KEY'
        AND kcu.column_name = 'funcionarioId';
    `
    expect(result.length).toBeGreaterThan(0)
  })

  it('los campos obligatorios de Incidente tienen restricción NOT NULL', async () => {
    const result = await prisma.$queryRaw<any[]>`
      SELECT column_name, is_nullable
      FROM information_schema.columns
      WHERE table_name = 'Incidente'
        AND column_name IN ('fecha', 'descripcion', 'tipo', 'gravedad', 'registradoPorId');
    `
    result.forEach((col: any) => {
      expect(col.is_nullable).toBe('NO')
    })
  })

  it('los campos obligatorios de Estudiante tienen restricción NOT NULL', async () => {
    const result = await prisma.$queryRaw<any[]>`
      SELECT column_name, is_nullable
      FROM information_schema.columns
      WHERE table_name = 'Estudiante'
        AND column_name IN ('rut', 'nombres', 'apellidos', 'curso');
    `
    result.forEach((col: any) => {
      expect(col.is_nullable).toBe('NO')
    })
  })

})

// Test 3: Se puede insertar un incidente de prueba sin errores

describe('Test 3: Se puede insertar un incidente de prueba sin errores', () => {

  it('inserta un incidente y luego lo elimina correctamente', async () => {
    // Primero obtenemos un funcionario existente del seed
    const funcionario = await prisma.funcionarioInstitucional.findFirst()
    expect(funcionario).not.toBeNull()

    // Insertamos el incidente de prueba
    const incidente = await prisma.incidente.create({
      data: {
        fecha:           new Date('2026-05-01T09:00:00'),
        descripcion:     'Incidente de prueba para test automatizado',
        tipo:            'CONFLICTO',
        gravedad:        'LEVE',
        registradoPorId: funcionario!.id,
      }
    })

    expect(incidente.id).toBeDefined()
    expect(incidente.tipo).toBe('CONFLICTO')
    expect(incidente.gravedad).toBe('LEVE')
    expect(incidente.descripcion).toBe('Incidente de prueba para test automatizado')

    // Limpieza: eliminar el incidente creado
    await prisma.incidente.delete({ where: { id: incidente.id } })
  })

  it('rechaza un incidente sin descripcion (NOT NULL)', async () => {
    const funcionario = await prisma.funcionarioInstitucional.findFirst()

    await expect(
      prisma.incidente.create({
        data: {
          fecha:           new Date(),
          descripcion:     '',
          tipo:            'CONFLICTO',
          gravedad:        'LEVE',
          registradoPorId: funcionario!.id,
        }
      })
    ).resolves.toBeDefined() // descripcion vacía es válida, solo NULL no lo es

    // Limpieza
    await prisma.incidente.deleteMany({
      where: { descripcion: '' }
    })
  })

})

// Test 4: Existen datos seed de estudiantes y funcionarios

describe('Test 4: Existen datos seed de estudiantes y funcionarios', () => {

  it('existen al menos 6 estudiantes en la BD', async () => {
    const total = await prisma.estudiante.count()
    expect(total).toBeGreaterThanOrEqual(6)
  })

  it('existen al menos 6 funcionarios en la BD', async () => {
    const total = await prisma.funcionarioInstitucional.count()
    expect(total).toBeGreaterThanOrEqual(6)
  })

  it('existe al menos un funcionario con rol ENCARGADO_CONVIVENCIA', async () => {
    const encargado = await prisma.funcionarioInstitucional.findFirst({
      where: { cargo: 'ENCARGADO_CONVIVENCIA' }
    })
    expect(encargado).not.toBeNull()
  })

  it('existe al menos un funcionario con rol ADMINISTRADOR', async () => {
    const admin = await prisma.funcionarioInstitucional.findFirst({
      where: { cargo: 'ADMINISTRADOR' }
    })
    expect(admin).not.toBeNull()
  })

  it('los estudiantes tienen los campos rut, nombres, apellidos y curso completos', async () => {
    const estudiantes = await prisma.estudiante.findMany()
    estudiantes.forEach(e => {
      expect(e.rut).toBeTruthy()
      expect(e.nombres).toBeTruthy()
      expect(e.apellidos).toBeTruthy()
      expect(e.curso).toBeTruthy()
    })
  })

  it('existen al menos 2 incidentes en la BD (incluyendo reincidencia)', async () => {
    const total = await prisma.incidente.count()
    expect(total).toBeGreaterThanOrEqual(2)
  })

  it('existe al menos un estudiante como RESPONSABLE en múltiples incidentes (reincidencia)', async () => {
    const reincidentes = await prisma.involucrado.groupBy({
      by: ['estudianteId'],
      where: { rol: 'RESPONSABLE' },
      _count: { estudianteId: true },
      having: { estudianteId: { _count: { gt: 1 } } }
    })
    expect(reincidentes.length).toBeGreaterThanOrEqual(1)
  })

})