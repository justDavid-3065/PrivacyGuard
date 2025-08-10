
import { describe, it, expect, beforeEach } from 'vitest';
import { sslMonitor } from '../../server/services/sslMonitor';
import { storage } from '../../server/storage';
import { testUsers, cleanDatabase, seedTestUsers } from '../setup';

describe('SSL Monitor Integration Tests', () => {
  beforeEach(async () => {
    await cleanDatabase();
    await seedTestUsers();
  });

  describe('Domain Management', () => {
    it('should add a new domain for monitoring', async () => {
      const domain = await storage.createDomain({
        name: 'example.com',
        userId: testUsers.owner.id
      });

      expect(domain).toBeDefined();
      expect(domain.name).toBe('example.com');
      expect(domain.isActive).toBe(true);
    });

    it('should get all domains for user', async () => {
      await storage.createDomain({
        name: 'test1.com',
        userId: testUsers.owner.id
      });

      await storage.createDomain({
        name: 'test2.com',
        userId: testUsers.owner.id
      });

      const domains = await storage.getDomains(testUsers.owner.id);
      
      expect(domains).toHaveLength(2);
      expect(domains.map(d => d.name)).toContain('test1.com');
      expect(domains.map(d => d.name)).toContain('test2.com');
    });
  });

  describe('SSL Certificate Checking', () => {
    it('should check SSL certificate for a domain', async () => {
      const domain = await storage.createDomain({
        name: 'google.com', // Using a reliable domain for testing
        userId: testUsers.owner.id
      });

      const certificate = await sslMonitor.checkCertificate('google.com');
      
      expect(certificate).toBeDefined();
      if (certificate) {
        expect(certificate.isValid).toBe(true);
        expect(certificate.validTo).toBeInstanceOf(Date);
        expect(certificate.validFrom).toBeInstanceOf(Date);
        expect(certificate.issuer).toBeDefined();
      }
    });

    it('should handle invalid domain gracefully', async () => {
      const result = await sslMonitor.checkCertificate('invalid-domain-that-does-not-exist.com');
      
      expect(result).toBeNull();
    });

    it('should update certificate information in database', async () => {
      const domain = await storage.createDomain({
        name: 'github.com',
        userId: testUsers.owner.id
      });

      await sslMonitor.updateCertificateInfo(domain.id, 'github.com');
      
      const certificates = await storage.getSslCertificates(testUsers.owner.id);
      const cert = certificates.find(c => c.domainId === domain.id);
      
      expect(cert).toBeDefined();
      if (cert) {
        expect(cert.lastChecked).toBeInstanceOf(Date);
      }
    });
  });

  describe('Alert Management', () => {
    it('should create alert settings for user', async () => {
      const alertSettings = {
        email: 'alerts@test.com',
        emailEnabled: true,
        smsEnabled: false,
        slackEnabled: false,
        alertThresholds: JSON.stringify({ 30: true, 7: true }),
        userId: testUsers.owner.id
      };

      const created = await storage.createAlertSettings(alertSettings);
      
      expect(created).toBeDefined();
      expect(created.email).toBe(alertSettings.email);
      expect(created.emailEnabled).toBe(true);
    });

    it('should get alert settings for user', async () => {
      await storage.createAlertSettings({
        email: 'test@example.com',
        emailEnabled: true,
        userId: testUsers.owner.id
      });

      const settings = await storage.getAlertSettings(testUsers.owner.id);
      
      expect(settings).toBeDefined();
      expect(settings?.email).toBe('test@example.com');
    });

    it('should update alert settings', async () => {
      const created = await storage.createAlertSettings({
        email: 'original@test.com',
        emailEnabled: false,
        userId: testUsers.owner.id
      });

      const updated = await storage.updateAlertSettings(created.id, {
        email: 'updated@test.com',
        emailEnabled: true,
        smsEnabled: true
      });

      expect(updated.email).toBe('updated@test.com');
      expect(updated.emailEnabled).toBe(true);
      expect(updated.smsEnabled).toBe(true);
    });
  });

  describe('Certificate Expiration Monitoring', () => {
    it('should identify certificates expiring soon', async () => {
      const domain = await storage.createDomain({
        name: 'test-domain.com',
        userId: testUsers.owner.id
      });

      // Create a certificate that expires soon
      const soonExpiry = new Date();
      soonExpiry.setDate(soonExpiry.getDate() + 15); // 15 days from now

      await storage.createSslCertificate({
        domainId: domain.id,
        issuer: 'Test CA',
        subject: 'test-domain.com',
        validFrom: new Date(),
        validTo: soonExpiry,
        isValid: true
      });

      const expiringSoon = await storage.getCertificatesExpiringSoon(30); // Within 30 days
      
      expect(expiringSoon.length).toBeGreaterThan(0);
      expect(expiringSoon[0].domainId).toBe(domain.id);
    });

    it('should not include certificates expiring far in future', async () => {
      const domain = await storage.createDomain({
        name: 'future-domain.com',
        userId: testUsers.owner.id
      });

      // Create a certificate that expires far in the future
      const farExpiry = new Date();
      farExpiry.setDate(farExpiry.getDate() + 365); // 1 year from now

      await storage.createSslCertificate({
        domainId: domain.id,
        issuer: 'Test CA',
        subject: 'future-domain.com',
        validFrom: new Date(),
        validTo: farExpiry,
        isValid: true
      });

      const expiringSoon = await storage.getCertificatesExpiringSoon(30); // Within 30 days
      
      const found = expiringSoon.find(cert => cert.domainId === domain.id);
      expect(found).toBeUndefined();
    });
  });
});
