
const API_BASE_URL = 'http://localhost:5000/api'; // Update for production

export interface ApiResponse<T> {
  data: T;
  message?: string;
  error?: string;
}

class ApiService {
  private async request<T>(
    endpoint: string,
    options: RequestInit = {}
  ): Promise<T> {
    const token = await this.getAuthToken();
    
    const config: RequestInit = {
      headers: {
        'Content-Type': 'application/json',
        ...(token && { Authorization: `Bearer ${token}` }),
        ...options.headers,
      },
      ...options,
    };

    const response = await fetch(`${API_BASE_URL}${endpoint}`, config);
    
    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.message || `HTTP ${response.status}`);
    }

    return response.json();
  }

  private async getAuthToken(): Promise<string | null> {
    // Implementation depends on your auth system
    // This could be AsyncStorage, Keychain, etc.
    return 'mock-token';
  }

  // Authentication
  async login(email: string, password: string) {
    return this.request('/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email, password }),
    });
  }

  async getCurrentUser() {
    return this.request('/auth/user');
  }

  async logout() {
    return this.request('/auth/logout', { method: 'POST' });
  }

  // Dashboard
  async getDashboardStats() {
    return this.request('/dashboard/stats');
  }

  // Data Types
  async getDataTypes() {
    return this.request('/data-types');
  }

  async createDataType(dataType: any) {
    return this.request('/data-types', {
      method: 'POST',
      body: JSON.stringify(dataType),
    });
  }

  async updateDataType(id: string, dataType: any) {
    return this.request(`/data-types/${id}`, {
      method: 'PUT',
      body: JSON.stringify(dataType),
    });
  }

  async deleteDataType(id: string) {
    return this.request(`/data-types/${id}`, { method: 'DELETE' });
  }

  // Consent Records
  async getConsentRecords() {
    return this.request('/consent-records');
  }

  async createConsentRecord(consent: any) {
    return this.request('/consent-records', {
      method: 'POST',
      body: JSON.stringify(consent),
    });
  }

  async updateConsentRecord(id: string, consent: any) {
    return this.request(`/consent-records/${id}`, {
      method: 'PUT',
      body: JSON.stringify(consent),
    });
  }

  async withdrawConsent(id: string) {
    return this.request(`/consent-records/${id}`, {
      method: 'PUT',
      body: JSON.stringify({ status: 'withdrawn' }),
    });
  }

  // DSAR Requests
  async getDsarRequests() {
    return this.request('/dsar-requests');
  }

  async createDsarRequest(dsar: any) {
    return this.request('/dsar-requests', {
      method: 'POST',
      body: JSON.stringify(dsar),
    });
  }

  async updateDsarRequest(id: string, updates: any) {
    return this.request(`/dsar-requests/${id}`, {
      method: 'PUT',
      body: JSON.stringify(updates),
    });
  }

  async deleteDsarRequest(id: string) {
    return this.request(`/dsar-requests/${id}`, { method: 'DELETE' });
  }

  // Privacy Notices
  async getPrivacyNotices() {
    return this.request('/privacy-notices');
  }

  async createPrivacyNotice(notice: any) {
    return this.request('/privacy-notices', {
      method: 'POST',
      body: JSON.stringify(notice),
    });
  }

  async updatePrivacyNotice(id: string, notice: any) {
    return this.request(`/privacy-notices/${id}`, {
      method: 'PUT',
      body: JSON.stringify(notice),
    });
  }

  async deletePrivacyNotice(id: string) {
    return this.request(`/privacy-notices/${id}`, { method: 'DELETE' });
  }

  // Domains & SSL
  async getDomains() {
    return this.request('/domains');
  }

  async createDomain(domain: any) {
    return this.request('/domains', {
      method: 'POST',
      body: JSON.stringify(domain),
    });
  }

  async deleteDomain(id: string) {
    return this.request(`/domains/${id}`, { method: 'DELETE' });
  }

  async scanDomain(id: string) {
    return this.request(`/domains/${id}/scan`, { method: 'POST' });
  }

  async getSslCertificates() {
    return this.request('/ssl-certificates');
  }

  // Incidents
  async getIncidents() {
    return this.request('/incidents');
  }

  async createIncident(incident: any) {
    return this.request('/incidents', {
      method: 'POST',
      body: JSON.stringify(incident),
    });
  }

  async updateIncident(id: string, incident: any) {
    return this.request(`/incidents/${id}`, {
      method: 'PUT',
      body: JSON.stringify(incident),
    });
  }

  // Settings
  async getSettings() {
    return this.request('/settings');
  }

  async updateSettings(settings: any) {
    return this.request('/settings', {
      method: 'PUT',
      body: JSON.stringify(settings),
    });
  }

  // API Keys
  async generateApiKey(name: string) {
    return this.request('/api-keys', {
      method: 'POST',
      body: JSON.stringify({ name }),
    });
  }

  async getApiKeys() {
    return this.request('/api-keys');
  }

  async deleteApiKey(id: string) {
    return this.request(`/api-keys/${id}`, { method: 'DELETE' });
  }

  // Accessibility Scans
  async getAccessibilityScans() {
    return this.request('/accessibility/scans');
  }

  async createAccessibilityScan(scan: any) {
    return this.request('/accessibility/scan', {
      method: 'POST',
      body: JSON.stringify(scan),
    });
  }

  // Audit Events
  async getAuditEvents() {
    return this.request('/audit-events');
  }

  // Webhooks
  async getWebhooks() {
    return this.request('/webhooks');
  }

  async createWebhook(webhook: any) {
    return this.request('/webhooks', {
      method: 'POST',
      body: JSON.stringify(webhook),
    });
  }

  async updateWebhook(id: string, webhook: any) {
    return this.request(`/webhooks/${id}`, {
      method: 'PUT',
      body: JSON.stringify(webhook),
    });
  }

  async deleteWebhook(id: string) {
    return this.request(`/webhooks/${id}`, { method: 'DELETE' });
  }

  // Compliance Score
  async getComplianceScore() {
    return this.request('/compliance/score');
  }

  // Reports
  async generateReport(type: string, filters: any) {
    return this.request('/reports/generate', {
      method: 'POST',
      body: JSON.stringify({ type, filters }),
    });
  }

  async getReports() {
    return this.request('/reports');
  }

  async downloadReport(id: string) {
    return this.request(`/reports/${id}/download`);
  }
}

export const apiService = new ApiService();
export default apiService;
