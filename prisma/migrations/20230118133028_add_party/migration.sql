-- CreateEnum
CREATE TYPE "PartyStatus" AS ENUM ('PENDING', 'CANCELED', 'RUNNING', 'ENDED');

-- CreateTable
CREATE TABLE "Party" (
    "id" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "playlistId" TEXT,
    "hostId" TEXT NOT NULL,
    "status" "PartyStatus" NOT NULL,
    "max_round" INTEGER NOT NULL,
    "round" INTEGER NOT NULL,

    CONSTRAINT "Party_pkey" PRIMARY KEY ("id")
);

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
ALTER TABLE "Party" ADD CONSTRAINT "Party_playlistId_fkey" FOREIGN KEY ("playlistId") REFERENCES "Playlist"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Party" ADD CONSTRAINT "Party_hostId_fkey" FOREIGN KEY ("hostId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_PartyToUser" ADD CONSTRAINT "_PartyToUser_A_fkey" FOREIGN KEY ("A") REFERENCES "Party"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_PartyToUser" ADD CONSTRAINT "_PartyToUser_B_fkey" FOREIGN KEY ("B") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
