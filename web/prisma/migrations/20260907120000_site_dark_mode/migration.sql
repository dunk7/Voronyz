-- Storefront light/dark color palette, flipped from /orders admin.
INSERT INTO "SiteSetting" ("key", "value", "updatedAt")
VALUES ('dark_mode', 'false', CURRENT_TIMESTAMP)
ON CONFLICT ("key") DO NOTHING;
