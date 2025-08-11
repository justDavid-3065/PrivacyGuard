
import apiService from '../../src/services/api';
import { authTokenManager } from '../../src/services/authTokenManager';

jest.mock('../../src/services/authTokenManager');

// Mock fetch
global.fetch = jest.fn();

describe('ApiService', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    (fetch as jest.Mock).mockClear();
  });

  describe('Authentication', () => {
    it('should include auth token in requests', async () => {
      (authTokenManager.getValidToken as jest.Mock).mockResolvedValue('valid-token');
      (fetch as jest.Mock).mockResolvedValue({
        ok: true,
        json: () => Promise.resolve({ data: 'test' })
      });

      await apiService.getCurrentUser();

      expect(fetch).toHaveBeenCalledWith(
        'http://localhost:5000/api/auth/user',
        expect.objectContaining({
          headers: expect.objectContaining({
            'Authorization': 'Bearer valid-token'
          })
        })
      );
    });

    it('should make requests without token when not available', async () => {
      (authTokenManager.getValidToken as jest.Mock).mockResolvedValue(null);
      (fetch as jest.Mock).mockResolvedValue({
        ok: true,
        json: () => Promise.resolve({ data: 'test' })
      });

      await apiService.getCurrentUser();

      expect(fetch).toHaveBeenCalledWith(
        'http://localhost:5000/api/auth/user',
        expect.objectContaining({
          headers: expect.not.objectContaining({
            'Authorization': expect.anything()
          })
        })
      );
    });
  });

  describe('Error Handling', () => {
    it('should throw error for non-ok responses', async () => {
      (authTokenManager.getValidToken as jest.Mock).mockResolvedValue('valid-token');
      (fetch as jest.Mock).mockResolvedValue({
        ok: false,
        status: 404,
        json: () => Promise.resolve({ message: 'Not found' })
      });

      await expect(apiService.getCurrentUser()).rejects.toThrow('Not found');
    });

    it('should throw generic error when no error message', async () => {
      (authTokenManager.getValidToken as jest.Mock).mockResolvedValue('valid-token');
      (fetch as jest.Mock).mockResolvedValue({
        ok: false,
        status: 500,
        json: () => Promise.reject(new Error('Invalid JSON'))
      });

      await expect(apiService.getCurrentUser()).rejects.toThrow('HTTP 500');
    });
  });

  describe('Dashboard API', () => {
    it('should fetch dashboard stats', async () => {
      const mockStats = {
        totalDataTypes: 10,
        activeConsents: 25,
        pendingDSARs: 3,
        expiringSslCerts: 2
      };

      (authTokenManager.getValidToken as jest.Mock).mockResolvedValue('valid-token');
      (fetch as jest.Mock).mockResolvedValue({
        ok: true,
        json: () => Promise.resolve(mockStats)
      });

      const result = await apiService.getDashboardStats();

      expect(result).toEqual(mockStats);
      expect(fetch).toHaveBeenCalledWith(
        'http://localhost:5000/api/dashboard/stats',
        expect.objectContaining({
          headers: expect.objectContaining({
            'Content-Type': 'application/json',
            'Authorization': 'Bearer valid-token'
          })
        })
      );
    });
  });

  describe('Data Types API', () => {
    it('should create data type', async () => {
      const newDataType = {
        name: 'Email Address',
        category: 'Personal',
        sensitivity: 'high'
      };

      (authTokenManager.getValidToken as jest.Mock).mockResolvedValue('valid-token');
      (fetch as jest.Mock).mockResolvedValue({
        ok: true,
        json: () => Promise.resolve({ id: '1', ...newDataType })
      });

      const result = await apiService.createDataType(newDataType);

      expect(result).toEqual({ id: '1', ...newDataType });
      expect(fetch).toHaveBeenCalledWith(
        'http://localhost:5000/api/data-types',
        expect.objectContaining({
          method: 'POST',
          body: JSON.stringify(newDataType)
        })
      );
    });

    it('should update data type', async () => {
      const updatedDataType = {
        name: 'Updated Email',
        category: 'Personal',
        sensitivity: 'medium'
      };

      (authTokenManager.getValidToken as jest.Mock).mockResolvedValue('valid-token');
      (fetch as jest.Mock).mockResolvedValue({
        ok: true,
        json: () => Promise.resolve({ id: '1', ...updatedDataType })
      });

      const result = await apiService.updateDataType('1', updatedDataType);

      expect(result).toEqual({ id: '1', ...updatedDataType });
      expect(fetch).toHaveBeenCalledWith(
        'http://localhost:5000/api/data-types/1',
        expect.objectContaining({
          method: 'PUT',
          body: JSON.stringify(updatedDataType)
        })
      );
    });

    it('should delete data type', async () => {
      (authTokenManager.getValidToken as jest.Mock).mockResolvedValue('valid-token');
      (fetch as jest.Mock).mockResolvedValue({
        ok: true,
        json: () => Promise.resolve({ success: true })
      });

      const result = await apiService.deleteDataType('1');

      expect(result).toEqual({ success: true });
      expect(fetch).toHaveBeenCalledWith(
        'http://localhost:5000/api/data-types/1',
        expect.objectContaining({
          method: 'DELETE'
        })
      );
    });
  });

  describe('Consent Records API', () => {
    it('should create consent record', async () => {
      const newConsent = {
        userId: 'user-123',
        purpose: 'Marketing',
        granted: true,
        source: 'website'
      };

      (authTokenManager.getValidToken as jest.Mock).mockResolvedValue('valid-token');
      (fetch as jest.Mock).mockResolvedValue({
        ok: true,
        json: () => Promise.resolve({ id: '1', ...newConsent })
      });

      const result = await apiService.createConsentRecord(newConsent);

      expect(result).toEqual({ id: '1', ...newConsent });
      expect(fetch).toHaveBeenCalledWith(
        'http://localhost:5000/api/consent-records',
        expect.objectContaining({
          method: 'POST',
          body: JSON.stringify(newConsent)
        })
      );
    });

    it('should withdraw consent', async () => {
      (authTokenManager.getValidToken as jest.Mock).mockResolvedValue('valid-token');
      (fetch as jest.Mock).mockResolvedValue({
        ok: true,
        json: () => Promise.resolve({ id: '1', status: 'withdrawn' })
      });

      const result = await apiService.withdrawConsent('1');

      expect(result).toEqual({ id: '1', status: 'withdrawn' });
      expect(fetch).toHaveBeenCalledWith(
        'http://localhost:5000/api/consent-records/1',
        expect.objectContaining({
          method: 'PUT',
          body: JSON.stringify({ status: 'withdrawn' })
        })
      );
    });
  });

  describe('DSAR Requests API', () => {
    it('should create DSAR request', async () => {
      const newDsar = {
        email: 'user@example.com',
        requestType: 'access',
        description: 'Data access request'
      };

      (authTokenManager.getValidToken as jest.Mock).mockResolvedValue('valid-token');
      (fetch as jest.Mock).mockResolvedValue({
        ok: true,
        json: () => Promise.resolve({ id: '1', ...newDsar })
      });

      const result = await apiService.createDsarRequest(newDsar);

      expect(result).toEqual({ id: '1', ...newDsar });
      expect(fetch).toHaveBeenCalledWith(
        'http://localhost:5000/api/dsar-requests',
        expect.objectContaining({
          method: 'POST',
          body: JSON.stringify(newDsar)
        })
      );
    });
  });

  describe('SSL Monitoring API', () => {
    it('should scan domain', async () => {
      (authTokenManager.getValidToken as jest.Mock).mockResolvedValue('valid-token');
      (fetch as jest.Mock).mockResolvedValue({
        ok: true,
        json: () => Promise.resolve({ status: 'scanning' })
      });

      const result = await apiService.scanDomain('domain-1');

      expect(result).toEqual({ status: 'scanning' });
      expect(fetch).toHaveBeenCalledWith(
        'http://localhost:5000/api/domains/domain-1/scan',
        expect.objectContaining({
          method: 'POST'
        })
      );
    });
  });
});
