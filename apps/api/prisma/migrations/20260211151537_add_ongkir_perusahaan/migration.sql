/*
  Warnings:

  - You are about to drop the column `tanggal` on the `Order` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "Order" DROP COLUMN "tanggal",
ADD COLUMN     "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
ADD COLUMN     "ongkirPerusahaan" DOUBLE PRECISION NOT NULL DEFAULT 0,
ALTER COLUMN "status" SET DEFAULT 'LUNAS',
ALTER COLUMN "metodeBayar" SET DEFAULT 'TF';
