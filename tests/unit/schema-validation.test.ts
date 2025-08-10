
import { describe, it, expect } from 'vitest';
import {
  insertDataTypeSchema,
  insertConsentRecordSchema,
  insertDsarRequestSchema,
  insertPrivacyNoticeSchema,
  insertIncidentSchema,
  insertDomainSchema,
  insertAlertSettingsSchema
} from '../../shared/schema';

describe('Schema Validation Tests', () => {
  describe('Data Type Schema', () => {
    it('should validate valid data type', () => {
      const validData = {
        name: 'Email Address',
        category: 'personal',
        purpose: 'Communication',
        source: 'Registration form',
        userId: 'user-123'
      };

      const result = insertDataTypeSchema.safeParse(validData);
      expect(result.success).toBe(true);
    });

    it('should reject invalid data type', () => {
      const invalidData = {
        name: '', // Empty name
        category: 'personal',
        // Missing required fields
      };

      const result = insertDataTypeSchema.safeParse(invalidData);
      expect(result.success).toBe(false);
    });
  });

  describe('Consent Record Schema', () => {
    it('should validate valid consent record', () => {
      const validData = {
        subjectEmail: 'test@example.com',
        consentType: 'marketing',
        status: 'granted',
        method: 'website',
        userId: 'user-123'
      };

      const result = insertConsentRecordSchema.safeParse(validData);
      expect(result.success).toBe(true);
    });

    it('should reject invalid email', () => {
      const invalidData = {
        subjectEmail: 'invalid-email',
        consentType: 'marketing',
        status: 'granted',
        method: 'website',
        userId: 'user-123'
      };

      const result = insertConsentRecordSchema.safeParse(invalidData);
      expect(result.success).toBe(false);
    });
  });

  describe('DSAR Request Schema', () => {
    it('should validate valid DSAR request', () => {
      const validData = {
        subjectEmail: 'test@example.com',
        requestType: 'access',
        dueDate: new Date(),
        userId: 'user-123'
      };

      const result = insertDsarRequestSchema.safeParse(validData);
      expect(result.success).toBe(true);
    });

    it('should reject invalid request type', () => {
      const invalidData = {
        subjectEmail: 'test@example.com',
        requestType: 'invalid-type',
        dueDate: new Date(),
        userId: 'user-123'
      };

      const result = insertDsarRequestSchema.safeParse(invalidData);
      expect(result.success).toBe(false);
    });
  });

  describe('Privacy Notice Schema', () => {
    it('should validate valid privacy notice', () => {
      const validData = {
        title: 'Privacy Policy',
        content: 'This is our privacy policy...',
        version: 'v1.0',
        regulation: 'GDPR',
        userId: 'user-123'
      };

      const result = insertPrivacyNoticeSchema.safeParse(validData);
      expect(result.success).toBe(true);
    });

    it('should reject empty content', () => {
      const invalidData = {
        title: 'Privacy Policy',
        content: '', // Empty content
        version: 'v1.0',
        regulation: 'GDPR',
        userId: 'user-123'
      };

      const result = insertPrivacyNoticeSchema.safeParse(invalidData);
      expect(result.success).toBe(false);
    });
  });

  describe('Incident Schema', () => {
    it('should validate valid incident', () => {
      const validData = {
        title: 'Security Incident',
        description: 'Unauthorized access detected',
        severity: 'high',
        discoveredAt: new Date(),
        userId: 'user-123'
      };

      const result = insertIncidentSchema.safeParse(validData);
      expect(result.success).toBe(true);
    });

    it('should reject invalid severity', () => {
      const invalidData = {
        title: 'Security Incident',
        description: 'Unauthorized access detected',
        severity: 'invalid-severity',
        discoveredAt: new Date(),
        userId: 'user-123'
      };

      const result = insertIncidentSchema.safeParse(invalidData);
      expect(result.success).toBe(false);
    });
  });

  describe('Domain Schema', () => {
    it('should validate valid domain', () => {
      const validData = {
        name: 'example.com',
        userId: 'user-123'
      };

      const result = insertDomainSchema.safeParse(validData);
      expect(result.success).toBe(true);
    });

    it('should reject empty domain name', () => {
      const invalidData = {
        name: '',
        userId: 'user-123'
      };

      const result = insertDomainSchema.safeParse(invalidData);
      expect(result.success).toBe(false);
    });
  });

  describe('Alert Settings Schema', () => {
    it('should validate valid alert settings', () => {
      const validData = {
        email: 'alerts@example.com',
        emailEnabled: true,
        smsEnabled: false,
        userId: 'user-123'
      };

      const result = insertAlertSettingsSchema.safeParse(validData);
      expect(result.success).toBe(true);
    });

    it('should reject invalid email format', () => {
      const invalidData = {
        email: 'invalid-email-format',
        emailEnabled: true,
        userId: 'user-123'
      };

      const result = insertAlertSettingsSchema.safeParse(invalidData);
      expect(result.success).toBe(false);
    });
  });
});
