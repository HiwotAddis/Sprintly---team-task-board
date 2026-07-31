-- AlterEnum
CREATE TYPE "TaskStatus" AS ENUM ('todo', 'in_progress', 'done');

-- AlterTable
ALTER TABLE "Task" ADD COLUMN     "status" "TaskStatus" NOT NULL DEFAULT 'todo',
ADD COLUMN     "dueDate" TIMESTAMP(3),
ADD COLUMN     "assigneeId" TEXT;

-- CreateIndex
CREATE INDEX "Task_assigneeId_idx" ON "Task"("assigneeId");

-- AddForeignKey
ALTER TABLE "Task" ADD CONSTRAINT "Task_assigneeId_fkey" FOREIGN KEY ("assigneeId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;
