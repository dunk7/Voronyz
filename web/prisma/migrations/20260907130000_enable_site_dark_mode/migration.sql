-- Turn storefront dark mode on so the live site uses the dark palette.
-- Admins can still flip it off from /orders.
INSERT INTO "SiteSetting" ("key", "value", "updatedAt")
VALUES ('dark_mode', 'true', CURRENT_TIMESTAMP)
ON CONFLICT ("key") DO NOTHING;

UPDATE "SiteSetting"
SET "value" = 'true', "updatedAt" = CURRENT_TIMESTAMP
WHERE "key" = 'dark_mode'
  AND LOWER(TRIM("value")) NOT IN ('true', '1', 'yes', 'dark');
