-- AlterEnum
ALTER TYPE "ProjectState" ADD VALUE 'blankTemplate';

-- AlterTable
ALTER TABLE "Project" ADD COLUMN     "templateName" TEXT;
