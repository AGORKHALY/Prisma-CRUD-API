-- CreateTable
CREATE TABLE "users" (
    "id" SERIAL NOT NULL,
    "Ename" VARCHAR(60) NOT NULL,
    "ESalary" INTEGER,
    "EStatus" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "users_pkey" PRIMARY KEY ("id")
);
