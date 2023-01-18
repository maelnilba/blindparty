/*
  Warnings:

  - A unique constraint covering the columns `[userSentId,userInviteId]` on the table `FriendInvitation` will be added. If there are existing duplicate values, this will fail.

*/
-- AlterEnum
ALTER TYPE "InvitationStatus" ADD VALUE 'BLOCKED';

-- CreateIndex
CREATE UNIQUE INDEX "FriendInvitation_userSentId_userInviteId_key" ON "FriendInvitation"("userSentId", "userInviteId");
