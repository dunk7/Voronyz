-- Messenger was created disabled ("temporarily" off). Turn it back on so
-- /message can send; admins can still flip it off from /orders.
UPDATE "SiteSetting"
SET "value" = 'true', "updatedAt" = CURRENT_TIMESTAMP
WHERE "key" = 'message_enabled'
  AND LOWER(TRIM("value")) NOT IN ('true', '1', 'yes');
