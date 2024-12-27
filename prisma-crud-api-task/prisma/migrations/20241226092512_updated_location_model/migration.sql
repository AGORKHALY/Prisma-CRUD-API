-- CreateTable
CREATE TABLE "UserPassword" (
    "id" SERIAL NOT NULL,
    "empId" INTEGER NOT NULL,
    "password" TEXT NOT NULL,

    CONSTRAINT "UserPassword_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "UserPassword_empId_key" ON "UserPassword"("empId");

-- AddForeignKey
ALTER TABLE "UserPassword" ADD CONSTRAINT "UserPassword_empId_fkey" FOREIGN KEY ("empId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
