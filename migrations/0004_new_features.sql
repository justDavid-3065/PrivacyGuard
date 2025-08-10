
-- New features migration: accessibility scanning, subscriptions, webhooks, audit logs, integrations

-- Accessibility scans table
CREATE TABLE IF NOT EXISTS "accessibility_scans" (
  "id" VARCHAR PRIMARY KEY DEFAULT gen_random_uuid(),
  "user_id" VARCHAR NOT NULL REFERENCES "users"("id") ON DELETE CASCADE,
  "url" TEXT NOT NULL,
  "score" INTEGER NOT NULL,
  "issues" JSONB,
  "suggestions" JSONB,
  "scanned_at" TIMESTAMP DEFAULT NOW(),
  "created_at" TIMESTAMP DEFAULT NOW()
);

-- Subscriptions table
CREATE TABLE IF NOT EXISTS "subscriptions" (
  "id" VARCHAR PRIMARY KEY DEFAULT gen_random_uuid(),
  "user_id" VARCHAR NOT NULL REFERENCES "users"("id") ON DELETE CASCADE,
  "stripe_customer_id" TEXT,
  "stripe_subscription_id" TEXT UNIQUE,
  "plan_id" TEXT NOT NULL,
  "status" TEXT NOT NULL DEFAULT 'active',
  "current_period_start" TIMESTAMP,
  "current_period_end" TIMESTAMP,
  "created_at" TIMESTAMP DEFAULT NOW(),
  "updated_at" TIMESTAMP DEFAULT NOW()
);

-- Webhooks table
CREATE TABLE IF NOT EXISTS "webhooks" (
  "id" VARCHAR PRIMARY KEY DEFAULT gen_random_uuid(),
  "user_id" VARCHAR NOT NULL REFERENCES "users"("id") ON DELETE CASCADE,
  "url" TEXT NOT NULL,
  "secret" TEXT NOT NULL,
  "events" JSONB NOT NULL,
  "active" BOOLEAN DEFAULT true,
  "created_at" TIMESTAMP DEFAULT NOW(),
  "updated_at" TIMESTAMP DEFAULT NOW()
);

-- Webhook deliveries table
CREATE TABLE IF NOT EXISTS "webhook_deliveries" (
  "id" VARCHAR PRIMARY KEY DEFAULT gen_random_uuid(),
  "webhook_id" VARCHAR NOT NULL REFERENCES "webhooks"("id") ON DELETE CASCADE,
  "event_type" TEXT NOT NULL,
  "status" TEXT NOT NULL,
  "response_code" INTEGER,
  "error" TEXT,
  "delivered_at" TIMESTAMP DEFAULT NOW()
);

-- Audit events table
CREATE TABLE IF NOT EXISTS "audit_events" (
  "id" VARCHAR PRIMARY KEY DEFAULT gen_random_uuid(),
  "user_id" VARCHAR NOT NULL REFERENCES "users"("id") ON DELETE CASCADE,
  "action" TEXT NOT NULL,
  "resource" TEXT NOT NULL,
  "resource_id" VARCHAR,
  "details" JSONB,
  "user_agent" TEXT,
  "ip_address" TEXT,
  "severity" TEXT NOT NULL DEFAULT 'low',
  "timestamp" TIMESTAMP DEFAULT NOW()
);

-- Integrations table
CREATE TABLE IF NOT EXISTS "integrations" (
  "id" VARCHAR PRIMARY KEY DEFAULT gen_random_uuid(),
  "user_id" VARCHAR NOT NULL REFERENCES "users"("id") ON DELETE CASCADE,
  "name" TEXT NOT NULL,
  "type" TEXT NOT NULL,
  "config" JSONB NOT NULL,
  "status" TEXT NOT NULL DEFAULT 'active',
  "last_sync" TIMESTAMP,
  "created_at" TIMESTAMP DEFAULT NOW(),
  "updated_at" TIMESTAMP DEFAULT NOW()
);

-- SSL certificate monitoring regions table
CREATE TABLE IF NOT EXISTS "ssl_region_checks" (
  "id" VARCHAR PRIMARY KEY DEFAULT gen_random_uuid(),
  "certificate_id" VARCHAR NOT NULL REFERENCES "ssl_certificates"("id") ON DELETE CASCADE,
  "region" TEXT NOT NULL,
  "status" TEXT NOT NULL,
  "latency" INTEGER,
  "error" TEXT,
  "checked_at" TIMESTAMP DEFAULT NOW()
);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS "idx_accessibility_scans_user_id" ON "accessibility_scans" ("user_id");
CREATE INDEX IF NOT EXISTS "idx_subscriptions_user_id" ON "subscriptions" ("user_id");
CREATE INDEX IF NOT EXISTS "idx_subscriptions_stripe_id" ON "subscriptions" ("stripe_subscription_id");
CREATE INDEX IF NOT EXISTS "idx_webhooks_user_id" ON "webhooks" ("user_id");
CREATE INDEX IF NOT EXISTS "idx_webhook_deliveries_webhook_id" ON "webhook_deliveries" ("webhook_id");
CREATE INDEX IF NOT EXISTS "idx_audit_events_user_id" ON "audit_events" ("user_id");
CREATE INDEX IF NOT EXISTS "idx_audit_events_timestamp" ON "audit_events" ("timestamp");
CREATE INDEX IF NOT EXISTS "idx_integrations_user_id" ON "integrations" ("user_id");
CREATE INDEX IF NOT EXISTS "idx_ssl_region_checks_cert_id" ON "ssl_region_checks" ("certificate_id");
