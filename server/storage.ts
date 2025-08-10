import {
  users,
  dataTypes,
  consentRecords,
  dsarRequests,
  privacyNotices,
  incidents,
  domains,
  sslCertificates,
  alertSettings,
  type User,
  type UpsertUser,
  type InsertDataType,
  type DataType,
  type InsertConsentRecord,
  type ConsentRecord,
  type InsertDsarRequest,
  type DsarRequest,
  type InsertPrivacyNotice,
  type PrivacyNotice,
  type InsertIncident,
  type Incident,
  type InsertDomain,
  type Domain,
  type InsertSslCertificate,
  type SslCertificate,
  type InsertAlertSettings,
  type AlertSettings,
} from "@shared/schema";
import { db } from "./db";
import { eq, desc, sql, and, lt, gte } from "drizzle-orm";

// Interface for storage operations
export interface IStorage {
  // User operations (required for Replit Auth)
  getUser(id: string): Promise<User | undefined>;
  upsertUser(user: UpsertUser): Promise<User>;

  // Data inventory operations
  createDataType(dataType: InsertDataType): Promise<DataType>;
  getDataTypes(userId: string): Promise<DataType[]>;
  updateDataType(id: string, dataType: Partial<InsertDataType>): Promise<DataType>;
  deleteDataType(id: string): Promise<void>;

  // Consent tracking operations
  createConsentRecord(consent: InsertConsentRecord): Promise<ConsentRecord>;
  getConsentRecords(userId: string): Promise<ConsentRecord[]>;
  getConsentBySubject(subjectEmail: string, userId: string): Promise<ConsentRecord[]>;

  // DSAR operations
  createDsarRequest(request: InsertDsarRequest): Promise<DsarRequest>;
  getDsarRequests(userId: string): Promise<DsarRequest[]>;
  updateDsarRequest(id: string, updates: Partial<InsertDsarRequest>): Promise<DsarRequest>;
  getDsarRequestById(id: string): Promise<DsarRequest | undefined>;

  // Privacy notice operations
  createPrivacyNotice(notice: InsertPrivacyNotice): Promise<PrivacyNotice>;
  getPrivacyNotices(userId: string): Promise<PrivacyNotice[]>;
  updatePrivacyNotice(id: string, updates: Partial<InsertPrivacyNotice>): Promise<PrivacyNotice>;
  deletePrivacyNotice(id: string): Promise<void>;

  // Incident operations
  createIncident(incident: InsertIncident): Promise<Incident>;
  getIncidents(userId: string): Promise<Incident[]>;
  updateIncident(id: string, updates: Partial<InsertIncident>): Promise<Incident>;
  getIncidentById(id: string): Promise<Incident | undefined>;

  // Domain operations
  createDomain(domain: InsertDomain): Promise<Domain>;
  getDomains(userId: string): Promise<Domain[]>;
  updateDomain(id: string, updates: Partial<InsertDomain>): Promise<Domain>;
  deleteDomain(id: string): Promise<void>;
  getDomainById(id: string): Promise<Domain | undefined>;

  // SSL Certificate operations
  createSslCertificate(cert: InsertSslCertificate): Promise<SslCertificate>;
  getSslCertificatesByDomain(domainId: string): Promise<SslCertificate[]>;
  getExpiringCertificates(days: number): Promise<(SslCertificate & { domain: Domain })[]>;
  updateSslCertificate(id: string, updates: Partial<InsertSslCertificate>): Promise<SslCertificate>;
  getAllDomainsWithCertificates(userId: string): Promise<(Domain & { sslCertificates: SslCertificate[] })[]>;

  // Alert settings operations
  getAlertSettings(userId: string): Promise<AlertSettings | undefined>;
  upsertAlertSettings(settings: InsertAlertSettings): Promise<AlertSettings>;

  // Accessibility scanning methods
  createAccessibilityScan(scan: any): Promise<any>;
  getAccessibilityScans(userId: string): Promise<any[]>;

  // Subscription methods
  createSubscription(subscription: any): Promise<any>;
  updateSubscriptionPayment(subscriptionId: string, paid: boolean): Promise<void>;
  updateSubscriptionStatus(subscriptionId: string, status: string): Promise<void>;

  // Webhook methods
  createWebhook(webhook: any): Promise<any>;
  getWebhooks(userId: string): Promise<any[]>;
  getActiveWebhooks(userId: string, eventType: string): Promise<any[]>;
  deleteWebhook(webhookId: string, userId: string): Promise<void>;
  logWebhookDelivery(delivery: any): Promise<void>;

  // Audit methods
  createAuditEvent(event: any): Promise<void>;
  getAuditEvents(userId: string, filters?: any): Promise<any[]>;

  // Integration methods
  createIntegration(userId: string, integration: any): Promise<any>;
  getIntegration(integrationId: string): Promise<any | null>;
  getIntegrations(userId: string): Promise<any[]>;
  updateIntegrationSync(integrationId: string, lastSync: Date): Promise<void>;
  updateIntegrationStatus(integrationId: string, status: string): Promise<void>;
  deleteIntegration(integrationId: string, userId: string): Promise<void>;

  // Dashboard statistics
  getDashboardStats(userId: string): Promise<{
    totalDataTypes: number;
    openDsars: number;
    totalDomains: number;
    expiringCerts: number;
    complianceScore: number;
  }>;
}

export class DatabaseStorage implements IStorage {
  // User operations (required for Replit Auth)
  async getUser(id: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.id, id));
    return user;
  }

  async upsertUser(userData: UpsertUser): Promise<User> {
    const [user] = await db
      .insert(users)
      .values(userData)
      .onConflictDoUpdate({
        target: users.id,
        set: {
          ...userData,
          updatedAt: new Date(),
        },
      })
      .returning();
    return user;
  }

  // Data inventory operations
  async createDataType(dataType: InsertDataType): Promise<DataType> {
    const [result] = await db.insert(dataTypes).values(dataType).returning();
    return result;
  }

  async getDataTypes(userId: string): Promise<DataType[]> {
    return await db.select().from(dataTypes).where(eq(dataTypes.userId, userId)).orderBy(desc(dataTypes.createdAt));
  }

  async updateDataType(id: string, dataType: Partial<InsertDataType>): Promise<DataType> {
    const [result] = await db
      .update(dataTypes)
      .set({ ...dataType, updatedAt: new Date() })
      .where(eq(dataTypes.id, id))
      .returning();
    return result;
  }

  async deleteDataType(id: string): Promise<void> {
    await db.delete(dataTypes).where(eq(dataTypes.id, id));
  }

  // Consent tracking operations
  async createConsentRecord(consent: InsertConsentRecord): Promise<ConsentRecord> {
    const [result] = await db.insert(consentRecords).values(consent).returning();
    return result;
  }

  async getConsentRecords(userId: string): Promise<ConsentRecord[]> {
    return await db.select().from(consentRecords).where(eq(consentRecords.userId, userId)).orderBy(desc(consentRecords.timestamp));
  }

  async getConsentBySubject(subjectEmail: string, userId: string): Promise<ConsentRecord[]> {
    return await db
      .select()
      .from(consentRecords)
      .where(and(eq(consentRecords.subjectEmail, subjectEmail), eq(consentRecords.userId, userId)))
      .orderBy(desc(consentRecords.timestamp));
  }

  // DSAR operations
  async createDsarRequest(request: InsertDsarRequest): Promise<DsarRequest> {
    const [result] = await db.insert(dsarRequests).values(request).returning();
    return result;
  }

  async getDsarRequests(userId: string): Promise<DsarRequest[]> {
    return await db.select().from(dsarRequests).where(eq(dsarRequests.userId, userId)).orderBy(desc(dsarRequests.submittedAt));
  }

  async updateDsarRequest(id: string, updates: Partial<InsertDsarRequest>): Promise<DsarRequest> {
    const [result] = await db
      .update(dsarRequests)
      .set({ ...updates, updatedAt: new Date() })
      .where(eq(dsarRequests.id, id))
      .returning();
    return result;
  }

  async getDsarRequestById(id: string): Promise<DsarRequest | undefined> {
    const [result] = await db.select().from(dsarRequests).where(eq(dsarRequests.id, id));
    return result;
  }

  // Privacy notice operations
  async createPrivacyNotice(notice: InsertPrivacyNotice): Promise<PrivacyNotice> {
    const [result] = await db.insert(privacyNotices).values(notice).returning();
    return result;
  }

  async getPrivacyNotices(userId: string): Promise<PrivacyNotice[]> {
    return await db.select().from(privacyNotices).where(eq(privacyNotices.userId, userId)).orderBy(desc(privacyNotices.createdAt));
  }

  async updatePrivacyNotice(id: string, updates: Partial<InsertPrivacyNotice>): Promise<PrivacyNotice> {
    const [result] = await db
      .update(privacyNotices)
      .set({ ...updates, updatedAt: new Date() })
      .where(eq(privacyNotices.id, id))
      .returning();
    return result;
  }

  async deletePrivacyNotice(id: string): Promise<void> {
    await db.delete(privacyNotices).where(eq(privacyNotices.id, id));
  }

  // Incident operations
  async createIncident(incident: InsertIncident): Promise<Incident> {
    const [result] = await db.insert(incidents).values(incident).returning();
    return result;
  }

  async getIncidents(userId: string): Promise<Incident[]> {
    return await db.select().from(incidents).where(eq(incidents.userId, userId)).orderBy(desc(incidents.createdAt));
  }

  async updateIncident(id: string, updates: Partial<InsertIncident>): Promise<Incident> {
    const [result] = await db
      .update(incidents)
      .set({ ...updates, updatedAt: new Date() })
      .where(eq(incidents.id, id))
      .returning();
    return result;
  }

  async getIncidentById(id: string): Promise<Incident | undefined> {
    const [result] = await db.select().from(incidents).where(eq(incidents.id, id));
    return result;
  }

  // Domain operations
  async createDomain(domain: InsertDomain): Promise<Domain> {
    const [result] = await db.insert(domains).values(domain).returning();
    return result;
  }

  async getDomains(userId: string): Promise<Domain[]> {
    return await db.select().from(domains).where(eq(domains.userId, userId)).orderBy(desc(domains.createdAt));
  }

  async updateDomain(id: string, updates: Partial<InsertDomain>): Promise<Domain> {
    const [result] = await db
      .update(domains)
      .set({ ...updates, updatedAt: new Date() })
      .where(eq(domains.id, id))
      .returning();
    return result;
  }

  async deleteDomain(id: string): Promise<void> {
    await db.delete(domains).where(eq(domains.id, id));
  }

  async getDomainById(id: string): Promise<Domain | undefined> {
    const [result] = await db.select().from(domains).where(eq(domains.id, id));
    return result;
  }

  // SSL Certificate operations
  async createSslCertificate(cert: InsertSslCertificate): Promise<SslCertificate> {
    const [result] = await db.insert(sslCertificates).values(cert).returning();
    return result;
  }

  async getSslCertificatesByDomain(domainId: string): Promise<SslCertificate[]> {
    return await db.select().from(sslCertificates).where(eq(sslCertificates.domainId, domainId)).orderBy(desc(sslCertificates.createdAt));
  }

  async getExpiringCertificates(days: number): Promise<(SslCertificate & { domain: Domain })[]> {
    const thresholdDate = new Date();
    thresholdDate.setDate(thresholdDate.getDate() + days);

    return await db
      .select()
      .from(sslCertificates)
      .innerJoin(domains, eq(sslCertificates.domainId, domains.id))
      .where(
        and(
          lt(sslCertificates.validTo, thresholdDate),
          gte(sslCertificates.validTo, new Date()),
          eq(sslCertificates.isValid, true)
        )
      );
  }

  async updateSslCertificate(id: string, updates: Partial<InsertSslCertificate>): Promise<SslCertificate> {
    const [result] = await db
      .update(sslCertificates)
      .set({ ...updates, updatedAt: new Date() })
      .where(eq(sslCertificates.id, id))
      .returning();
    return result;
  }

  async getAllDomainsWithCertificates(userId: string): Promise<(Domain & { sslCertificates: SslCertificate[] })[]> {
    const domainsResult = await db.select().from(domains).where(eq(domains.userId, userId));
    const result = [];

    for (const domain of domainsResult) {
      const certs = await this.getSslCertificatesByDomain(domain.id);
      result.push({ ...domain, sslCertificates: certs });
    }

    return result;
  }

  // Alert settings operations
  async getAlertSettings(userId: string): Promise<AlertSettings | undefined> {
    const [result] = await db.select().from(alertSettings).where(eq(alertSettings.userId, userId));
    return result;
  }

  async upsertAlertSettings(settings: InsertAlertSettings): Promise<AlertSettings> {
    const [result] = await db
      .insert(alertSettings)
      .values(settings)
      .onConflictDoUpdate({
        target: alertSettings.userId,
        set: {
          emailNotifications: settings.emailNotifications,
          sslExpiryDays: settings.sslExpiryDays,
          incidentSeverity: settings.incidentSeverity,
          updatedAt: new Date(),
        },
      })
      .returning();
    return result[0];
  }

  // Accessibility scanning methods
  async createAccessibilityScan(scan: {
    userId: string;
    url: string;
    score: number;
    issues: string;
    suggestions: string;
    scannedAt: Date;
  }) {
    const [result] = await db.execute(sql`
      INSERT INTO accessibility_scans (user_id, url, score, issues, suggestions, scanned_at)
      VALUES (${scan.userId}, ${scan.url}, ${scan.score}, ${scan.issues}, ${scan.suggestions}, ${scan.scannedAt})
      RETURNING *
    `);
    return result;
  }

  async getAccessibilityScans(userId: string) {
    const result = await db.execute(sql`
      SELECT * FROM accessibility_scans 
      WHERE user_id = ${userId} 
      ORDER BY scanned_at DESC
    `);
    return result.rows || [];
  }

  // Subscription methods
  async createSubscription(subscription: any) {
    console.log('Creating subscription:', subscription);
    return subscription;
  }

  async updateSubscriptionPayment(subscriptionId: string, paid: boolean) {
    console.log('Updating subscription payment:', subscriptionId, paid);
  }

  async updateSubscriptionStatus(subscriptionId: string, status: string) {
    console.log('Updating subscription status:', subscriptionId, status);
  }

  // Webhook methods
  async createWebhook(webhook: any) {
    console.log('Creating webhook:', webhook);
    return webhook;
  }

  async getWebhooks(userId: string) {
    console.log('Getting webhooks for user:', userId);
    return [];
  }

  async getActiveWebhooks(userId: string, eventType: string) {
    console.log('Getting active webhooks:', userId, eventType);
    return [];
  }

  async deleteWebhook(webhookId: string, userId: string) {
    console.log('Deleting webhook:', webhookId, userId);
  }

  async logWebhookDelivery(delivery: any) {
    console.log('Logging webhook delivery:', delivery);
  }

  // Audit methods
  async createAuditEvent(event: {
    id: string;
    userId: string;
    action: string;
    resource: string;
    resourceId?: string;
    details: Record<string, any>;
    userAgent?: string;
    ipAddress?: string;
    timestamp: Date;
    severity: string;
  }) {
    await db.execute(sql`
      INSERT INTO audit_events (id, user_id, action, resource, resource_id, details, user_agent, ip_address, severity, timestamp)
      VALUES (${event.id}, ${event.userId}, ${event.action}, ${event.resource}, ${event.resourceId}, ${JSON.stringify(event.details)}, ${event.userAgent}, ${event.ipAddress}, ${event.severity}, ${event.timestamp})
    `);
  }

  async getAuditEvents(userId: string, filters?: {
    action?: string;
    resource?: string;
    startDate?: Date;
    endDate?: Date;
    severity?: string;
  }) {
    let query = sql`SELECT * FROM audit_events WHERE user_id = ${userId}`;
    
    if (filters?.action) {
      query = sql`${query} AND action = ${filters.action}`;
    }
    if (filters?.resource) {
      query = sql`${query} AND resource = ${filters.resource}`;
    }
    if (filters?.startDate) {
      query = sql`${query} AND timestamp >= ${filters.startDate}`;
    }
    if (filters?.endDate) {
      query = sql`${query} AND timestamp <= ${filters.endDate}`;
    }
    if (filters?.severity) {
      query = sql`${query} AND severity = ${filters.severity}`;
    }
    
    query = sql`${query} ORDER BY timestamp DESC`;
    
    const result = await db.execute(query);
    return result.rows || [];
  }

  // Integration methods
  async createIntegration(userId: string, integration: any) {
    console.log('Creating integration:', userId, integration);
  }

  async getIntegration(integrationId: string) {
    console.log('Getting integration:', integrationId);
    return null;
  }

  async getIntegrations(userId: string) {
    console.log('Getting integrations for user:', userId);
    return [];
  }

  async updateIntegrationSync(integrationId: string, lastSync: Date) {
    console.log('Updating integration sync:', integrationId, lastSync);
  }

  async updateIntegrationStatus(integrationId: string, status: string) {
    console.log('Updating integration status:', integrationId, status);
  }

  async deleteIntegration(integrationId: string, userId: string) {
    console.log('Deleting integration:', integrationId, userId);
  }

  // Dashboard statistics
  async getDashboardStats(userId: string): Promise<{
    totalDataTypes: number;
    openDsars: number;
    totalDomains: number;
    expiringCerts: number;
    complianceScore: number;
  }> {
    const [dataTypesCount] = await db
      .select({ count: sql<number>`count(*)` })
      .from(dataTypes)
      .where(eq(dataTypes.userId, userId));

    const [openDsarsCount] = await db
      .select({ count: sql<number>`count(*)` })
      .from(dsarRequests)
      .where(
        and(
          eq(dsarRequests.userId, userId),
          sql`${dsarRequests.status} != 'completed'`
        )
      );

    const [domainsCount] = await db
      .select({ count: sql<number>`count(*)` })
      .from(domains)
      .where(eq(domains.userId, userId));

    const thirtyDaysFromNow = new Date();
    thirtyDaysFromNow.setDate(thirtyDaysFromNow.getDate() + 30);

    const [expiringCertsCount] = await db
      .select({ count: sql<number>`count(*)` })
      .from(sslCertificates)
      .innerJoin(domains, eq(sslCertificates.domainId, domains.id))
      .where(
        and(
          eq(domains.userId, userId),
          lt(sslCertificates.validTo, thirtyDaysFromNow),
          gte(sslCertificates.validTo, new Date())
        )
      );

    // Simple compliance score calculation
    const baseScore = 75;
    const dataTypeBonus = Math.min((dataTypesCount.count || 0) * 2, 15);
    const dsarPenalty = Math.min((openDsarsCount.count || 0) * 3, 20);
    const complianceScore = Math.max(50, Math.min(100, baseScore + dataTypeBonus - dsarPenalty));

    return {
      totalDataTypes: dataTypesCount.count || 0,
      openDsars: openDsarsCount.count || 0,
      totalDomains: domainsCount.count || 0,
      expiringCerts: expiringCertsCount.count || 0,
      complianceScore,
    };
  }
}

export const storage = new DatabaseStorage();