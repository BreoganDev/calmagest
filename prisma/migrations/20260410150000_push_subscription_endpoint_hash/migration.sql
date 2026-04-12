ALTER TABLE "PushSubscription"
ADD COLUMN "endpointHash" TEXT;

UPDATE "PushSubscription"
SET "endpointHash" = md5("endpoint")
WHERE "endpointHash" IS NULL;

ALTER TABLE "PushSubscription"
ALTER COLUMN "endpointHash" SET NOT NULL;

DROP INDEX IF EXISTS "PushSubscription_userId_endpoint_key";
CREATE UNIQUE INDEX "PushSubscription_userId_endpointHash_key" ON "PushSubscription"("userId", "endpointHash");
