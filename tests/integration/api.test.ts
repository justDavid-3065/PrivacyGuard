
import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import request from 'supertest';
import express from 'express';
import { registerRoutes } from '../../server/routes';
import { testUsers, cleanDatabase, seedTestUsers } from '../setup';

describe('API Integration Tests', () => {
  let app: express.Application;
  let server: any;

  beforeAll(async () => {
    app = express();
    app.use(express.json());
    
    // Mock authentication middleware for testing
    app.use((req: any, res, next) => {
      req.user = {
        claims: {
          sub: testUsers.owner.id,
          email: testUsers.owner.email
        }
      };
      next();
    });

    server = await registerRoutes(app);
  });

  afterAll(async () => {
    if (server) {
      server.close();
    }
  });

  describe('Data Types API', () => {
    it('should create a new data type', async () => {
      const dataType = {
        name: 'Test Data Type',
        description: 'Test description',
        category: 'personal',
        purpose: 'Testing',
        source: 'API Test',
        retention: '1 year',
        legalBasis: 'Consent'
      };

      const response = await request(app)
        .post('/api/data-types')
        .send(dataType)
        .expect(200);

      expect(response.body).toMatchObject({
        name: dataType.name,
        category: dataType.category,
        purpose: dataType.purpose
      });
    });

    it('should get all data types for user', async () => {
      // First create a data type
      await request(app)
        .post('/api/data-types')
        .send({
          name: 'Test Data',
          category: 'personal',
          purpose: 'Testing',
          source: 'Test'
        });

      const response = await request(app)
        .get('/api/data-types')
        .expect(200);

      expect(Array.isArray(response.body)).toBe(true);
      expect(response.body.length).toBeGreaterThan(0);
    });

    it('should update a data type', async () => {
      // Create a data type first
      const createResponse = await request(app)
        .post('/api/data-types')
        .send({
          name: 'Original Name',
          category: 'personal',
          purpose: 'Testing',
          source: 'Test'
        });

      const dataTypeId = createResponse.body.id;

      const updateData = {
        name: 'Updated Name',
        category: 'sensitive'
      };

      const response = await request(app)
        .put(`/api/data-types/${dataTypeId}`)
        .send(updateData)
        .expect(200);

      expect(response.body.name).toBe(updateData.name);
      expect(response.body.category).toBe(updateData.category);
    });

    it('should delete a data type', async () => {
      // Create a data type first
      const createResponse = await request(app)
        .post('/api/data-types')
        .send({
          name: 'To Delete',
          category: 'personal',
          purpose: 'Testing',
          source: 'Test'
        });

      const dataTypeId = createResponse.body.id;

      await request(app)
        .delete(`/api/data-types/${dataTypeId}`)
        .expect(200);

      // Verify it's deleted
      const getResponse = await request(app)
        .get('/api/data-types')
        .expect(200);

      const exists = getResponse.body.find((dt: any) => dt.id === dataTypeId);
      expect(exists).toBeUndefined();
    });
  });

  describe('Consent Records API', () => {
    it('should create a consent record', async () => {
      const consent = {
        subjectEmail: 'john@example.com',
        subjectName: 'John Doe',
        consentType: 'marketing',
        status: 'granted',
        method: 'website',
        policyVersion: 'v1.0'
      };

      const response = await request(app)
        .post('/api/consent-records')
        .send(consent)
        .expect(200);

      expect(response.body).toMatchObject({
        subjectEmail: consent.subjectEmail,
        consentType: consent.consentType,
        status: consent.status
      });
    });

    it('should get all consent records for user', async () => {
      // Create a consent record first
      await request(app)
        .post('/api/consent-records')
        .send({
          subjectEmail: 'test@example.com',
          consentType: 'analytics',
          status: 'granted',
          method: 'website'
        });

      const response = await request(app)
        .get('/api/consent-records')
        .expect(200);

      expect(Array.isArray(response.body)).toBe(true);
      expect(response.body.length).toBeGreaterThan(0);
    });
  });

  describe('DSAR Requests API', () => {
    it('should create a DSAR request', async () => {
      const dueDate = new Date();
      dueDate.setDate(dueDate.getDate() + 30);

      const dsarRequest = {
        subjectEmail: 'subject@example.com',
        subjectName: 'Subject Name',
        requestType: 'access',
        description: 'Data access request',
        dueDate: dueDate.toISOString()
      };

      const response = await request(app)
        .post('/api/dsar-requests')
        .send(dsarRequest)
        .expect(200);

      expect(response.body).toMatchObject({
        subjectEmail: dsarRequest.subjectEmail,
        requestType: dsarRequest.requestType,
        status: 'submitted'
      });
    });

    it('should get all DSAR requests for user', async () => {
      const dueDate = new Date();
      dueDate.setDate(dueDate.getDate() + 30);

      // Create a DSAR request first
      await request(app)
        .post('/api/dsar-requests')
        .send({
          subjectEmail: 'test@example.com',
          requestType: 'deletion',
          dueDate: dueDate.toISOString()
        });

      const response = await request(app)
        .get('/api/dsar-requests')
        .expect(200);

      expect(Array.isArray(response.body)).toBe(true);
      expect(response.body.length).toBeGreaterThan(0);
    });

    it('should update DSAR request', async () => {
      const dueDate = new Date();
      dueDate.setDate(dueDate.getDate() + 30);

      // Create a DSAR request first
      const createResponse = await request(app)
        .post('/api/dsar-requests')
        .send({
          subjectEmail: 'test@example.com',
          requestType: 'access',
          dueDate: dueDate.toISOString()
        });

      const requestId = createResponse.body.id;

      const updateData = {
        status: 'in_progress',
        notes: 'Started processing'
      };

      const response = await request(app)
        .put(`/api/dsar-requests/${requestId}`)
        .send(updateData)
        .expect(200);

      expect(response.body.status).toBe(updateData.status);
      expect(response.body.notes).toBe(updateData.notes);
    });
  });

  describe('Dashboard API', () => {
    it('should get dashboard statistics', async () => {
      const response = await request(app)
        .get('/api/dashboard/stats')
        .expect(200);

      expect(response.body).toHaveProperty('totalDataTypes');
      expect(response.body).toHaveProperty('openDsars');
      expect(response.body).toHaveProperty('totalConsents');
      expect(response.body).toHaveProperty('totalIncidents');
      expect(response.body).toHaveProperty('activeDomains');
    });
  });

  describe('Error Handling', () => {
    it('should handle validation errors', async () => {
      const invalidDataType = {
        name: '', // Invalid: empty name
        category: 'personal'
        // Missing required fields
      };

      const response = await request(app)
        .post('/api/data-types')
        .send(invalidDataType)
        .expect(400);

      expect(response.body).toHaveProperty('message');
    });

    it('should handle not found errors', async () => {
      await request(app)
        .put('/api/data-types/non-existent-id')
        .send({ name: 'Updated' })
        .expect(404);
    });
  });
});
