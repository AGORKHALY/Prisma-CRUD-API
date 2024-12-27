-- DropForeignKey
ALTER TABLE "Location" DROP CONSTRAINT "Location_empId_fkey";

-- AddForeignKey
ALTER TABLE "Location" ADD CONSTRAINT "Location_empId_fkey" FOREIGN KEY ("empId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
