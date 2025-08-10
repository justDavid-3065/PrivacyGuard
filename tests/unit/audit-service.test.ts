
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { auditService } from '../../server/services/auditService';
import { storage } from '../../server/storage';

vi.mock('../../server/storage');

describe('AuditService', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('logEvent', () => {
    it('should log audit event with proper structure', async () => {
      const event = {
        userId: 'user-1',
        action: 'create',
        resource: 'data_type',
        resourceId: 'dt-1',
        details: { name: 'Email Addresses' },
        severity: 'low' as const
      };

      vi.mocked(storage.createAuditEvent).mockResolvedValue(undefined);

      await auditService.logEvent(event);

      expect(storage.createAuditEvent).toHaveBeenCalledWith(
        expect.objectContaining({
          ...event,
          id: expect.any(String),
          timestamp: expect.any(Date)
        })
      );
    });

    it('should trigger security alert for critical events', async () => {
      const consoleSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});
      
      const criticalEvent = {
        userId: 'user-1',
        action: 'unauthorized_access',
        resource: 'sensitive_data',
        details: {},
        severity: 'critical' as const
      };

      vi.mocked(storage.createAuditEvent).mockResolvedValue(undefined);

      await auditService.logEvent(criticalEvent);

      expect(consoleSpy).toHaveBeenCalledWith(
        'CRITICAL SECURITY EVENT:',
        expect.any(Object)
      );
    });
  });

  describe('calculateComplianceScore', () => {
    it('should calculate compliance score based on metrics', async () => {
      vi.mocked(storage.getDataTypes).mockResolvedValue([
        { id: '1', name: 'Email', legalBasis: 'consent', userId: 'user-1', createdAt: new Date(), updatedAt: new Date() }
      ]);
      vi.mocked(storage.getConsentRecords).mockResolvedValue([]);
      vi.mocked(storage.getPrivacyNotices).mockResolvedValue([]);
      vi.mocked(storage.getDsarRequests).mockResolvedValue([]);
      vi.mocked(storage.getAllDomainsWithCertificates).mockResolvedValue([]);

      const result = await auditService.calculateComplianceScore('user-1');

      expect(result).toMatchObject({
        overallScore: expect.any(Number),
        metrics: expect.any(Array),
        lastUpdated: expect.any(Date)
      });
      expect(result.overallScore).toBeGreaterThanOrEqual(0);
      expect(result.overallScore).toBeLessThanOrEqual(100);
    });
  });

  describe('getAuditTrail', () => {
    it('should retrieve filtered audit trail', async () => {
      const mockEvents = [
        { id: '1', action: 'create', resource: 'data_type', timestamp: new Date() },
        { id: '2', action: 'update', resource: 'consent', timestamp: new Date() }
      ];

      vi.mocked(storage.getAuditEvents).mockResolvedValue(mockEvents);

      const filters = { action: 'create', startDate: new Date() };
      const result = await auditService.getAuditTrail('user-1', filters);

      expect(result).toEqual(mockEvents);
      expect(storage.getAuditEvents).toHaveBeenCalledWith('user-1', filters);
    });
  });
});
