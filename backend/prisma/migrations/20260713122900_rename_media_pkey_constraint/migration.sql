-- Renaming a table doesn't rename its constraints; align the primary key
-- constraint name with Prisma's convention for the new table name.
ALTER TABLE "Media" RENAME CONSTRAINT "ImageMedia_pkey" TO "Media_pkey";
