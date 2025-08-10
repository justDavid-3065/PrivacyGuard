
import { describe, it, expect, beforeEach } from 'vitest';
import { storage } from '../../server/storage';
import { testUsers, cleanDatabase, seedTestUsers } from '../setup';

describe('Storage Layer Unit Tests', () => {
  beforeEach(async () => {
    await cleanDatabase();
    await seedTestUsers();
  });

  describe('User Operations', () => {
    it('should create a new user', async () => {
      const newUser = {
        email: 'newuser@test.com',
        firstName: 'New',
        lastName: 'User',
        role: 'viewer'
      };

      const createdUser = await storage.upsertUser(newUser);
      
      expect(createdUser).toBeDefined();
      expect(createdUser.email).toBe(newUser.email);
      expect(createdUser.firstName).toBe(newUser.firstName);
      expect(createdUser.role).toBe(newUser.role);
    });

    it('should get user by id', async () => {
      const user = await storage.getUser(testUsers.owner.id);
      
      expect(user).toBeDefined();
      expect(user?.email).toBe(testUsers.owner.email);
      expect(user?.role).toBe(testUsers.owner.role);
    });

    it('should return null for non-existent user', async () => {
      const user = await storage.getUser('non-existent-id');
      expect(user).toBeNull();
    });
  });

  describe('Data Type Operations', () => {
    it('should create a data type', async () => {
      const dataType = {
        name: 'Email Address',
        description: 'User email addresses',
        category: 'personal',
        purpose: 'Communication',
        source: 'Registration form',
        retention: '7 years',
        legalBasis: 'Contract',
        userId: testUsers.owner.id
      };

      const created = await storage.createDataType(dataType);
      
      expect(created).toBeDefined();
      expect(created.name).toBe(dataType.name);
      expect(created.category).toBe(dataType.category);
      expect(created.userId).toBe(dataType.userId);
    });

    it('should get data types for user', async () => {
      // First create a data type
      await storage.createDataType({
        name: 'Test Data',
        category: 'personal',
        purpose: 'Testing',
        source: 'Test',
        userId: testUsers.owner.id
      });

      const dataTypes = await storage.getDataTypes(testUsers.owner.id);
      
      expect(dataTypes).toHaveLength(1);
      expect(dataTypes[0].name).toBe('Test Data');
    });

    it('should update a data type', async () => {
      const created = await storage.createDataType({
        name: 'Original Name',
        category: 'personal',
        purpose: 'Testing',
        source: 'Test',
        userId: testUsers.owner.id
      });

      const updated = await storage.updateDataType(created.id, {
        name: 'Updated Name',
        category: 'sensitive'
      });

      expect(updated.name).toBe('Updated Name');
      expect(updated.category).toBe('sensitive');
    });

    it('should delete a data type', async () => {
      const created = await storage.createDataType({
        name: 'To Delete',
        category: 'personal',
        purpose: 'Testing',
        source: 'Test',
        userId: testUsers.owner.id
      });

      await storage.deleteDataType(created.id);
      
      const dataTypes = await storage.getDataTypes(testUsers.owner.id);
      expect(dataTypes).toHaveLength(0);
    });
  });

  describe('Consent Record Operations', () => {
    it('should create a consent record', async () => {
      const consent = {
        subjectEmail: 'john@example.com',
        subjectName: 'John Doe',
        consentType: 'marketing',
        status: 'granted',
        method: 'website',
        userId: testUsers.owner.id
      };

      const created = await storage.createConsentRecord(consent);
      
      expect(created).toBeDefined();
      expect(created.subjectEmail).toBe(consent.subjectEmail);
      expect(created.status).toBe(consent.status);
    });

    it('should get consent records for user', async () => {
      await storage.createConsentRecord({
        subjectEmail: 'test@example.com',
        consentType: 'marketing',
        status: 'granted',
        method: 'website',
        userId: testUsers.owner.id
      });

      const records = await storage.getConsentRecords(testUsers.owner.id);
      
      expect(records).toHaveLength(1);
      expect(records[0].subjectEmail).toBe('test@example.com');
    });

    it('should get consent by subject email', async () => {
      const email = 'subject@example.com';
      
      await storage.createConsentRecord({
        subjectEmail: email,
        consentType: 'marketing',
        status: 'granted',
        method: 'website',
        userId: testUsers.owner.id
      });

      const records = await storage.getConsentBySubject(email, testUsers.owner.id);
      
      expect(records).toHaveLength(1);
      expect(records[0].subjectEmail).toBe(email);
    });
  });

  describe('DSAR Request Operations', () => {
    it('should create a DSAR request', async () => {
      const dueDate = new Date();
      dueDate.setDate(dueDate.getDate() + 30);

      const dsarRequest = {
        subjectEmail: 'subject@example.com',
        subjectName: 'Subject Name',
        requestType: 'access',
        description: 'Data access request',
        dueDate,
        userId: testUsers.owner.id
      };

      const created = await storage.createDsarRequest(dsarRequest);
      
      expect(created).toBeDefined();
      expect(created.subjectEmail).toBe(dsarRequest.subjectEmail);
      expect(created.requestType).toBe(dsarRequest.requestType);
      expect(created.status).toBe('submitted');
    });

    it('should update DSAR request status', async () => {
      const dueDate = new Date();
      dueDate.setDate(dueDate.getDate() + 30);

      const created = await storage.createDsarRequest({
        subjectEmail: 'test@example.com',
        requestType: 'access',
        dueDate,
        userId: testUsers.owner.id
      });

      const updated = await storage.updateDsarRequest(created.id, {
        status: 'in_progress',
        assignedTo: testUsers.admin.id
      });

      expect(updated.status).toBe('in_progress');
      expect(updated.assignedTo).toBe(testUsers.admin.id);
    });
  });

  describe('Dashboard Statistics', () => {
    it('should calculate dashboard stats correctly', async () => {
      // Create test data
      await storage.createDataType({
        name: 'Test Data',
        category: 'personal',
        purpose: 'Testing',
        source: 'Test',
        userId: testUsers.owner.id
      });

      const dueDate = new Date();
      dueDate.setDate(dueDate.getDate() + 30);

      await storage.createDsarRequest({
        subjectEmail: 'test@example.com',
        requestType: 'access',
        dueDate,
        userId: testUsers.owner.id
      });

      await storage.createConsentRecord({
        subjectEmail: 'test@example.com',
        consentType: 'marketing',
        status: 'granted',
        method: 'website',
        userId: testUsers.owner.id
      });

      const stats = await storage.getDashboardStats(testUsers.owner.id);
      
      expect(stats.totalDataTypes).toBe('1');
      expect(stats.openDsars).toBe('1');
      expect(stats.totalConsents).toBe('1');
    });
  });
});
