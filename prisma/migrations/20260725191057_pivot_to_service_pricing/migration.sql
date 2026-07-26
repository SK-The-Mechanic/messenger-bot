/*
  Warnings:

  - You are about to drop the `DeliveryArea` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `Product` table. If the table is not empty, all the data it contains will be lost.

*/
-- DropTable
DROP TABLE "DeliveryArea";

-- DropTable
DROP TABLE "Product";

-- CreateTable
CREATE TABLE "ServicePricing" (
    "id" TEXT NOT NULL,
    "category" TEXT NOT NULL,
    "subType" TEXT,
    "techStack" TEXT NOT NULL,
    "minPriceBDT" INTEGER NOT NULL,
    "maxPriceBDT" INTEGER NOT NULL,
    "minPriceUSD" INTEGER NOT NULL,
    "maxPriceUSD" INTEGER NOT NULL,
    "notes" TEXT,
    "active" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ServicePricing_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "UnsupportedTech" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "active" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "UnsupportedTech_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "UnsupportedTech_name_key" ON "UnsupportedTech"("name");
