
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { accessibilityScanner } from '../../server/services/accessibilityScanner';
import { storage } from '../../server/storage';

vi.mock('../../server/storage');

describe('AccessibilityScanner', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('scanUrl', () => {
    it('should perform accessibility scan and return results', async () => {
      const mockScan = {
        id: 'scan-1',
        userId: 'user-1',
        url: 'https://example.com',
        score: 85,
        issues: JSON.stringify([]),
        suggestions: JSON.stringify(['Improve color contrast']),
        scannedAt: new Date()
      };

      vi.mocked(storage.createAccessibilityScan).mockResolvedValue(mockScan);

      const result = await accessibilityScanner.scanUrl('https://example.com', 'user-1');

      expect(result).toMatchObject({
        url: 'https://example.com',
        score: expect.any(Number),
        issues: expect.any(Array),
        suggestions: expect.any(Array)
      });
      expect(storage.createAccessibilityScan).toHaveBeenCalledWith(
        expect.objectContaining({
          userId: 'user-1',
          url: 'https://example.com'
        })
      );
    });

    it('should handle scan errors gracefully', async () => {
      vi.mocked(storage.createAccessibilityScan).mockRejectedValue(new Error('Database error'));

      await expect(accessibilityScanner.scanUrl('https://invalid-url', 'user-1'))
        .rejects.toThrow('Failed to perform accessibility scan');
    });
  });

  describe('getScanHistory', () => {
    it('should retrieve scan history for user', async () => {
      const mockScans = [
        { id: 'scan-1', url: 'https://example.com', score: 85 },
        { id: 'scan-2', url: 'https://test.com', score: 92 }
      ];

      vi.mocked(storage.getAccessibilityScans).mockResolvedValue(mockScans);

      const result = await accessibilityScanner.getScanHistory('user-1');

      expect(result).toEqual(mockScans);
      expect(storage.getAccessibilityScans).toHaveBeenCalledWith('user-1');
    });
  });
});
