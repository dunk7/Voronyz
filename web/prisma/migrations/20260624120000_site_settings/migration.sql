-- CreateTable
CREATE TABLE "SiteSetting" (
    "key" TEXT NOT NULL,
    "value" TEXT NOT NULL,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "SiteSetting_pkey" PRIMARY KEY ("key")
);

-- Message app starts disabled until enabled from /orders admin.
INSERT INTO "SiteSetting" ("key", "value", "updatedAt")
VALUES ('message_enabled', 'false', CURRENT_TIMESTAMP);
