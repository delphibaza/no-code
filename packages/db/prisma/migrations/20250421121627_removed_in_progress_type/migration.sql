/*
  Warnings:

  - The values [inProgress] on the enum `ProjectState` will be removed. If these variants are still used in the database, this will fail.

*/
-- AlterEnum
BEGIN;
UPDATE "Project" SET "state" = 'new' WHERE "state" = 'inProgress';
CREATE TYPE "ProjectState_new" AS ENUM ('new', 'existing', 'blankTemplate');
ALTER TABLE "Project" ALTER COLUMN "state" DROP DEFAULT;
ALTER TABLE "Project" ALTER COLUMN "state" TYPE "ProjectState_new" USING ("state"::text::"ProjectState_new");
ALTER TYPE "ProjectState" RENAME TO "ProjectState_old";
ALTER TYPE "ProjectState_new" RENAME TO "ProjectState";
DROP TYPE "ProjectState_old";
ALTER TABLE "Project" ALTER COLUMN "state" SET DEFAULT 'new';
COMMIT;
