-- CreateTable
CREATE TABLE "ExaminerAssignment" (
    "id" TEXT NOT NULL,
    "studentId" TEXT NOT NULL,
    "examinerId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ExaminerAssignment_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "ExaminerAssignment_studentId_idx" ON "ExaminerAssignment"("studentId");

-- CreateIndex
CREATE INDEX "ExaminerAssignment_examinerId_idx" ON "ExaminerAssignment"("examinerId");

-- CreateIndex
CREATE UNIQUE INDEX "ExaminerAssignment_studentId_examinerId_key" ON "ExaminerAssignment"("studentId", "examinerId");

-- AddForeignKey
ALTER TABLE "ExaminerAssignment" ADD CONSTRAINT "ExaminerAssignment_studentId_fkey" FOREIGN KEY ("studentId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ExaminerAssignment" ADD CONSTRAINT "ExaminerAssignment_examinerId_fkey" FOREIGN KEY ("examinerId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
