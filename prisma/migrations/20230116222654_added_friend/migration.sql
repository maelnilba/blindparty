-- CreateEnum
CREATE TYPE "InvitationStatus" AS ENUM ('PENDING', 'ACCEPTED', 'REFUSED');

-- CreateTable
CREATE TABLE "Friend" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,

    CONSTRAINT "Friend_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "FriendInvitation" (
    "id" TEXT NOT NULL,
    "userSentId" TEXT NOT NULL,
    "userInviteId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "status" "InvitationStatus" NOT NULL,

    CONSTRAINT "FriendInvitation_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "Friend" ADD CONSTRAINT "Friend_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "FriendInvitation" ADD CONSTRAINT "FriendInvitation_userSentId_fkey" FOREIGN KEY ("userSentId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "FriendInvitation" ADD CONSTRAINT "FriendInvitation_userInviteId_fkey" FOREIGN KEY ("userInviteId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
