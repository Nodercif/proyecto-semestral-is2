-- CreateEnum
CREATE TYPE "TipoIncidente" AS ENUM ('AGRESION_FISICA', 'AGRESION_VERBAL', 'BULLYING', 'CIBERBULLYING', 'DANO_MATERIAL', 'CONDUCTA_DISRUPTIVA', 'OTRO');

-- CreateEnum
CREATE TYPE "NivelGravedad" AS ENUM ('LEVE', 'MODERADO', 'GRAVE', 'MUY_GRAVE');

-- CreateEnum
CREATE TYPE "EstadoIncidente" AS ENUM ('ABIERTO', 'EN_PROCESO', 'RESUELTO', 'CERRADO');

-- CreateEnum
CREATE TYPE "RolInvolucrado" AS ENUM ('AGRESOR', 'VICTIMA', 'TESTIGO');

-- CreateEnum
CREATE TYPE "Genero" AS ENUM ('MASCULINO', 'FEMENINO', 'OTRO', 'PREFIERE_NO_INDICAR');

-- CreateTable
CREATE TABLE "Estudiante" (
    "id" SERIAL NOT NULL,
    "rut" TEXT NOT NULL,
    "nombres" TEXT NOT NULL,
    "apellidos" TEXT NOT NULL,
    "fechaNacimiento" TIMESTAMP(3) NOT NULL,
    "genero" "Genero" NOT NULL,
    "curso" TEXT NOT NULL,
    "nivel" TEXT NOT NULL,
    "anioIngreso" INTEGER NOT NULL,
    "activo" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Estudiante_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "FuncionarioInstitucional" (
    "id" SERIAL NOT NULL,
    "rut" TEXT NOT NULL,
    "nombres" TEXT NOT NULL,
    "apellidos" TEXT NOT NULL,
    "cargo" TEXT NOT NULL,
    "correo" TEXT NOT NULL,
    "telefono" TEXT,
    "activo" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "FuncionarioInstitucional_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Incidente" (
    "id" SERIAL NOT NULL,
    "tipo" "TipoIncidente" NOT NULL,
    "gravedad" "NivelGravedad" NOT NULL,
    "estado" "EstadoIncidente" NOT NULL DEFAULT 'ABIERTO',
    "descripcion" TEXT NOT NULL,
    "lugar" TEXT NOT NULL,
    "fechaOcurrencia" TIMESTAMP(3) NOT NULL,
    "accioesTomadas" TEXT,
    "observaciones" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "reportadoPorId" INTEGER NOT NULL,
    "atendidoPorId" INTEGER,

    CONSTRAINT "Incidente_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Involucrado" (
    "id" SERIAL NOT NULL,
    "rol" "RolInvolucrado" NOT NULL,
    "descripcion" TEXT,
    "incidenteId" INTEGER NOT NULL,
    "estudianteId" INTEGER NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Involucrado_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Estudiante_rut_key" ON "Estudiante"("rut");

-- CreateIndex
CREATE UNIQUE INDEX "FuncionarioInstitucional_rut_key" ON "FuncionarioInstitucional"("rut");

-- CreateIndex
CREATE UNIQUE INDEX "FuncionarioInstitucional_correo_key" ON "FuncionarioInstitucional"("correo");

-- CreateIndex
CREATE UNIQUE INDEX "Involucrado_incidenteId_estudianteId_key" ON "Involucrado"("incidenteId", "estudianteId");

-- AddForeignKey
ALTER TABLE "Incidente" ADD CONSTRAINT "Incidente_reportadoPorId_fkey" FOREIGN KEY ("reportadoPorId") REFERENCES "FuncionarioInstitucional"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Incidente" ADD CONSTRAINT "Incidente_atendidoPorId_fkey" FOREIGN KEY ("atendidoPorId") REFERENCES "FuncionarioInstitucional"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Involucrado" ADD CONSTRAINT "Involucrado_incidenteId_fkey" FOREIGN KEY ("incidenteId") REFERENCES "Incidente"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Involucrado" ADD CONSTRAINT "Involucrado_estudianteId_fkey" FOREIGN KEY ("estudianteId") REFERENCES "Estudiante"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
