-- Bank details shown as "Pay to" on invoices. Additive, nullable: no backfill.
-- AlterTable
ALTER TABLE "Business" ADD COLUMN     "bankAccountName" TEXT,
ADD COLUMN     "bankAccountNumber" TEXT,
ADD COLUMN     "bankName" TEXT;
