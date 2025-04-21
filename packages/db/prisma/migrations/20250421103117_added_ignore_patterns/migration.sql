-- AlterTable
ALTER TABLE "Project" ADD COLUMN     "ignorePatterns" TEXT[] DEFAULT ARRAY[]::TEXT[];
