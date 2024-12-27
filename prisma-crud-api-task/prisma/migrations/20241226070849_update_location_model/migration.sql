-- CreateTable
CREATE TABLE "Location" (
    "id" SERIAL NOT NULL,
    "empId" INTEGER NOT NULL,
    "country" TEXT NOT NULL,
    "district" TEXT NOT NULL,
    "street" TEXT NOT NULL,

    CONSTRAINT "Location_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "Location" ADD CONSTRAINT "Location_empId_fkey" FOREIGN KEY ("empId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
