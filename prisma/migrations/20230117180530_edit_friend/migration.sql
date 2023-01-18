/*
  Warnings:

  - Added the required column `friendImage` to the `Friend` table without a default value. This is not possible if the table is not empty.
  - Added the required column `friendName` to the `Friend` table without a default value. This is not possible if the table is not empty.

*/
-- DropForeignKey
ALTER TABLE "Friend" DROP CONSTRAINT "Friend_friendId_fkey";

-- AlterTable
ALTER TABLE "Friend" ADD COLUMN     "friendImage" TEXT NOT NULL,
ADD COLUMN     "friendName" TEXT NOT NULL,
ADD COLUMN     "userId" TEXT;

-- AddForeignKey
ALTER TABLE "Friend" ADD CONSTRAINT "Friend_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;
