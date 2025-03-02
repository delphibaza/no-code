-- CreateEnum
CREATE TYPE "ProjectState" AS ENUM ('new', 'existing');

-- AlterTable
ALTER TABLE "Project" ADD COLUMN     "state" "ProjectState" NOT NULL DEFAULT 'new';
