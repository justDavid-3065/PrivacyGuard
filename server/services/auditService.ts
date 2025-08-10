
interface AuditEvent {
  id: string;
  userId: string;
  action: string;
  resource: string;
  resourceId?: string;
  details: Record<string, any>;
  userAgent?: string;
  ipAddress?: string;
  timestamp: Date;
  severity: 'low' | 'medium' | 'high' | 'critical';
}

interface ComplianceMetric {
  category: string;
  score: number;
  maxScore: number;
  weight: number;
  issues: string[];
  recommendations: string[];
}

class AuditService {
  async logEvent(event: Omit<AuditEvent, 'id' | 'timestamp'>): Promise<void> {
    const auditEvent: AuditEvent = {
      ...event,
      id: crypto.randomUUID(),
      timestamp: new Date()
    };

    await storage.createAuditEvent(auditEvent);
    
    // Trigger real-time alerts for critical events
    if (event.severity === 'critical') {
      await this.triggerSecurityAlert(auditEvent);
    }
  }

  async calculateComplianceScore(userId: string): Promise<{
    overallScore: number;
    metrics: ComplianceMetric[];
    lastUpdated: Date;
  }> {
    const metrics: ComplianceMetric[] = [];

    // Data Inventory Completeness
    const dataTypes = await storage.getDataTypes(userId);
    const dataTypesWithBasis = dataTypes.filter(dt => dt.legalBasis);
    metrics.push({
      category: 'Data Inventory',
      score: dataTypes.length > 0 ? (dataTypesWithBasis.length / dataTypes.length) * 100 : 0,
      maxScore: 100,
      weight: 0.25,
      issues: dataTypes.length === 0 ? ['No data types defined'] : [],
      recommendations: dataTypesWithBasis.length < dataTypes.length ? 
        ['Define legal basis for all data types'] : []
    });

    // Consent Management
    const consentRecords = await storage.getConsentRecords(userId);
    const recentConsents = consentRecords.filter(c => 
      new Date(c.timestamp) > new Date(Date.now() - 90 * 24 * 60 * 60 * 1000)
    );
    metrics.push({
      category: 'Consent Management',
      score: consentRecords.length > 0 ? Math.min(100, (recentConsents.length / consentRecords.length) * 100) : 0,
      maxScore: 100,
      weight: 0.20,
      issues: consentRecords.length === 0 ? ['No consent records'] : [],
      recommendations: recentConsents.length === 0 ? 
        ['Ensure regular consent collection'] : []
    });

    // Privacy Notices
    const notices = await storage.getPrivacyNotices(userId);
    const currentNotices = notices.filter(n => 
      !n.expiryDate || new Date(n.expiryDate) > new Date()
    );
    metrics.push({
      category: 'Privacy Notices',
      score: notices.length > 0 ? (currentNotices.length / notices.length) * 100 : 0,
      maxScore: 100,
      weight: 0.15,
      issues: notices.length === 0 ? ['No privacy notices created'] : [],
      recommendations: currentNotices.length < notices.length ? 
        ['Update expired privacy notices'] : []
    });

    // DSAR Response Time
    const dsarRequests = await storage.getDsarRequests(userId);
    const onTimeResponses = dsarRequests.filter(req => {
      if (req.status !== 'completed') return false;
      const responseTime = req.resolvedAt ? 
        new Date(req.resolvedAt).getTime() - new Date(req.requestDate).getTime() : 
        Date.now() - new Date(req.requestDate).getTime();
      return responseTime <= 30 * 24 * 60 * 60 * 1000; // 30 days
    });
    metrics.push({
      category: 'DSAR Response',
      score: dsarRequests.length > 0 ? (onTimeResponses.length / dsarRequests.length) * 100 : 100,
      maxScore: 100,
      weight: 0.20,
      issues: dsarRequests.length > onTimeResponses.length ? ['Late DSAR responses'] : [],
      recommendations: onTimeResponses.length < dsarRequests.length ? 
        ['Improve DSAR response times'] : []
    });

    // Security Measures
    const domains = await storage.getAllDomainsWithCertificates(userId);
    const securedDomains = domains.filter(d => 
      d.sslCertificates?.some(cert => cert.isValid)
    );
    metrics.push({
      category: 'Security',
      score: domains.length > 0 ? (securedDomains.length / domains.length) * 100 : 100,
      maxScore: 100,
      weight: 0.20,
      issues: securedDomains.length < domains.length ? ['Insecure domains detected'] : [],
      recommendations: securedDomains.length < domains.length ? 
        ['Secure all domains with valid SSL certificates'] : []
    });

    // Calculate weighted overall score
    const totalWeight = metrics.reduce((sum, metric) => sum + metric.weight, 0);
    const weightedScore = metrics.reduce((sum, metric) => 
      sum + (metric.score * metric.weight), 0
    );
    const overallScore = Math.round(weightedScore / totalWeight);

    return {
      overallScore,
      metrics,
      lastUpdated: new Date()
    };
  }

  private async triggerSecurityAlert(event: AuditEvent): Promise<void> {
    // In production, send to security team
    console.warn('CRITICAL SECURITY EVENT:', {
      action: event.action,
      user: event.userId,
      timestamp: event.timestamp,
      details: event.details
    });
  }

  async getAuditTrail(userId: string, filters?: {
    action?: string;
    resource?: string;
    startDate?: Date;
    endDate?: Date;
    severity?: string;
  }): Promise<AuditEvent[]> {
    return storage.getAuditEvents(userId, filters);
  }

  async generateComplianceReport(userId: string): Promise<{
    score: number;
    metrics: ComplianceMetric[];
    recommendations: string[];
    riskAreas: string[];
    lastUpdated: Date;
  }> {
    const compliance = await this.calculateComplianceScore(userId);
    
    const recommendations = compliance.metrics
      .flatMap(m => m.recommendations)
      .filter(r => r.length > 0);

    const riskAreas = compliance.metrics
      .filter(m => m.score < 70)
      .map(m => m.category);

    return {
      score: compliance.overallScore,
      metrics: compliance.metrics,
      recommendations,
      riskAreas,
      lastUpdated: compliance.lastUpdated
    };
  }
}

export const auditService = new AuditService();
