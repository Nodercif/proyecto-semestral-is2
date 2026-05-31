/*
  Warnings:

  - The values [AGRESOR,VICTIMA] on the enum `RolInvolucrado` will be removed. If these variants are still used in the database, this will fail.
  - The values [BULLYING,CIBERBULLYING,CONDUCTA_DISRUPTIVA,OTRO] on the enum `TipoIncidente` will be removed. If these variants are still used in the database, this will fail.
  - You are about to drop the column `activo` on the `Estudiante` table. All the data in the column will be lost.
  - You are about to drop the column `anioIngreso` on the `Estudiante` table. All the data in the column will be lost.
  - You are about to drop the column `fechaNacimiento` on the `Estudiante` table. All the data in the column will be lost.
  - You are about to drop the column `genero` on the `Estudiante` table. All the data in the column will be lost.
  - You are about to drop the column `nivel` on the `Estudiante` table. All the data in the column will be lost.
  - You are about to drop the column `activo` on the `FuncionarioInstitucional` table. All the data in the column will be lost.
  - You are about to drop the column `correo` on the `FuncionarioInstitucional` table. All the data in the column will be lost.
  - You are about to drop the column `telefono` on the `FuncionarioInstitucional` table. All the data in the column will be lost.
  - You are about to drop the column `accioesTomadas` on the `Incidente` table. All the data in the column will be lost.
  - You are about to drop the column `atendidoPorId` on the `Incidente` table. All the data in the column will be lost.
  - You are about to drop the column `estado` on the `Incidente` table. All the data in the column will be lost.
  - You are about to drop the column `fechaOcurrencia` on the `Incidente` table. All the data in the column will be lost.
  - You are about to drop the column `lugar` on the `Incidente` table. All the data in the column will be lost.
  - You are about to drop the column `observaciones` on the `Incidente` table. All the data in the column will be lost.
  - You are about to drop the column `reportadoPorId` on the `Incidente` table. All the data in the column will be lost.
  - You are about to drop the column `descripcion` on the `Involucrado` table. All the data in the column will be lost.
  - A unique constraint covering the columns `[estudianteId,incidenteId,rol]` on the table `Involucrado` will be added. If there are existing duplicate values, this will fail.
  - Changed the type of `cargo` on the `FuncionarioInstitucional` table. No cast exists, the column would be dropped and recreated, which cannot be done if there is data, since the column is required.
  - Added the required column `fecha` to the `Incidente` table without a default value. This is not possible if the table is not empty.
  - Added the required column `registradoPorId` to the `Incidente` table without a default value. This is not possible if the table is not empty.

*/
-- CreateEnum
CREATE TYPE "EstadoCaso" AS ENUM ('ABIERTO', 'EN_SEGUIMIENTO', 'RESUELTO', 'CERRADO', 'DERIVADO');

-- CreateEnum
CREATE TYPE "RolSistema" AS ENUM ('ADMINISTRADOR', 'ENCARGADO_CONVIVENCIA', 'DOCENTE', 'INSPECTOR', 'ORIENTADOR', 'EQUIPO_DIRECTIVO');

-- CreateEnum
CREATE TYPE "TipoAccion" AS ENUM ('CITACION', 'DERIVACION_ORIENTACION', 'ENTREVISTA', 'DERIVACION_PSICOLOGO');

-- AlterEnum
BEGIN;
CREATE TYPE "RolInvolucrado_new" AS ENUM ('AFECTADO', 'RESPONSABLE', 'TESTIGO', 'INTERVINIENTE');
ALTER TABLE "Involucrado" ALTER COLUMN "rol" TYPE "RolInvolucrado_new" USING ("rol"::text::"RolInvolucrado_new");
ALTER TYPE "RolInvolucrado" RENAME TO "RolInvolucrado_old";
ALTER TYPE "RolInvolucrado_new" RENAME TO "RolInvolucrado";
DROP TYPE "RolInvolucrado_old";
COMMIT;

-- AlterEnum
BEGIN;
CREATE TYPE "TipoIncidente_new" AS ENUM ('CONFLICTO', 'AGRESION_FISICA', 'AGRESION_VERBAL', 'ACOSO', 'DANO_MATERIAL');
ALTER TABLE "Incidente" ALTER COLUMN "tipo" TYPE "TipoIncidente_new" USING ("tipo"::text::"TipoIncidente_new");
ALTER TYPE "TipoIncidente" RENAME TO "TipoIncidente_old";
ALTER TYPE "TipoIncidente_new" RENAME TO "TipoIncidente";
DROP TYPE "TipoIncidente_old";
COMMIT;

-- DropForeignKey
ALTER TABLE "Incidente" DROP CONSTRAINT "Incidente_atendidoPorId_fkey";

-- DropForeignKey
ALTER TABLE "Incidente" DROP CONSTRAINT "Incidente_reportadoPorId_fkey";

-- DropForeignKey
ALTER TABLE "Involucrado" DROP CONSTRAINT "Involucrado_incidenteId_fkey";

-- DropIndex
DROP INDEX "FuncionarioInstitucional_correo_key";

-- DropIndex
DROP INDEX "Involucrado_incidenteId_estudianteId_key";

-- AlterTable
ALTER TABLE "Estudiante" DROP COLUMN "activo",
DROP COLUMN "anioIngreso",
DROP COLUMN "fechaNacimiento",
DROP COLUMN "genero",
DROP COLUMN "nivel";

-- AlterTable
ALTER TABLE "FuncionarioInstitucional" DROP COLUMN "activo",
DROP COLUMN "correo",
DROP COLUMN "telefono",
DROP COLUMN "cargo",
ADD COLUMN     "cargo" "RolSistema" NOT NULL;

-- AlterTable
ALTER TABLE "Incidente" DROP COLUMN "accioesTomadas",
DROP COLUMN "atendidoPorId",
DROP COLUMN "estado",
DROP COLUMN "fechaOcurrencia",
DROP COLUMN "lugar",
DROP COLUMN "observaciones",
DROP COLUMN "reportadoPorId",
ADD COLUMN     "fecha" TIMESTAMP(3) NOT NULL,
ADD COLUMN     "registradoPorId" INTEGER NOT NULL;

-- AlterTable
ALTER TABLE "Involucrado" DROP COLUMN "descripcion",
ADD COLUMN     "funcionarioIntervinienteId" INTEGER,
ADD COLUMN     "observacion" TEXT;

-- DropEnum
DROP TYPE "EstadoIncidente";

-- DropEnum
DROP TYPE "Genero";

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
ALTER TABLE "Involucrado" ADD CONSTRAINT "Involucrado_incidenteId_fkey" FOREIGN KEY ("incidenteId") REFERENCES "Incidente"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Involucrado" ADD CONSTRAINT "Involucrado_funcionarioIntervinienteId_fkey" FOREIGN KEY ("funcionarioIntervinienteId") REFERENCES "FuncionarioInstitucional"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CasoIncidente" ADD CONSTRAINT "CasoIncidente_casoId_fkey" FOREIGN KEY ("casoId") REFERENCES "Caso"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CasoIncidente" ADD CONSTRAINT "CasoIncidente_incidenteId_fkey" FOREIGN KEY ("incidenteId") REFERENCES "Incidente"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AccionIntervencion" ADD CONSTRAINT "AccionIntervencion_casoId_fkey" FOREIGN KEY ("casoId") REFERENCES "Caso"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
