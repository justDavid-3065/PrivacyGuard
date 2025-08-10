
import { describe, it, expect, beforeEach } from 'vitest';
import { sslMonitor } from '../../server/services/sslMonitor';
import { storage } from '../../server/storage';
import { cleanDatabase, seedTestUsers } from '../setup';

describe('SSL Monitoring Integration Tests', () => {
  beforeEach(async () => {
    await cleanDatabase();
    await seedTestUsers();
  });

  describe('Multi-Region SSL Checks', () => {
    it('should perform SSL check from multiple regions', async () => {
      const result = await sslMonitor.checkCertificateMultiRegion('example.com');

      expect(result).toMatchObject({
        certificate: expect.any(Object),
        regionChecks: expect.any(Array)
      });

      if (result.regionChecks.length > 0) {
        expect(result.regionChecks[0]).toMatchObject({
          region: expect.any(String),
          endpoint: expect.any(String),
          latency: expect.any(Number),
          status: expect.stringMatching(/^(success|error)$/)
        });
      }
    });

    it('should handle certificate validation', async () => {
      const cert = await sslMonitor.checkCertificate('google.com');

      if (cert) {
        expect(cert).toMatchObject({
          issuer: expect.any(String),
          subject: expect.any(String),
          validFrom: expect.any(Date),
          validTo: expect.any(Date),
          isValid: expect.any(Boolean)
        });
        expect(cert.validTo.getTime()).toBeGreaterThan(Date.now());
      }
    });

    it('should handle invalid domains gracefully', async () => {
      const cert = await sslMonitor.checkCertificate('invalid-domain-that-does-not-exist.com');
      expect(cert).toBeNull();
    });
  });

  describe('SSL Certificate Storage', () => {
    it('should store SSL certificate information', async () => {
      const domain = await storage.createDomain({
        name: 'test.example.com',
        userId: 'test-user-id'
      });

      await sslMonitor.updateCertificateInfo(domain.id, domain.name);

      const certificates = await storage.getSslCertificatesByDomain(domain.id);
      expect(certificates.length).toBeGreaterThan(0);
    });
  });
});
