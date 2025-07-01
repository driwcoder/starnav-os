-- CreateEnum
CREATE TYPE "UserRole" AS ENUM ('ADMIN', 'GESTOR', 'SUPERVISOR', 'COORDENADOR', 'COMPRADOR_JUNIOR', 'COMPRADOR_PLENO', 'COMPRADOR_SENIOR', 'COMANDANTE', 'IMEDIATO', 'OQN', 'CHEFE_MAQUINAS', 'SUB_CHEFE_MAQUINAS', 'OQM', 'ASSISTENTE', 'AUXILIAR', 'ESTAGIARIO');

-- CreateEnum
CREATE TYPE "UserSector" AS ENUM ('ADMINISTRACAO', 'MANUTENCAO', 'OPERACAO', 'SUPRIMENTOS', 'ALMOXARIFADO', 'RH', 'TI', 'TRIPULACAO', 'NAO_DEFINIDO');

-- CreateEnum
CREATE TYPE "OrderStatus" AS ENUM ('PENDENTE', 'EM_ANALISE', 'APROVADA', 'RECUSADA', 'PLANEJADA', 'AGUARDANDO_SUPRIMENTOS', 'CONTRATADA', 'EM_EXECUCAO', 'AGUARDANDO_PECAS', 'CONCLUIDA', 'CANCELADA');

-- CreateEnum
CREATE TYPE "Priority" AS ENUM ('BAIXA', 'MEDIA', 'ALTA', 'URGENTE');

-- CreateEnum
CREATE TYPE "SolutionType" AS ENUM ('INTERNA', 'TERCEIRIZADA');

-- CreateTable
CREATE TABLE "User" (
    "id" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "name" TEXT,
    "password" TEXT NOT NULL,
    "role" "UserRole" NOT NULL DEFAULT 'ASSISTENTE',
    "sector" "UserSector" NOT NULL DEFAULT 'NAO_DEFINIDO',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "User_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ServiceOrder" (
    "id" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "scopeOfService" TEXT,
    "status" "OrderStatus" NOT NULL DEFAULT 'PENDENTE',
    "priority" "Priority" NOT NULL DEFAULT 'MEDIA',
    "ship" TEXT NOT NULL,
    "location" TEXT,
    "requestedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "dueDate" TIMESTAMP(3),
    "plannedStartDate" TIMESTAMP(3),
    "plannedEndDate" TIMESTAMP(3),
    "solutionType" "SolutionType",
    "responsibleCrew" TEXT,
    "coordinatorNotes" TEXT,
    "contractedCompany" TEXT,
    "contractDate" TIMESTAMP(3),
    "serviceOrderCost" DOUBLE PRECISION,
    "supplierNotes" TEXT,
    "reportAttachments" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "completedAt" TIMESTAMP(3),
    "createdById" TEXT NOT NULL,
    "assignedToId" TEXT,

    CONSTRAINT "ServiceOrder_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "User_email_key" ON "User"("email");

-- AddForeignKey
ALTER TABLE "ServiceOrder" ADD CONSTRAINT "ServiceOrder_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ServiceOrder" ADD CONSTRAINT "ServiceOrder_assignedToId_fkey" FOREIGN KEY ("assignedToId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;
