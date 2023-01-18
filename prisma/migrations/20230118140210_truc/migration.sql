/*
  Warnings:

  - Made the column `playlistId` on table `Party` required. This step will fail if there are existing NULL values in that column.

*/
-- DropForeignKey
ALTER TABLE "Party" DROP CONSTRAINT "Party_playlistId_fkey";

-- AlterTable
ALTER TABLE "Party" ALTER COLUMN "playlistId" SET NOT NULL;

-- AddForeignKey
ALTER TABLE "Party" ADD CONSTRAINT "Party_playlistId_fkey" FOREIGN KEY ("playlistId") REFERENCES "Playlist"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
