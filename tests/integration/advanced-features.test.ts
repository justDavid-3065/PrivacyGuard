
import { describe, it, expect, beforeEach } from 'vitest';
import request from 'supertest';
import { testUsers, cleanDatabase, seedTestUsers, createTestApp } from '../setup';

describe('Advanced Features Integration Tests', () => {
  let app: any;

  beforeEach(async () => {
    await cleanDatabase();
    await seedTestUsers();
    app = await createTestApp();
  });

  describe('Accessibility Scanning API', () => {
    it('should perform accessibility scan', async () => {
      const response = await request(app)
        .post('/api/accessibility/scan')
        .send({ url: 'https://example.com' })
        .expect(200);

      expect(response.body).toMatchObject({
        url: 'https://example.com',
        score: expect.any(Number),
        issues: expect.any(Array),
        suggestions: expect.any(Array)
      });
    });

    it('should retrieve scan history', async () => {
      // First perform a scan
      await request(app)
        .post('/api/accessibility/scan')
        .send({ url: 'https://example.com' });

      const response = await request(app)
        .get('/api/accessibility/scans')
        .expect(200);

      expect(Array.isArray(response.body)).toBe(true);
    });
  });

  describe('Stripe Billing API', () => {
    it('should get available billing plans', async () => {
      const response = await request(app)
        .get('/api/billing/plans')
        .expect(200);

      expect(Array.isArray(response.body)).toBe(true);
      expect(response.body).toHaveLength(3);
      expect(response.body[0]).toMatchObject({
        id: 'starter',
        name: 'Starter',
        price: 29
      });
    });

    it('should create checkout session', async () => {
      const response = await request(app)
        .post('/api/billing/checkout')
        .send({ planId: 'starter' })
        .expect(200);

      expect(response.body).toHaveProperty('sessionUrl');
    });
  });

  describe('Privacy Notice Generator API', () => {
    it('should get available templates', async () => {
      const response = await request(app)
        .get('/api/privacy-notice/templates')
        .expect(200);

      expect(Array.isArray(response.body)).toBe(true);
      expect(response.body.length).toBeGreaterThan(0);
      expect(response.body[0]).toMatchObject({
        id: expect.any(String),
        name: expect.any(String),
        jurisdiction: expect.any(String)
      });
    });

    it('should generate privacy notice', async () => {
      const companyInfo = {
        name: 'Test Company',
        address: '123 Test St',
        email: 'privacy@test.com',
        website: 'https://test.com'
      };

      const response = await request(app)
        .post('/api/privacy-notice/generate')
        .send({
          templateId: 'gdpr-standard',
          companyInfo
        })
        .expect(200);

      expect(response.body).toHaveProperty('notice');
      expect(response.body.notice).toContain('Test Company');
    });
  });

  describe('Webhook Management API', () => {
    it('should create webhook endpoint', async () => {
      const webhookData = {
        url: 'https://example.com/webhook',
        events: ['consent.granted', 'consent.withdrawn']
      };

      const response = await request(app)
        .post('/api/webhooks')
        .send(webhookData)
        .expect(200);

      expect(response.body).toMatchObject({
        url: webhookData.url,
        events: webhookData.events,
        active: true
      });
    });

    it('should retrieve user webhooks', async () => {
      // Create a webhook first
      await request(app)
        .post('/api/webhooks')
        .send({
          url: 'https://example.com/webhook',
          events: ['consent.granted']
        });

      const response = await request(app)
        .get('/api/webhooks')
        .expect(200);

      expect(Array.isArray(response.body)).toBe(true);
    });
  });

  describe('Compliance and Audit API', () => {
    it('should calculate compliance score', async () => {
      const response = await request(app)
        .get('/api/compliance/score')
        .expect(200);

      expect(response.body).toMatchObject({
        overallScore: expect.any(Number),
        metrics: expect.any(Array),
        lastUpdated: expect.any(String)
      });
    });

    it('should retrieve audit trail', async () => {
      const response = await request(app)
        .get('/api/audit/trail')
        .expect(200);

      expect(Array.isArray(response.body)).toBe(true);
    });
  });

  describe('Integration Management API', () => {
    it('should connect HubSpot integration', async () => {
      const response = await request(app)
        .post('/api/integrations/hubspot')
        .send({ apiKey: 'test-api-key' })
        .expect(500); // Expected to fail without valid API key

      expect(response.body).toHaveProperty('message');
    });

    it('should retrieve user integrations', async () => {
      const response = await request(app)
        .get('/api/integrations')
        .expect(200);

      expect(Array.isArray(response.body)).toBe(true);
    });
  });
});
