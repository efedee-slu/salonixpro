-- CreateEnum
CREATE TYPE "CalendarSyncStatus" AS ENUM ('PENDING', 'SYNCED', 'FAILED', 'DELETED');

-- AlterTable - Add Google Calendar fields to Business
ALTER TABLE "Business" ADD COLUMN "googleCalendarEnabled" BOOLEAN NOT NULL DEFAULT false;
ALTER TABLE "Business" ADD COLUMN "googleCalSyncAuto" BOOLEAN NOT NULL DEFAULT false;
ALTER TABLE "Business" ADD COLUMN "googleCalIncludePhone" BOOLEAN NOT NULL DEFAULT false;
ALTER TABLE "Business" ADD COLUMN "googleCalIncludeNotes" BOOLEAN NOT NULL DEFAULT false;

-- AlterTable - Add Google Calendar fields to Stylist
ALTER TABLE "Stylist" ADD COLUMN "googleAccessToken" TEXT;
ALTER TABLE "Stylist" ADD COLUMN "googleRefreshToken" TEXT;
ALTER TABLE "Stylist" ADD COLUMN "googleTokenExpiresAt" TIMESTAMP(3);
ALTER TABLE "Stylist" ADD COLUMN "googleCalendarSync" BOOLEAN NOT NULL DEFAULT false;
ALTER TABLE "Stylist" ADD COLUMN "googleCalendarId" TEXT;

-- CreateTable
CREATE TABLE "CalendarSync" (
    "id" TEXT NOT NULL,
    "businessId" TEXT NOT NULL,
    "stylistId" TEXT NOT NULL,
    "appointmentId" TEXT NOT NULL,
    "googleEventId" TEXT,
    "syncStatus" "CalendarSyncStatus" NOT NULL DEFAULT 'PENDING',
    "lastSyncedAt" TIMESTAMP(3),
    "errorMessage" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "CalendarSync_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "CalendarSync_appointmentId_stylistId_key" ON "CalendarSync"("appointmentId", "stylistId");

-- CreateIndex
CREATE INDEX "CalendarSync_syncStatus_idx" ON "CalendarSync"("syncStatus");

-- CreateIndex
CREATE INDEX "CalendarSync_stylistId_idx" ON "CalendarSync"("stylistId");

-- AddForeignKey
ALTER TABLE "CalendarSync" ADD CONSTRAINT "CalendarSync_businessId_fkey" FOREIGN KEY ("businessId") REFERENCES "Business"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CalendarSync" ADD CONSTRAINT "CalendarSync_stylistId_fkey" FOREIGN KEY ("stylistId") REFERENCES "Stylist"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CalendarSync" ADD CONSTRAINT "CalendarSync_appointmentId_fkey" FOREIGN KEY ("appointmentId") REFERENCES "Appointment"("id") ON DELETE CASCADE ON UPDATE CASCADE;
