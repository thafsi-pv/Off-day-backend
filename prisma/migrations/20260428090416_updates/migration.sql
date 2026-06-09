-- AlterEnum
ALTER TYPE "Role" ADD VALUE 'SHIFT_MANAGER';

-- AlterEnum
ALTER TYPE "WeekRange" ADD VALUE 'THREE_WEEKS';

-- DropForeignKey
ALTER TABLE "public"."Leave" DROP CONSTRAINT "Leave_shiftId_fkey";

-- AlterTable
ALTER TABLE "Config" ADD COLUMN     "blockedDates" TEXT[] DEFAULT ARRAY[]::TEXT[],
ADD COLUMN     "maxLeavesPerWeek" INTEGER DEFAULT 1,
ADD COLUMN     "minNoticeDays" INTEGER NOT NULL DEFAULT 2,
ADD COLUMN     "openingDay" INTEGER NOT NULL DEFAULT 0,
ADD COLUMN     "openingTime" TEXT NOT NULL DEFAULT '07:00',
ALTER COLUMN "disabledDays" SET DEFAULT ARRAY[]::INTEGER[];

-- AlterTable
ALTER TABLE "Leave" ADD COLUMN     "creatorId" TEXT;

-- AlterTable
ALTER TABLE "User" ADD COLUMN     "allowedTabs" TEXT[] DEFAULT ARRAY[]::TEXT[];

-- CreateTable
CREATE TABLE "UserShift" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "shiftId" TEXT NOT NULL,
    "startDate" TIMESTAMP(3) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "UserShift_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "UserShift_userId_startDate_key" ON "UserShift"("userId", "startDate");

-- AddForeignKey
ALTER TABLE "UserShift" ADD CONSTRAINT "UserShift_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "UserShift" ADD CONSTRAINT "UserShift_shiftId_fkey" FOREIGN KEY ("shiftId") REFERENCES "Shift"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Leave" ADD CONSTRAINT "Leave_shiftId_fkey" FOREIGN KEY ("shiftId") REFERENCES "Shift"("id") ON DELETE CASCADE ON UPDATE CASCADE;
