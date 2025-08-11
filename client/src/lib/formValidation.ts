
import { z } from "zod";

const nonEmptyString = z.string().min(1, "This field is required").refine(val => val !== "", {
  message: "Value cannot be empty"
});

export const dataInventorySchema = z.object({
  name: nonEmptyString,
  category: nonEmptyString,
  legalBasis: nonEmptyString,
  purpose: nonEmptyString,
  retentionPeriod: nonEmptyString,
  dataSource: nonEmptyString,
});

export const consentTrackerSchema = z.object({
  consentType: nonEmptyString,
  status: nonEmptyString,
  purpose: nonEmptyString,
  dateGiven: z.string().optional(),
});

export const dsarSchema = z.object({
  requestType: nonEmptyString,
  status: nonEmptyString,
  priority: nonEmptyString,
  subjectEmail: z.string().email("Invalid email address"),
  subjectName: z.string().optional(),
  description: nonEmptyString,
});

export const privacyNoticeSchema = z.object({
  title: nonEmptyString,
  version: nonEmptyString,
  status: nonEmptyString,
  effectiveDate: nonEmptyString,
  content: nonEmptyString,
});

export const incidentLogbookSchema = z.object({
  title: nonEmptyString,
  severity: nonEmptyString,
  status: nonEmptyString,
  description: nonEmptyString,
  affectedDataTypes: nonEmptyString,
});

export const sslCertificateSchema = z.object({
  domain: nonEmptyString,
  status: nonEmptyString,
  issuer: nonEmptyString,
  expiryDate: nonEmptyString,
});

export const teamMemberSchema = z.object({
  name: nonEmptyString,
  email: z.string().email("Invalid email address"),
  role: nonEmptyString,
  department: nonEmptyString,
});
