/*
  Warnings:

  - You are about to drop the column `partyId` on the `User` table. All the data in the column will be lost.

*/
-- DropForeignKey
ALTER TABLE "User" DROP CONSTRAINT "User_partyId_fkey";

-- AlterTable
ALTER TABLE "User" DROP COLUMN "partyId";

-- CreateTable
CREATE TABLE "_PartyToUser" (
    "A" TEXT NOT NULL,
    "B" TEXT NOT NULL
);

-- CreateIndex
CREATE UNIQUE INDEX "_PartyToUser_AB_unique" ON "_PartyToUser"("A", "B");

-- CreateIndex
CREATE INDEX "_PartyToUser_B_index" ON "_PartyToUser"("B");

-- AddForeignKey
ALTER TABLE "_PartyToUser" ADD CONSTRAINT "_PartyToUser_A_fkey" FOREIGN KEY ("A") REFERENCES "Party"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_PartyToUser" ADD CONSTRAINT "_PartyToUser_B_fkey" FOREIGN KEY ("B") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
