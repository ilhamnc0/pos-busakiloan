/*
  Warnings:

  - Added the required column `grandTotal` to the `Order` table without a default value. This is not possible if the table is not empty.
  - Added the required column `metodeBayar` to the `Order` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "Order" ADD COLUMN     "dp" DOUBLE PRECISION NOT NULL DEFAULT 0,
ADD COLUMN     "grandTotal" DOUBLE PRECISION NOT NULL,
ADD COLUMN     "kekurangan" DOUBLE PRECISION NOT NULL DEFAULT 0,
ADD COLUMN     "keterangan" TEXT,
ADD COLUMN     "metodeBayar" TEXT NOT NULL,
ADD COLUMN     "ongkir" DOUBLE PRECISION NOT NULL DEFAULT 0;

-- CreateTable
CREATE TABLE "OrderItem" (
    "id" SERIAL NOT NULL,
    "orderId" INTEGER NOT NULL,
    "productId" INTEGER NOT NULL,
    "qty" DOUBLE PRECISION NOT NULL,
    "hargaSatuan" DOUBLE PRECISION NOT NULL,
    "subtotal" DOUBLE PRECISION NOT NULL,

    CONSTRAINT "OrderItem_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Keuangan" (
    "id" SERIAL NOT NULL,
    "tipe" TEXT NOT NULL,
    "tanggal" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "nama" TEXT NOT NULL,
    "nominal" DOUBLE PRECISION NOT NULL,
    "metode" TEXT NOT NULL,
    "keterangan" TEXT,

    CONSTRAINT "Keuangan_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "OrderItem" ADD CONSTRAINT "OrderItem_orderId_fkey" FOREIGN KEY ("orderId") REFERENCES "Order"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "OrderItem" ADD CONSTRAINT "OrderItem_productId_fkey" FOREIGN KEY ("productId") REFERENCES "Product"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
