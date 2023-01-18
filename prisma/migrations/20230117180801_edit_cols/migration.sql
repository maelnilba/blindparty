/*
  Warnings:

  - You are about to drop the column `friendImage` on the `Friend` table. All the data in the column will be lost.
  - You are about to drop the column `friendName` on the `Friend` table. All the data in the column will be lost.
  - Added the required column `image` to the `Friend` table without a default value. This is not possible if the table is not empty.
  - Added the required column `name` to the `Friend` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "Friend" DROP COLUMN "friendImage",
DROP COLUMN "friendName",
ADD COLUMN     "image" TEXT NOT NULL,
ADD COLUMN     "name" TEXT NOT NULL;
