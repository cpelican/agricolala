-- AlterTable
ALTER TABLE "User" ADD COLUMN     "tosAccepted" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "tosAcceptedAt" TIMESTAMP(3);
