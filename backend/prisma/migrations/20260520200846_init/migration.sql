-- CreateEnum
CREATE TYPE "TipoIncidente" AS ENUM ('CONFLICTO', 'AGRESION_FISICA', 'AGRESION_VERBAL', 'ACOSO', 'DANO_MATERIAL');

-- CreateEnum
CREATE TYPE "NivelGravedad" AS ENUM ('LEVE', 'MODERADO', 'GRAVE', 'MUY_GRAVE');

-- CreateEnum
CREATE TYPE "EstadoCaso" AS ENUM ('ABIERTO', 'EN_SEGUIMIENTO', 'RESUELTO', 'CERRADO', 'DERIVADO');

-- CreateEnum
CREATE TYPE "RolSistema" AS ENUM ('ADMINISTRADOR', 'ENCARGADO_CONVIVENCIA', 'DOCENTE', 'INSPECTOR', 'ORIENTADOR', 'EQUIPO_DIRECTIVO');

-- CreateEnum
CREATE TYPE "RolInvolucrado" AS ENUM ('AFECTADO', 'RESPONSABLE', 'TESTIGO', 'INTERVINIENTE');

-- CreateEnum
CREATE TYPE "TipoAccion" AS ENUM ('CITACION', 'DERIVACION_ORIENTACION', 'ENTREVISTA', 'DERIVACION_PSICOLOGO');

-- CreateTable
CREATE TABLE "Estudiante" (
    "id" SERIAL NOT NULL,
    "rut" TEXT NOT NULL,
    "nombres" TEXT NOT NULL,
    "apellidos" TEXT NOT NULL,
    "curso" TEXT NOT NULL,
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
    "cargo" "RolSistema" NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "FuncionarioInstitucional_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Usuario" (
    "id" SERIAL NOT NULL,
    "email" TEXT NOT NULL,
    "passwordHash" TEXT NOT NULL,
    "rol" "RolSistema" NOT NULL,
    "activo" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "funcionarioId" INTEGER NOT NULL,

    CONSTRAINT "Usuario_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Incidente" (
    "id" SERIAL NOT NULL,
    "fecha" TIMESTAMP(3) NOT NULL,
    "descripcion" TEXT NOT NULL,
    "tipo" "TipoIncidente" NOT NULL,
    "gravedad" "NivelGravedad" NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "registradoPorId" INTEGER NOT NULL,

    CONSTRAINT "Incidente_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Involucrado" (
    "id" SERIAL NOT NULL,
    "rol" "RolInvolucrado" NOT NULL,
    "observacion" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "estudianteId" INTEGER NOT NULL,
    "incidenteId" INTEGER NOT NULL,
    "funcionarioIntervinienteId" INTEGER,

    CONSTRAINT "Involucrado_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Caso" (
    "id" SERIAL NOT NULL,
    "titulo" TEXT NOT NULL,
    "estado" "EstadoCaso" NOT NULL DEFAULT 'ABIERTO',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Caso_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "CasoIncidente" (
    "casoId" INTEGER NOT NULL,
    "incidenteId" INTEGER NOT NULL,
    "asignadoEn" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "CasoIncidente_pkey" PRIMARY KEY ("casoId","incidenteId")
);

-- CreateTable
CREATE TABLE "AccionIntervencion" (
    "id" SERIAL NOT NULL,
    "tipo" "TipoAccion" NOT NULL,
    "descripcion" TEXT,
    "fecha" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "casoId" INTEGER NOT NULL,

    CONSTRAINT "AccionIntervencion_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Estudiante_rut_key" ON "Estudiante"("rut");

-- CreateIndex
CREATE UNIQUE INDEX "FuncionarioInstitucional_rut_key" ON "FuncionarioInstitucional"("rut");

-- CreateIndex
CREATE UNIQUE INDEX "Usuario_email_key" ON "Usuario"("email");

-- CreateIndex
CREATE UNIQUE INDEX "Usuario_funcionarioId_key" ON "Usuario"("funcionarioId");

-- CreateIndex
CREATE UNIQUE INDEX "Involucrado_estudianteId_incidenteId_rol_key" ON "Involucrado"("estudianteId", "incidenteId", "rol");

-- AddForeignKey
ALTER TABLE "Usuario" ADD CONSTRAINT "Usuario_funcionarioId_fkey" FOREIGN KEY ("funcionarioId") REFERENCES "FuncionarioInstitucional"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Incidente" ADD CONSTRAINT "Incidente_registradoPorId_fkey" FOREIGN KEY ("registradoPorId") REFERENCES "FuncionarioInstitucional"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Involucrado" ADD CONSTRAINT "Involucrado_estudianteId_fkey" FOREIGN KEY ("estudianteId") REFERENCES "Estudiante"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Involucrado" ADD CONSTRAINT "Involucrado_incidenteId_fkey" FOREIGN KEY ("incidenteId") REFERENCES "Incidente"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Involucrado" ADD CONSTRAINT "Involucrado_funcionarioIntervinienteId_fkey" FOREIGN KEY ("funcionarioIntervinienteId") REFERENCES "FuncionarioInstitucional"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CasoIncidente" ADD CONSTRAINT "CasoIncidente_casoId_fkey" FOREIGN KEY ("casoId") REFERENCES "Caso"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CasoIncidente" ADD CONSTRAINT "CasoIncidente_incidenteId_fkey" FOREIGN KEY ("incidenteId") REFERENCES "Incidente"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AccionIntervencion" ADD CONSTRAINT "AccionIntervencion_casoId_fkey" FOREIGN KEY ("casoId") REFERENCES "Caso"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
