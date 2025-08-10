
-- Initial schema migration for Privacy Guard
-- This creates all the core tables for the application

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Sessions table (required for Replit Auth)
CREATE TABLE IF NOT EXISTS "sessions" (
  "sid" VARCHAR PRIMARY KEY,
  "sess" JSONB NOT NULL,
  "expire" TIMESTAMP NOT NULL
);

CREATE INDEX IF NOT EXISTS "IDX_session_expire" ON "sessions" ("expire");

-- Users table
CREATE TABLE IF NOT EXISTS "users" (
  "id" VARCHAR PRIMARY KEY DEFAULT gen_random_uuid(),
  "email" VARCHAR UNIQUE,
  "first_name" VARCHAR,
  "last_name" VARCHAR,
  "profile_image_url" VARCHAR,
  "role" VARCHAR NOT NULL DEFAULT 'viewer',
  "created_at" TIMESTAMP DEFAULT NOW(),
  "updated_at" TIMESTAMP DEFAULT NOW()
);

-- Data types table for data inventory
CREATE TABLE IF NOT EXISTS "data_types" (
  "id" VARCHAR PRIMARY KEY DEFAULT gen_random_uuid(),
  "name" TEXT NOT NULL,
  "description" TEXT,
  "category" TEXT NOT NULL,
  "purpose" TEXT NOT NULL,
  "source" TEXT NOT NULL,
  "retention" TEXT,
  "legal_basis" TEXT,
  "user_id" VARCHAR NOT NULL REFERENCES "users"("id") ON DELETE CASCADE,
  "created_at" TIMESTAMP DEFAULT NOW(),
  "updated_at" TIMESTAMP DEFAULT NOW()
);

-- Consent records table
CREATE TABLE IF NOT EXISTS "consent_records" (
  "id" VARCHAR PRIMARY KEY DEFAULT gen_random_uuid(),
  "subject_email" TEXT NOT NULL,
  "subject_name" TEXT,
  "consent_type" TEXT NOT NULL,
  "status" TEXT NOT NULL,
  "timestamp" TIMESTAMP DEFAULT NOW(),
  "policy_version" TEXT,
  "ip_address" TEXT,
  "user_agent" TEXT,
  "method" TEXT NOT NULL,
  "user_id" VARCHAR NOT NULL REFERENCES "users"("id") ON DELETE CASCADE,
  "created_at" TIMESTAMP DEFAULT NOW()
);

-- DSAR status enum
CREATE TYPE "dsar_status" AS ENUM ('submitted', 'in_progress', 'completed', 'rejected');

-- DSAR requests table
CREATE TABLE IF NOT EXISTS "dsar_requests" (
  "id" VARCHAR PRIMARY KEY DEFAULT gen_random_uuid(),
  "subject_email" TEXT NOT NULL,
  "subject_name" TEXT,
  "request_type" TEXT NOT NULL,
  "status" "dsar_status" DEFAULT 'submitted',
  "description" TEXT,
  "submitted_at" TIMESTAMP DEFAULT NOW(),
  "due_date" TIMESTAMP NOT NULL,
  "completed_at" TIMESTAMP,
  "assigned_to" VARCHAR REFERENCES "users"("id"),
  "notes" TEXT,
  "user_id" VARCHAR NOT NULL REFERENCES "users"("id") ON DELETE CASCADE,
  "created_at" TIMESTAMP DEFAULT NOW(),
  "updated_at" TIMESTAMP DEFAULT NOW()
);

-- Privacy notices table
CREATE TABLE IF NOT EXISTS "privacy_notices" (
  "id" VARCHAR PRIMARY KEY DEFAULT gen_random_uuid(),
  "title" TEXT NOT NULL,
  "content" TEXT NOT NULL,
  "version" TEXT NOT NULL,
  "regulation" TEXT NOT NULL,
  "is_active" BOOLEAN DEFAULT FALSE,
  "effective_date" TIMESTAMP,
  "user_id" VARCHAR NOT NULL REFERENCES "users"("id") ON DELETE CASCADE,
  "created_at" TIMESTAMP DEFAULT NOW(),
  "updated_at" TIMESTAMP DEFAULT NOW()
);

-- Incident severity enum
CREATE TYPE "incident_severity" AS ENUM ('low', 'medium', 'high', 'critical');

-- Incidents table
CREATE TABLE IF NOT EXISTS "incidents" (
  "id" VARCHAR PRIMARY KEY DEFAULT gen_random_uuid(),
  "title" TEXT NOT NULL,
  "description" TEXT NOT NULL,
  "severity" "incident_severity" NOT NULL,
  "status" TEXT NOT NULL DEFAULT 'open',
  "affected_records" INTEGER,
  "discovered_at" TIMESTAMP NOT NULL,
  "reported_at" TIMESTAMP,
  "resolved_at" TIMESTAMP,
  "notification_required" BOOLEAN DEFAULT FALSE,
  "notification_sent" BOOLEAN DEFAULT FALSE,
  "steps" TEXT,
  "assigned_to" VARCHAR REFERENCES "users"("id"),
  "user_id" VARCHAR NOT NULL REFERENCES "users"("id") ON DELETE CASCADE,
  "created_at" TIMESTAMP DEFAULT NOW(),
  "updated_at" TIMESTAMP DEFAULT NOW()
);

-- Domains table
CREATE TABLE IF NOT EXISTS "domains" (
  "id" VARCHAR PRIMARY KEY DEFAULT gen_random_uuid(),
  "name" TEXT NOT NULL UNIQUE,
  "is_active" BOOLEAN DEFAULT TRUE,
  "user_id" VARCHAR NOT NULL REFERENCES "users"("id") ON DELETE CASCADE,
  "created_at" TIMESTAMP DEFAULT NOW(),
  "updated_at" TIMESTAMP DEFAULT NOW()
);

-- SSL certificates table
CREATE TABLE IF NOT EXISTS "ssl_certificates" (
  "id" VARCHAR PRIMARY KEY DEFAULT gen_random_uuid(),
  "domain_id" VARCHAR NOT NULL REFERENCES "domains"("id") ON DELETE CASCADE,
  "issuer" TEXT,
  "subject" TEXT,
  "valid_from" TIMESTAMP,
  "valid_to" TIMESTAMP,
  "is_valid" BOOLEAN DEFAULT FALSE,
  "last_checked" TIMESTAMP DEFAULT NOW(),
  "error" TEXT,
  "created_at" TIMESTAMP DEFAULT NOW(),
  "updated_at" TIMESTAMP DEFAULT NOW()
);

-- Alert settings table
CREATE TABLE IF NOT EXISTS "alert_settings" (
  "id" VARCHAR PRIMARY KEY DEFAULT gen_random_uuid(),
  "user_id" VARCHAR NOT NULL REFERENCES "users"("id") ON DELETE CASCADE,
  "email" TEXT,
  "sms_number" TEXT,
  "slack_webhook" TEXT,
  "alert_thresholds" TEXT,
  "email_enabled" BOOLEAN DEFAULT TRUE,
  "sms_enabled" BOOLEAN DEFAULT FALSE,
  "slack_enabled" BOOLEAN DEFAULT FALSE,
  "created_at" TIMESTAMP DEFAULT NOW(),
  "updated_at" TIMESTAMP DEFAULT NOW()
);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS "idx_data_types_user_id" ON "data_types" ("user_id");
CREATE INDEX IF NOT EXISTS "idx_consent_records_user_id" ON "consent_records" ("user_id");
CREATE INDEX IF NOT EXISTS "idx_consent_records_subject_email" ON "consent_records" ("subject_email");
CREATE INDEX IF NOT EXISTS "idx_dsar_requests_user_id" ON "dsar_requests" ("user_id");
CREATE INDEX IF NOT EXISTS "idx_dsar_requests_status" ON "dsar_requests" ("status");
CREATE INDEX IF NOT EXISTS "idx_privacy_notices_user_id" ON "privacy_notices" ("user_id");
CREATE INDEX IF NOT EXISTS "idx_incidents_user_id" ON "incidents" ("user_id");
CREATE INDEX IF NOT EXISTS "idx_incidents_severity" ON "incidents" ("severity");
CREATE INDEX IF NOT EXISTS "idx_domains_user_id" ON "domains" ("user_id");
CREATE INDEX IF NOT EXISTS "idx_ssl_certificates_domain_id" ON "ssl_certificates" ("domain_id");
CREATE INDEX IF NOT EXISTS "idx_alert_settings_user_id" ON "alert_settings" ("user_id");
