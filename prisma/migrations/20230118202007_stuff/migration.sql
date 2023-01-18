/*
  Warnings:

  - A unique constraint covering the columns `[partyLinkId]` on the table `Party` will be added. If there are existing duplicate values, this will fail.
  - Added the required column `partyLinkId` to the `Party` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "Party" ADD COLUMN     "partyLinkId" TEXT NOT NULL;

-- CreateTable
CREATE TABLE "PartyLink" (
    "id" TEXT NOT NULL,
    "url" TEXT NOT NULL,
    "expireIn" TIMESTAMP(3) NOT NULL DEFAULT NOW() + interval '1 day',

    CONSTRAINT "PartyLink_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Party_partyLinkId_key" ON "Party"("partyLinkId");

-- AddForeignKey
ALTER TABLE "Party" ADD CONSTRAINT "Party_partyLinkId_fkey" FOREIGN KEY ("partyLinkId") REFERENCES "PartyLink"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
