/*
  Warnings:

  - You are about to drop the `Keuangan` table. If the table is not empty, all the data it contains will be lost.

*/
-- AlterTable
ALTER TABLE "Customer" ADD COLUMN     "ongkirDefault" DOUBLE PRECISION NOT NULL DEFAULT 0,
ADD COLUMN     "ongkirPerusahaanDefault" DOUBLE PRECISION NOT NULL DEFAULT 0;

-- DropTable
DROP TABLE "Keuangan";

-- CreateTable
CREATE TABLE "HargaKhusus" (
    "id" SERIAL NOT NULL,
    "customerId" INTEGER NOT NULL,
    "productId" INTEGER NOT NULL,
    "harga" DOUBLE PRECISION NOT NULL,

    CONSTRAINT "HargaKhusus_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "HargaKhusus_customerId_productId_key" ON "HargaKhusus"("customerId", "productId");

-- AddForeignKey
ALTER TABLE "HargaKhusus" ADD CONSTRAINT "HargaKhusus_customerId_fkey" FOREIGN KEY ("customerId") REFERENCES "Customer"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "HargaKhusus" ADD CONSTRAINT "HargaKhusus_productId_fkey" FOREIGN KEY ("productId") REFERENCES "Product"("id") ON DELETE CASCADE ON UPDATE CASCADE;
