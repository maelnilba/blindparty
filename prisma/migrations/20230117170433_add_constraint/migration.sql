/*
  Warnings:

  - You are about to drop the column `userId` on the `Friend` table. All the data in the column will be lost.
  - A unique constraint covering the columns `[friendId]` on the table `Friend` will be added. If there are existing duplicate values, this will fail.
  - Added the required column `friendId` to the `Friend` table without a default value. This is not possible if the table is not empty.

*/
-- DropForeignKey
ALTER TABLE "Friend" DROP CONSTRAINT "Friend_userId_fkey";

-- DropIndex
DROP INDEX "Friend_userId_key";

-- AlterTable
ALTER TABLE "Friend" DROP COLUMN "userId",
ADD COLUMN     "friendId" TEXT NOT NULL;

-- CreateIndex
CREATE UNIQUE INDEX "Friend_friendId_key" ON "Friend"("friendId");

-- AddForeignKey
ALTER TABLE "Friend" ADD CONSTRAINT "Friend_friendId_fkey" FOREIGN KEY ("friendId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
