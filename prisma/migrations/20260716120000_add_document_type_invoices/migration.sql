-- CreateEnum
CREATE TYPE "DocumentType" AS ENUM ('RECEIPT', 'INVOICE');

-- DropIndex
DROP INDEX "Receipt_businessId_number_key";

-- DropIndex
DROP INDEX "Receipt_businessId_status_idx";

-- AlterTable
ALTER TABLE "Business" ADD COLUMN     "invoiceNumberFormat" TEXT NOT NULL DEFAULT 'INV-{YYYY}-{NNNN}';

-- AlterTable
ALTER TABLE "Receipt" ADD COLUMN     "documentType" "DocumentType" NOT NULL DEFAULT 'RECEIPT',
ADD COLUMN     "dueDate" TIMESTAMP(3),
ADD COLUMN     "paymentTerms" TEXT,
ADD COLUMN     "sourceInvoiceId" TEXT;

-- AlterTable
ALTER TABLE "ReceiptCounter" DROP CONSTRAINT "ReceiptCounter_pkey",
ADD COLUMN     "type" "DocumentType" NOT NULL DEFAULT 'RECEIPT',
ADD CONSTRAINT "ReceiptCounter_pkey" PRIMARY KEY ("businessId", "type", "year");

-- CreateIndex
CREATE UNIQUE INDEX "Receipt_sourceInvoiceId_key" ON "Receipt"("sourceInvoiceId");

-- CreateIndex
CREATE INDEX "Receipt_businessId_documentType_status_idx" ON "Receipt"("businessId", "documentType", "status");

-- CreateIndex
CREATE UNIQUE INDEX "Receipt_businessId_documentType_number_key" ON "Receipt"("businessId", "documentType", "number");

-- AddForeignKey
ALTER TABLE "Receipt" ADD CONSTRAINT "Receipt_sourceInvoiceId_fkey" FOREIGN KEY ("sourceInvoiceId") REFERENCES "Receipt"("id") ON DELETE SET NULL ON UPDATE CASCADE;
