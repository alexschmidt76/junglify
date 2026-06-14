-- Better Auth's username plugin writes to a camelCase "displayUsername" column,
-- but 002 created it as "display_name", so sign-up inserts failed
-- (FAILED_TO_CREATE_USER -> HTTP 422). Rename to match what the plugin expects.
ALTER TABLE "user" RENAME COLUMN "display_name" TO "displayUsername";
