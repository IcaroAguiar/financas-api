-- CreateEnum
CREATE TYPE "DebtStatus" AS ENUM ('PENDENTE', 'PAGA');

-- AlterTable
ALTER TABLE "Debt" ADD COLUMN     "status" "DebtStatus" NOT NULL DEFAULT 'PENDENTE';
