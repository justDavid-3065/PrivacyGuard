
import { describe, it, expect, beforeEach } from 'vitest';
import { storage } from '../../server/storage';
import { testUsers, cleanDatabase, seedTestUsers } from '../setup';

describe('Privacy Compliance Integration Tests', () => {
  beforeEach(async () => {
    await cleanDatabase();
    await seedTestUsers();
  });

  describe('Privacy Notice Management', () => {
    it('should create a privacy notice', async () => {
      const notice = {
        title: 'Privacy Policy',
        content: 'This is our comprehensive privacy policy...',
        version: 'v1.0',
        regulation: 'GDPR',
        isActive: true,
        effectiveDate: new Date(),
        userId: testUsers.owner.id
      };

      const created = await storage.createPrivacyNotice(notice);
      
      expect(created).toBeDefined();
      expect(created.title).toBe(notice.title);
      expect(created.regulation).toBe(notice.regulation);
      expect(created.isActive).toBe(true);
    });

    it('should manage multiple versions of privacy notices', async () => {
      // Create version 1
      await storage.createPrivacyNotice({
        title: 'Privacy Policy',
        content: 'Version 1 content',
        version: 'v1.0',
        regulation: 'GDPR',
        isActive: false,
        userId: testUsers.owner.id
      });

      // Create version 2 (active)
      await storage.createPrivacyNotice({
        title: 'Privacy Policy',
        content: 'Version 2 content',
        version: 'v2.0',
        regulation: 'GDPR',
        isActive: true,
        userId: testUsers.owner.id
      });

      const notices = await storage.getPrivacyNotices(testUsers.owner.id);
      
      expect(notices).toHaveLength(2);
      
      const activeNotice = notices.find(n => n.isActive);
      expect(activeNotice?.version).toBe('v2.0');
    });

    it('should update privacy notice', async () => {
      const created = await storage.createPrivacyNotice({
        title: 'Original Title',
        content: 'Original content',
        version: 'v1.0',
        regulation: 'GDPR',
        userId: testUsers.owner.id
      });

      const updated = await storage.updatePrivacyNotice(created.id, {
        title: 'Updated Title',
        isActive: true
      });

      expect(updated.title).toBe('Updated Title');
      expect(updated.isActive).toBe(true);
    });
  });

  describe('Incident Management', () => {
    it('should create a security incident', async () => {
      const incident = {
        title: 'Data Breach',
        description: 'Unauthorized access to customer data',
        severity: 'high' as const,
        discoveredAt: new Date(),
        affectedRecords: 1000,
        notificationRequired: true,
        userId: testUsers.owner.id
      };

      const created = await storage.createIncident(incident);
      
      expect(created).toBeDefined();
      expect(created.title).toBe(incident.title);
      expect(created.severity).toBe(incident.severity);
      expect(created.status).toBe('open');
    });

    it('should track incident resolution', async () => {
      const created = await storage.createIncident({
        title: 'Test Incident',
        description: 'Test description',
        severity: 'medium' as const,
        discoveredAt: new Date(),
        userId: testUsers.owner.id
      });

      const resolvedAt = new Date();
      const updated = await storage.updateIncident(created.id, {
        status: 'resolved',
        resolvedAt: resolvedAt,
        steps: 'Investigation completed, issue resolved'
      });

      expect(updated.status).toBe('resolved');
      expect(updated.resolvedAt).toEqual(resolvedAt);
      expect(updated.steps).toBe('Investigation completed, issue resolved');
    });

    it('should assign incidents to team members', async () => {
      const created = await storage.createIncident({
        title: 'Assigned Incident',
        description: 'Test description',
        severity: 'low' as const,
        discoveredAt: new Date(),
        userId: testUsers.owner.id
      });

      const updated = await storage.updateIncident(created.id, {
        assignedTo: testUsers.admin.id,
        status: 'investigating'
      });

      expect(updated.assignedTo).toBe(testUsers.admin.id);
      expect(updated.status).toBe('investigating');
    });

    it('should filter incidents by severity', async () => {
      // Create incidents with different severities
      await storage.createIncident({
        title: 'Critical Issue',
        description: 'Critical incident',
        severity: 'critical' as const,
        discoveredAt: new Date(),
        userId: testUsers.owner.id
      });

      await storage.createIncident({
        title: 'Low Issue',
        description: 'Low severity incident',
        severity: 'low' as const,
        discoveredAt: new Date(),
        userId: testUsers.owner.id
      });

      const allIncidents = await storage.getIncidents(testUsers.owner.id);
      expect(allIncidents).toHaveLength(2);

      const criticalIncidents = allIncidents.filter(i => i.severity === 'critical');
      expect(criticalIncidents).toHaveLength(1);
      expect(criticalIncidents[0].title).toBe('Critical Issue');
    });
  });

  describe('Comprehensive GDPR Compliance Workflow', () => {
    it('should handle complete GDPR compliance scenario', async () => {
      // 1. Create data types
      const personalData = await storage.createDataType({
        name: 'Personal Information',
        description: 'Name, email, phone',
        category: 'personal',
        purpose: 'Service delivery',
        source: 'Registration form',
        retention: '7 years',
        legalBasis: 'Contract',
        userId: testUsers.owner.id
      });

      const marketingData = await storage.createDataType({
        name: 'Marketing Preferences',
        description: 'Email marketing consent',
        category: 'personal',
        purpose: 'Marketing communications',
        source: 'Marketing form',
        retention: '2 years',
        legalBasis: 'Consent',
        userId: testUsers.owner.id
      });

      // 2. Record consent
      const consent = await storage.createConsentRecord({
        subjectEmail: 'john.doe@example.com',
        subjectName: 'John Doe',
        consentType: 'marketing',
        status: 'granted',
        method: 'website',
        policyVersion: 'v1.0',
        userId: testUsers.owner.id
      });

      // 3. Process DSAR request
      const dueDate = new Date();
      dueDate.setDate(dueDate.getDate() + 30);

      const dsarRequest = await storage.createDsarRequest({
        subjectEmail: 'john.doe@example.com',
        subjectName: 'John Doe',
        requestType: 'access',
        description: 'Request for all personal data',
        dueDate,
        userId: testUsers.owner.id
      });

      // 4. Assign and process DSAR
      await storage.updateDsarRequest(dsarRequest.id, {
        status: 'in_progress',
        assignedTo: testUsers.admin.id,
        notes: 'Collecting data from all systems'
      });

      // 5. Create privacy notice
      const privacyNotice = await storage.createPrivacyNotice({
        title: 'GDPR Privacy Policy',
        content: 'We collect and process personal data...',
        version: 'v1.0',
        regulation: 'GDPR',
        isActive: true,
        effectiveDate: new Date(),
        userId: testUsers.owner.id
      });

      // Verify complete workflow
      const dataTypes = await storage.getDataTypes(testUsers.owner.id);
      const consents = await storage.getConsentRecords(testUsers.owner.id);
      const dsars = await storage.getDsarRequests(testUsers.owner.id);
      const notices = await storage.getPrivacyNotices(testUsers.owner.id);

      expect(dataTypes).toHaveLength(2);
      expect(consents).toHaveLength(1);
      expect(dsars).toHaveLength(1);
      expect(notices).toHaveLength(1);

      // Verify data relationships
      expect(dsars[0].status).toBe('in_progress');
      expect(dsars[0].assignedTo).toBe(testUsers.admin.id);
      expect(consents[0].subjectEmail).toBe('john.doe@example.com');
      expect(notices[0].isActive).toBe(true);
    });
  });
});
