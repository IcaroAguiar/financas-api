/*
  Warnings:

  - You are about to alter the column `balance` on the `Account` table. The data in that column could be lost. The data in that column will be cast from `DoublePrecision` to `Integer`.
  - You are about to alter the column `totalAmount` on the `Debt` table. The data in that column could be lost. The data in that column will be cast from `DoublePrecision` to `Integer`.
  - You are about to alter the column `installmentAmount` on the `Debt` table. The data in that column could be lost. The data in that column will be cast from `DoublePrecision` to `Integer`.
  - You are about to alter the column `amount` on the `Installment` table. The data in that column could be lost. The data in that column will be cast from `DoublePrecision` to `Integer`.
  - You are about to alter the column `amount` on the `Payment` table. The data in that column could be lost. The data in that column will be cast from `DoublePrecision` to `Integer`.
  - You are about to alter the column `amount` on the `Subscription` table. The data in that column could be lost. The data in that column will be cast from `DoublePrecision` to `Integer`.
  - You are about to alter the column `amount` on the `Transaction` table. The data in that column could be lost. The data in that column will be cast from `DoublePrecision` to `Integer`.
  - You are about to alter the column `installmentAmount` on the `Transaction` table. The data in that column could be lost. The data in that column will be cast from `DoublePrecision` to `Integer`.
  - You are about to alter the column `amount` on the `TransactionInstallment` table. The data in that column could be lost. The data in that column will be cast from `DoublePrecision` to `Integer`.
  - Added the required column `userId` to the `Debtor` table without a default value. This is not possible if the table is not empty.

*/
-- AlterEnum - Add PAGO value if it doesn't exist
DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_enum WHERE enumlabel = 'PAGO' AND enumtypid = (SELECT oid FROM pg_type WHERE typname = 'TransactionType')) THEN
        ALTER TYPE "TransactionType" ADD VALUE 'PAGO';
    END IF;
END $$;

-- AlterTable
ALTER TABLE "Account" ALTER COLUMN "balance" SET DEFAULT 0,
ALTER COLUMN "balance" SET DATA TYPE INTEGER;

-- AlterTable
ALTER TABLE "Debt" ADD COLUMN     "notificationId" TEXT,
ALTER COLUMN "totalAmount" SET DATA TYPE INTEGER,
ALTER COLUMN "dueDate" DROP NOT NULL,
ALTER COLUMN "installmentAmount" SET DATA TYPE INTEGER;

-- AlterTable
ALTER TABLE "Debtor" ADD COLUMN     "userId" TEXT NOT NULL;

-- AlterTable
ALTER TABLE "Installment" ALTER COLUMN "amount" SET DATA TYPE INTEGER;

-- AlterTable
ALTER TABLE "Payment" ALTER COLUMN "amount" SET DATA TYPE INTEGER;

-- AlterTable
ALTER TABLE "Subscription" ALTER COLUMN "amount" SET DATA TYPE INTEGER;

-- AlterTable
ALTER TABLE "Transaction" ALTER COLUMN "amount" SET DATA TYPE INTEGER,
ALTER COLUMN "installmentAmount" SET DATA TYPE INTEGER;

-- AlterTable
ALTER TABLE "TransactionInstallment" ALTER COLUMN "amount" SET DATA TYPE INTEGER;

-- AlterTable
ALTER TABLE "User" ADD COLUMN     "profilePicture" TEXT,
ADD COLUMN     "resetToken" TEXT,
ADD COLUMN     "resetTokenExpiry" TIMESTAMP(3);

-- AddForeignKey
ALTER TABLE "Debtor" ADD CONSTRAINT "Debtor_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
