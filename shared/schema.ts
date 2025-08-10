import { sql } from 'drizzle-orm';
import { relations } from 'drizzle-orm';
import {
  boolean,
  index,
  integer,
  jsonb,
  pgEnum,
  pgTable,
  text,
  timestamp,
  varchar,
} from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

// Session storage table (required for Replit Auth)
export const sessions = pgTable(
  "sessions",
  {
    sid: varchar("sid").primaryKey(),
    sess: jsonb("sess").notNull(),
    expire: timestamp("expire").notNull(),
  },
  (table) => [index("IDX_session_expire").on(table.expire)],
);

// User storage table (required for Replit Auth)
export const users = pgTable("users", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  email: varchar("email").unique(),
  firstName: varchar("first_name"),
  lastName: varchar("last_name"),
  profileImageUrl: varchar("profile_image_url"),
  role: varchar("role").notNull().default("viewer"), // owner, admin, viewer
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Data inventory for tracking data types collected
export const dataTypes = pgTable("data_types", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  name: text("name").notNull(),
  description: text("description"),
  category: text("category").notNull(), // personal, sensitive, financial, etc.
  purpose: text("purpose").notNull(),
  source: text("source").notNull(),
  retention: text("retention"), // retention period
  legalBasis: text("legal_basis"), // GDPR legal basis
  userId: varchar("user_id").references(() => users.id).notNull(),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Consent tracking
export const consentRecords = pgTable("consent_records", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  subjectEmail: text("subject_email").notNull(),
  subjectName: text("subject_name"),
  consentType: text("consent_type").notNull(), // marketing, analytics, necessary
  status: text("status").notNull(), // granted, withdrawn, pending
  timestamp: timestamp("timestamp").defaultNow(),
  policyVersion: text("policy_version"),
  ipAddress: text("ip_address"),
  userAgent: text("user_agent"),
  method: text("method").notNull(), // website, api, manual
  userId: varchar("user_id").references(() => users.id).notNull(),
  createdAt: timestamp("created_at").defaultNow(),
});

// DSAR (Data Subject Access Request) management
export const dsarRequestStatus = pgEnum("dsar_status", [
  "submitted",
  "in_progress", 
  "completed",
  "rejected"
]);

export const dsarRequests = pgTable("dsar_requests", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  subjectEmail: text("subject_email").notNull(),
  subjectName: text("subject_name"),
  requestType: text("request_type").notNull(), // access, deletion, rectification, portability
  status: dsarRequestStatus("status").default("submitted"),
  description: text("description"),
  submittedAt: timestamp("submitted_at").defaultNow(),
  dueDate: timestamp("due_date").notNull(),
  completedAt: timestamp("completed_at"),
  assignedTo: varchar("assigned_to").references(() => users.id),
  notes: text("notes"),
  userId: varchar("user_id").references(() => users.id).notNull(),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Privacy notices
export const privacyNotices = pgTable("privacy_notices", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  title: text("title").notNull(),
  content: text("content").notNull(),
  version: text("version").notNull(),
  regulation: text("regulation").notNull(), // GDPR, CCPA, UK_DPA
  isActive: boolean("is_active").default(false),
  effectiveDate: timestamp("effective_date"),
  userId: varchar("user_id").references(() => users.id).notNull(),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Incident and breach logbook
export const incidentSeverity = pgEnum("incident_severity", ["low", "medium", "high", "critical"]);

export const incidents = pgTable("incidents", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  title: text("title").notNull(),
  description: text("description").notNull(),
  severity: incidentSeverity("severity").notNull(),
  status: text("status").notNull().default("open"), // open, investigating, resolved
  affectedRecords: integer("affected_records"),
  discoveredAt: timestamp("discovered_at").notNull(),
  reportedAt: timestamp("reported_at"),
  resolvedAt: timestamp("resolved_at"),
  notificationRequired: boolean("notification_required").default(false),
  notificationSent: boolean("notification_sent").default(false),
  steps: text("steps"), // JSON string of steps taken
  assignedTo: varchar("assigned_to").references(() => users.id),
  userId: varchar("user_id").references(() => users.id).notNull(),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// SSL Certificate monitoring
export const domains = pgTable("domains", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  name: text("name").notNull().unique(),
  isActive: boolean("is_active").default(true),
  userId: varchar("user_id").references(() => users.id).notNull(),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const sslCertificates = pgTable("ssl_certificates", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  domainId: varchar("domain_id").references(() => domains.id).notNull(),
  issuer: text("issuer"),
  subject: text("subject"),
  validFrom: timestamp("valid_from"),
  validTo: timestamp("valid_to"),
  isValid: boolean("is_valid").default(false),
  lastChecked: timestamp("last_checked").defaultNow(),
  error: text("error"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Alert settings
export const alertSettings = pgTable("alert_settings", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").references(() => users.id).notNull(),
  email: text("email"),
  smsNumber: text("sms_number"),
  slackWebhook: text("slack_webhook"),
  alertThresholds: text("alert_thresholds"), // JSON: {30: true, 15: true, 7: true, 1: true}
  emailEnabled: boolean("email_enabled").default(true),
  smsEnabled: boolean("sms_enabled").default(false),
  slackEnabled: boolean("slack_enabled").default(false),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Relations
export const usersRelations = relations(users, ({ many }) => ({
  dataTypes: many(dataTypes),
  consentRecords: many(consentRecords),
  dsarRequests: many(dsarRequests),
  privacyNotices: many(privacyNotices),
  incidents: many(incidents),
  domains: many(domains),
  assignedDsarRequests: many(dsarRequests, { relationName: "assignedTo" }),
  assignedIncidents: many(incidents, { relationName: "assignedTo" }),
}));

export const dataTypesRelations = relations(dataTypes, ({ one }) => ({
  user: one(users, {
    fields: [dataTypes.userId],
    references: [users.id],
  }),
}));

export const consentRecordsRelations = relations(consentRecords, ({ one }) => ({
  user: one(users, {
    fields: [consentRecords.userId],
    references: [users.id],
  }),
}));

export const dsarRequestsRelations = relations(dsarRequests, ({ one }) => ({
  user: one(users, {
    fields: [dsarRequests.userId],
    references: [users.id],
  }),
  assignedUser: one(users, {
    fields: [dsarRequests.assignedTo],
    references: [users.id],
    relationName: "assignedTo",
  }),
}));

export const privacyNoticesRelations = relations(privacyNotices, ({ one }) => ({
  user: one(users, {
    fields: [privacyNotices.userId],
    references: [users.id],
  }),
}));

export const incidentsRelations = relations(incidents, ({ one }) => ({
  user: one(users, {
    fields: [incidents.userId],
    references: [users.id],
  }),
  assignedUser: one(users, {
    fields: [incidents.assignedTo],
    references: [users.id],
    relationName: "assignedTo",
  }),
}));

export const domainsRelations = relations(domains, ({ one, many }) => ({
  user: one(users, {
    fields: [domains.userId],
    references: [users.id],
  }),
  sslCertificates: many(sslCertificates),
}));

export const sslCertificatesRelations = relations(sslCertificates, ({ one }) => ({
  domain: one(domains, {
    fields: [sslCertificates.domainId],
    references: [domains.id],
  }),
}));

// Insert schemas
export const insertUserSchema = createInsertSchema(users).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertDataTypeSchema = createInsertSchema(dataTypes).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertConsentRecordSchema = createInsertSchema(consentRecords).omit({
  id: true,
  createdAt: true,
});

export const insertDsarRequestSchema = createInsertSchema(dsarRequests).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertPrivacyNoticeSchema = createInsertSchema(privacyNotices).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertIncidentSchema = createInsertSchema(incidents).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertDomainSchema = createInsertSchema(domains).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertSslCertificateSchema = createInsertSchema(sslCertificates).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertAlertSettingsSchema = createInsertSchema(alertSettings).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

// Types
export type UpsertUser = typeof users.$inferInsert;
export type User = typeof users.$inferSelect;
export type InsertDataType = z.infer<typeof insertDataTypeSchema>;
export type DataType = typeof dataTypes.$inferSelect;
export type InsertConsentRecord = z.infer<typeof insertConsentRecordSchema>;
export type ConsentRecord = typeof consentRecords.$inferSelect;
export type InsertDsarRequest = z.infer<typeof insertDsarRequestSchema>;
export type DsarRequest = typeof dsarRequests.$inferSelect;
export type InsertPrivacyNotice = z.infer<typeof insertPrivacyNoticeSchema>;
export type PrivacyNotice = typeof privacyNotices.$inferSelect;
export type InsertIncident = z.infer<typeof insertIncidentSchema>;
export type Incident = typeof incidents.$inferSelect;
export type InsertDomain = z.infer<typeof insertDomainSchema>;
export type Domain = typeof domains.$inferSelect;
export type InsertSslCertificate = z.infer<typeof insertSslCertificateSchema>;
export type SslCertificate = typeof sslCertificates.$inferSelect;
export type InsertAlertSettings = z.infer<typeof insertAlertSettingsSchema>;
export type AlertSettings = typeof alertSettings.$inferSelect;
