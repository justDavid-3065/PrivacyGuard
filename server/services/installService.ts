
import { db } from "../db";
import { sql } from "drizzle-orm";
import type { User } from "@shared/schema";

interface InstallationOptions {
  includeSampleData?: boolean;
  adminUser?: {
    email: string;
    firstName: string;
    lastName: string;
  };
}

interface InstallationStatus {
  isInstalled: boolean;
  hasReferenceData: boolean;
  hasDefaultConfigurations: boolean;
  sampleDataExists: boolean;
  installationDate?: Date;
}

export class InstallService {
  
  async checkInstallationStatus(): Promise<InstallationStatus> {
    try {
      // Check for installation flag
      const installFlag = await db.execute(sql`
        SELECT value, created_at FROM installation_settings 
        WHERE key = 'installation_complete'
      `);

      // Check for reference data (categories, statuses, regulations)
      const referenceDataCheck = await db.execute(sql`
        SELECT 
          (SELECT COUNT(*) > 0 FROM data_category_refs) as has_categories,
          (SELECT COUNT(*) > 0 FROM consent_status_refs) as has_consent_statuses,
          (SELECT COUNT(*) > 0 FROM dsar_status_refs) as has_dsar_statuses,
          (SELECT COUNT(*) > 0 FROM regulation_refs) as has_regulations,
          (SELECT COUNT(*) > 0 FROM incident_status_refs) as has_incident_statuses
      `);

      // Check for default configurations
      const defaultConfigCheck = await db.execute(sql`
        SELECT 
          (SELECT COUNT(*) > 0 FROM default_alert_settings) as has_alert_defaults,
          (SELECT COUNT(*) > 0 FROM default_retention_policies) as has_retention_defaults
      `);

      // Check for sample operational data
      const sampleDataCheck = await db.execute(sql`
        SELECT 
          (SELECT COUNT(*) FROM data_types WHERE name LIKE 'Sample %') as sample_data_types,
          (SELECT COUNT(*) FROM consent_records WHERE subject_email LIKE '%@example.com') as sample_consents,
          (SELECT COUNT(*) FROM dsar_requests WHERE subject_email LIKE '%@example.com') as sample_dsars
      `);

      const isInstalled = installFlag.rows && installFlag.rows.length > 0;
      const referenceData = referenceDataCheck.rows?.[0];
      const defaultConfig = defaultConfigCheck.rows?.[0];
      const sampleData = sampleDataCheck.rows?.[0];

      return {
        isInstalled,
        hasReferenceData: !!(referenceData?.has_categories && referenceData?.has_consent_statuses),
        hasDefaultConfigurations: !!(defaultConfig?.has_alert_defaults && defaultConfig?.has_retention_defaults),
        sampleDataExists: !!(sampleData && (sampleData.sample_data_types > 0 || sampleData.sample_consents > 0)),
        installationDate: installFlag.rows?.[0]?.created_at
      };
    } catch (error) {
      console.error("Error checking installation status:", error);
      return {
        isInstalled: false,
        hasReferenceData: false,
        hasDefaultConfigurations: false,
        sampleDataExists: false
      };
    }
  }

  async performInstallation(options: InstallationOptions = {}): Promise<{
    success: boolean;
    message: string;
    details: any;
  }> {
    const client = await db.transaction(async (tx) => {
      try {
        // 1. Create installation tracking tables
        await this.createInstallationTables(tx);

        // 2. Seed reference data (categories, statuses, regulations)
        await this.seedReferenceData(tx);

        // 3. Set up default configurations
        await this.setupDefaultConfigurations(tx);

        // 4. Optionally generate sample operational data
        if (options.includeSampleData) {
          await this.generateSampleData(tx, options.adminUser);
        }

        // 5. Mark installation as complete
        await tx.execute(sql`
          INSERT INTO installation_settings (key, value, created_at)
          VALUES ('installation_complete', 'true', NOW())
          ON CONFLICT (key) DO UPDATE SET 
            value = EXCLUDED.value,
            updated_at = NOW()
        `);

        return {
          success: true,
          message: "Installation completed successfully",
          details: {
            referenceDataSeeded: true,
            defaultConfigurationsSet: true,
            sampleDataGenerated: !!options.includeSampleData,
            installationDate: new Date()
          }
        };

      } catch (error) {
        console.error("Installation failed:", error);
        throw error;
      }
    });

    return client;
  }

  private async createInstallationTables(tx: any) {
    // Installation settings table
    await tx.execute(sql`
      CREATE TABLE IF NOT EXISTS installation_settings (
        key VARCHAR PRIMARY KEY,
        value TEXT NOT NULL,
        created_at TIMESTAMP DEFAULT NOW(),
        updated_at TIMESTAMP DEFAULT NOW()
      )
    `);

    // Reference data tables
    await tx.execute(sql`
      CREATE TABLE IF NOT EXISTS data_category_refs (
        id VARCHAR PRIMARY KEY,
        name VARCHAR NOT NULL UNIQUE,
        description TEXT,
        icon VARCHAR,
        sort_order INTEGER DEFAULT 0
      )
    `);

    await tx.execute(sql`
      CREATE TABLE IF NOT EXISTS consent_status_refs (
        id VARCHAR PRIMARY KEY,
        name VARCHAR NOT NULL UNIQUE,
        description TEXT,
        color VARCHAR,
        sort_order INTEGER DEFAULT 0
      )
    `);

    await tx.execute(sql`
      CREATE TABLE IF NOT EXISTS dsar_status_refs (
        id VARCHAR PRIMARY KEY,
        name VARCHAR NOT NULL UNIQUE,
        description TEXT,
        color VARCHAR,
        sort_order INTEGER DEFAULT 0
      )
    `);

    await tx.execute(sql`
      CREATE TABLE IF NOT EXISTS regulation_refs (
        id VARCHAR PRIMARY KEY,
        name VARCHAR NOT NULL UNIQUE,
        full_name TEXT,
        description TEXT,
        jurisdiction VARCHAR,
        sort_order INTEGER DEFAULT 0
      )
    `);

    await tx.execute(sql`
      CREATE TABLE IF NOT EXISTS incident_status_refs (
        id VARCHAR PRIMARY KEY,
        name VARCHAR NOT NULL UNIQUE,
        description TEXT,
        color VARCHAR,
        sort_order INTEGER DEFAULT 0
      )
    `);

    // Default configuration tables
    await tx.execute(sql`
      CREATE TABLE IF NOT EXISTS default_alert_settings (
        id VARCHAR PRIMARY KEY,
        alert_type VARCHAR NOT NULL,
        threshold_days INTEGER,
        is_enabled BOOLEAN DEFAULT true,
        notification_methods JSONB DEFAULT '["email"]'
      )
    `);

    await tx.execute(sql`
      CREATE TABLE IF NOT EXISTS default_retention_policies (
        id VARCHAR PRIMARY KEY,
        data_category VARCHAR NOT NULL,
        retention_period VARCHAR NOT NULL,
        legal_basis VARCHAR,
        description TEXT
      )
    `);
  }

  private async seedReferenceData(tx: any) {
    // Data categories
    const dataCategories = [
      { id: 'personal', name: 'personal', description: 'Personal identification data', icon: 'user', sort_order: 1 },
      { id: 'sensitive', name: 'sensitive', description: 'Sensitive personal data', icon: 'shield', sort_order: 2 },
      { id: 'financial', name: 'financial', description: 'Financial and payment data', icon: 'credit-card', sort_order: 3 },
      { id: 'behavioral', name: 'behavioral', description: 'Behavioral and usage data', icon: 'activity', sort_order: 4 },
      { id: 'technical', name: 'technical', description: 'Technical and system data', icon: 'cpu', sort_order: 5 },
      { id: 'biometric', name: 'biometric', description: 'Biometric data', icon: 'fingerprint', sort_order: 6 },
      { id: 'location', name: 'location', description: 'Location and geographic data', icon: 'map-pin', sort_order: 7 }
    ];

    for (const category of dataCategories) {
      await tx.execute(sql`
        INSERT INTO data_category_refs (id, name, description, icon, sort_order)
        VALUES (${category.id}, ${category.name}, ${category.description}, ${category.icon}, ${category.sort_order})
        ON CONFLICT (name) DO NOTHING
      `);
    }

    // Consent statuses
    const consentStatuses = [
      { id: 'granted', name: 'granted', description: 'Consent has been granted', color: 'green', sort_order: 1 },
      { id: 'withdrawn', name: 'withdrawn', description: 'Consent has been withdrawn', color: 'red', sort_order: 2 },
      { id: 'pending', name: 'pending', description: 'Consent is pending', color: 'yellow', sort_order: 3 },
      { id: 'expired', name: 'expired', description: 'Consent has expired', color: 'gray', sort_order: 4 },
      { id: 'partial', name: 'partial', description: 'Partial consent granted', color: 'orange', sort_order: 5 }
    ];

    for (const status of consentStatuses) {
      await tx.execute(sql`
        INSERT INTO consent_status_refs (id, name, description, color, sort_order)
        VALUES (${status.id}, ${status.name}, ${status.description}, ${status.color}, ${status.sort_order})
        ON CONFLICT (name) DO NOTHING
      `);
    }

    // DSAR statuses
    const dsarStatuses = [
      { id: 'submitted', name: 'submitted', description: 'Request has been submitted', color: 'blue', sort_order: 1 },
      { id: 'in_progress', name: 'in_progress', description: 'Request is being processed', color: 'yellow', sort_order: 2 },
      { id: 'completed', name: 'completed', description: 'Request has been completed', color: 'green', sort_order: 3 },
      { id: 'rejected', name: 'rejected', description: 'Request has been rejected', color: 'red', sort_order: 4 },
      { id: 'cancelled', name: 'cancelled', description: 'Request has been cancelled', color: 'gray', sort_order: 5 }
    ];

    for (const status of dsarStatuses) {
      await tx.execute(sql`
        INSERT INTO dsar_status_refs (id, name, description, color, sort_order)
        VALUES (${status.id}, ${status.name}, ${status.description}, ${status.color}, ${status.sort_order})
        ON CONFLICT (name) DO NOTHING
      `);
    }

    // Regulations
    const regulations = [
      { id: 'gdpr', name: 'GDPR', full_name: 'General Data Protection Regulation', description: 'EU data protection regulation', jurisdiction: 'EU', sort_order: 1 },
      { id: 'ccpa', name: 'CCPA', full_name: 'California Consumer Privacy Act', description: 'California privacy law', jurisdiction: 'California, US', sort_order: 2 },
      { id: 'uk_dpa', name: 'UK_DPA', full_name: 'UK Data Protection Act', description: 'UK data protection law', jurisdiction: 'United Kingdom', sort_order: 3 },
      { id: 'pipeda', name: 'PIPEDA', full_name: 'Personal Information Protection and Electronic Documents Act', description: 'Canadian privacy law', jurisdiction: 'Canada', sort_order: 4 },
      { id: 'lgpd', name: 'LGPD', full_name: 'Lei Geral de Proteção de Dados', description: 'Brazilian data protection law', jurisdiction: 'Brazil', sort_order: 5 },
      { id: 'cdpa', name: 'CDPA', full_name: 'Consumer Data Protection Act', description: 'Virginia privacy law', jurisdiction: 'Virginia, US', sort_order: 6 }
    ];

    for (const regulation of regulations) {
      await tx.execute(sql`
        INSERT INTO regulation_refs (id, name, full_name, description, jurisdiction, sort_order)
        VALUES (${regulation.id}, ${regulation.name}, ${regulation.full_name}, ${regulation.description}, ${regulation.jurisdiction}, ${regulation.sort_order})
        ON CONFLICT (name) DO NOTHING
      `);
    }

    // Incident statuses
    const incidentStatuses = [
      { id: 'open', name: 'open', description: 'Incident is open and being investigated', color: 'red', sort_order: 1 },
      { id: 'investigating', name: 'investigating', description: 'Incident is under investigation', color: 'yellow', sort_order: 2 },
      { id: 'resolved', name: 'resolved', description: 'Incident has been resolved', color: 'green', sort_order: 3 },
      { id: 'closed', name: 'closed', description: 'Incident has been closed', color: 'gray', sort_order: 4 }
    ];

    for (const status of incidentStatuses) {
      await tx.execute(sql`
        INSERT INTO incident_status_refs (id, name, description, color, sort_order)
        VALUES (${status.id}, ${status.name}, ${status.description}, ${status.color}, ${status.sort_order})
        ON CONFLICT (name) DO NOTHING
      `);
    }
  }

  private async setupDefaultConfigurations(tx: any) {
    // Default alert settings
    const defaultAlerts = [
      { id: 'ssl_expiry_30', alert_type: 'ssl_expiry', threshold_days: 30, is_enabled: true, notification_methods: JSON.stringify(['email']) },
      { id: 'ssl_expiry_15', alert_type: 'ssl_expiry', threshold_days: 15, is_enabled: true, notification_methods: JSON.stringify(['email']) },
      { id: 'ssl_expiry_7', alert_type: 'ssl_expiry', threshold_days: 7, is_enabled: true, notification_methods: JSON.stringify(['email', 'sms']) },
      { id: 'ssl_expiry_1', alert_type: 'ssl_expiry', threshold_days: 1, is_enabled: true, notification_methods: JSON.stringify(['email', 'sms', 'slack']) },
      { id: 'dsar_overdue', alert_type: 'dsar_overdue', threshold_days: 0, is_enabled: true, notification_methods: JSON.stringify(['email']) },
      { id: 'consent_expiry', alert_type: 'consent_expiry', threshold_days: 30, is_enabled: true, notification_methods: JSON.stringify(['email']) }
    ];

    for (const alert of defaultAlerts) {
      await tx.execute(sql`
        INSERT INTO default_alert_settings (id, alert_type, threshold_days, is_enabled, notification_methods)
        VALUES (${alert.id}, ${alert.alert_type}, ${alert.threshold_days}, ${alert.is_enabled}, ${alert.notification_methods})
        ON CONFLICT (id) DO NOTHING
      `);
    }

    // Default retention policies
    const retentionPolicies = [
      { id: 'personal_contract', data_category: 'personal', retention_period: '7 years', legal_basis: 'contract', description: 'Personal data for contractual purposes' },
      { id: 'personal_consent', data_category: 'personal', retention_period: '2 years', legal_basis: 'consent', description: 'Personal data based on consent' },
      { id: 'financial_legal', data_category: 'financial', retention_period: '7 years', legal_basis: 'legal_obligation', description: 'Financial data for legal compliance' },
      { id: 'sensitive_consent', data_category: 'sensitive', retention_period: '1 year', legal_basis: 'consent', description: 'Sensitive data requiring explicit consent' },
      { id: 'technical_legitimate', data_category: 'technical', retention_period: '2 years', legal_basis: 'legitimate_interest', description: 'Technical data for system operation' },
      { id: 'behavioral_consent', data_category: 'behavioral', retention_period: '2 years', legal_basis: 'consent', description: 'Behavioral data for analytics' }
    ];

    for (const policy of retentionPolicies) {
      await tx.execute(sql`
        INSERT INTO default_retention_policies (id, data_category, retention_period, legal_basis, description)
        VALUES (${policy.id}, ${policy.data_category}, ${policy.retention_period}, ${policy.legal_basis}, ${policy.description})
        ON CONFLICT (id) DO NOTHING
      `);
    }
  }

  private async generateSampleData(tx: any, adminUser?: { email: string; firstName: string; lastName: string }) {
    // Create sample admin user if provided
    let sampleUserId = 'sample-admin-user';
    if (adminUser) {
      await tx.execute(sql`
        INSERT INTO users (id, email, first_name, last_name, role)
        VALUES (${sampleUserId}, ${adminUser.email}, ${adminUser.firstName}, ${adminUser.lastName}, 'owner')
        ON CONFLICT (email) DO UPDATE SET
          first_name = EXCLUDED.first_name,
          last_name = EXCLUDED.last_name,
          role = EXCLUDED.role
      `);
    }

    // Sample data types
    const sampleDataTypes = [
      { name: 'Sample Email Addresses', description: 'User email addresses for communication', category: 'personal', purpose: 'Marketing communications', source: 'Website signup form', retention: '2 years', legal_basis: 'consent' },
      { name: 'Sample Payment Information', description: 'Credit card and billing data', category: 'financial', purpose: 'Payment processing', source: 'Checkout process', retention: '7 years', legal_basis: 'contract' },
      { name: 'Sample Biometric Data', description: 'Fingerprint and facial recognition data', category: 'biometric', purpose: 'Security authentication', source: 'Mobile app', retention: '1 year', legal_basis: 'consent' },
      { name: 'Sample Location Data', description: 'GPS coordinates and location history', category: 'location', purpose: 'Service delivery', source: 'Mobile app', retention: '6 months', legal_basis: 'legitimate_interest' },
      { name: 'Sample Usage Analytics', description: 'Website usage and behavior data', category: 'behavioral', purpose: 'Service improvement', source: 'Website cookies', retention: '2 years', legal_basis: 'legitimate_interest' }
    ];

    for (const dataType of sampleDataTypes) {
      await tx.execute(sql`
        INSERT INTO data_types (name, description, category, purpose, source, retention, legal_basis, user_id)
        VALUES (${dataType.name}, ${dataType.description}, ${dataType.category}, ${dataType.purpose}, ${dataType.source}, ${dataType.retention}, ${dataType.legal_basis}, ${sampleUserId})
      `);
    }

    // Sample consent records
    const sampleConsents = [
      { subject_email: 'john.doe@example.com', subject_name: 'John Doe', consent_type: 'marketing', status: 'granted', policy_version: 'v1.0', method: 'website' },
      { subject_email: 'jane.smith@example.com', subject_name: 'Jane Smith', consent_type: 'analytics', status: 'granted', policy_version: 'v1.0', method: 'website' },
      { subject_email: 'bob.wilson@example.com', subject_name: 'Bob Wilson', consent_type: 'necessary', status: 'granted', policy_version: 'v1.0', method: 'api' },
      { subject_email: 'alice.johnson@example.com', subject_name: 'Alice Johnson', consent_type: 'marketing', status: 'withdrawn', policy_version: 'v1.0', method: 'email' },
      { subject_email: 'charlie.brown@example.com', subject_name: 'Charlie Brown', consent_type: 'biometric', status: 'pending', policy_version: 'v1.1', method: 'mobile_app' }
    ];

    for (const consent of sampleConsents) {
      await tx.execute(sql`
        INSERT INTO consent_records (subject_email, subject_name, consent_type, status, policy_version, method, user_id)
        VALUES (${consent.subject_email}, ${consent.subject_name}, ${consent.consent_type}, ${consent.status}, ${consent.policy_version}, ${consent.method}, ${sampleUserId})
      `);
    }

    // Sample DSAR requests
    const sampleDsars = [
      { subject_email: 'john.doe@example.com', subject_name: 'John Doe', request_type: 'access', description: 'Request for all personal data', status: 'in_progress' },
      { subject_email: 'jane.smith@example.com', subject_name: 'Jane Smith', request_type: 'deletion', description: 'Request for data deletion', status: 'submitted' },
      { subject_email: 'bob.wilson@example.com', subject_name: 'Bob Wilson', request_type: 'rectification', description: 'Request to correct personal information', status: 'completed' },
      { subject_email: 'alice.johnson@example.com', subject_name: 'Alice Johnson', request_type: 'portability', description: 'Request for data export', status: 'submitted' }
    ];

    for (const dsar of sampleDsars) {
      const dueDate = new Date();
      dueDate.setDate(dueDate.getDate() + 30);
      
      await tx.execute(sql`
        INSERT INTO dsar_requests (subject_email, subject_name, request_type, description, status, due_date, user_id)
        VALUES (${dsar.subject_email}, ${dsar.subject_name}, ${dsar.request_type}, ${dsar.description}, ${dsar.status}, ${dueDate}, ${sampleUserId})
      `);
    }

    // Sample privacy notices
    const sampleNotices = [
      { title: 'Sample Privacy Policy', content: 'This is a comprehensive sample privacy policy for demonstration purposes...', version: 'v1.0', regulation: 'GDPR', is_active: true },
      { title: 'Sample Cookie Policy', content: 'This sample cookie policy explains how we use cookies...', version: 'v1.0', regulation: 'GDPR', is_active: true },
      { title: 'Sample CCPA Notice', content: 'This notice is for California residents regarding their privacy rights...', version: 'v1.0', regulation: 'CCPA', is_active: false }
    ];

    for (const notice of sampleNotices) {
      await tx.execute(sql`
        INSERT INTO privacy_notices (title, content, version, regulation, is_active, effective_date, user_id)
        VALUES (${notice.title}, ${notice.content}, ${notice.version}, ${notice.regulation}, ${notice.is_active}, NOW(), ${sampleUserId})
      `);
    }

    // Sample incidents
    const sampleIncidents = [
      { title: 'Sample Data Breach - Email Server', description: 'Unauthorized access to email server containing customer data', severity: 'high', status: 'resolved', affected_records: 1500, discovered_at: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000) },
      { title: 'Sample Phishing Attack', description: 'Phishing email sent to employees', severity: 'medium', status: 'investigating', affected_records: 0, discovered_at: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000) },
      { title: 'Sample System Vulnerability', description: 'Security vulnerability discovered in payment system', severity: 'critical', status: 'open', affected_records: 5000, discovered_at: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000) }
    ];

    for (const incident of sampleIncidents) {
      await tx.execute(sql`
        INSERT INTO incidents (title, description, severity, status, affected_records, discovered_at, user_id)
        VALUES (${incident.title}, ${incident.description}, ${incident.severity}, ${incident.status}, ${incident.affected_records}, ${incident.discovered_at}, ${sampleUserId})
      `);
    }

    // Sample domains
    const sampleDomains = [
      { name: 'sample-website.com' },
      { name: 'demo.example.org' }
    ];

    for (const domain of sampleDomains) {
      await tx.execute(sql`
        INSERT INTO domains (name, user_id)
        VALUES (${domain.name}, ${sampleUserId})
        ON CONFLICT (name) DO NOTHING
      `);
    }
  }

  async removeSampleData(): Promise<{ success: boolean; message: string; removedCount: number }> {
    try {
      let totalRemoved = 0;

      const result = await db.transaction(async (tx) => {
        // Remove sample data types
        const dataTypesResult = await tx.execute(sql`
          DELETE FROM data_types WHERE name LIKE 'Sample %'
        `);
        totalRemoved += dataTypesResult.rowCount || 0;

        // Remove sample consent records
        const consentsResult = await tx.execute(sql`
          DELETE FROM consent_records WHERE subject_email LIKE '%@example.com'
        `);
        totalRemoved += consentsResult.rowCount || 0;

        // Remove sample DSAR requests
        const dsarsResult = await tx.execute(sql`
          DELETE FROM dsar_requests WHERE subject_email LIKE '%@example.com'
        `);
        totalRemoved += dsarsResult.rowCount || 0;

        // Remove sample privacy notices
        const noticesResult = await tx.execute(sql`
          DELETE FROM privacy_notices WHERE title LIKE 'Sample %'
        `);
        totalRemoved += noticesResult.rowCount || 0;

        // Remove sample incidents
        const incidentsResult = await tx.execute(sql`
          DELETE FROM incidents WHERE title LIKE 'Sample %'
        `);
        totalRemoved += incidentsResult.rowCount || 0;

        // Remove sample domains
        const domainsResult = await tx.execute(sql`
          DELETE FROM domains WHERE name IN ('sample-website.com', 'demo.example.org')
        `);
        totalRemoved += domainsResult.rowCount || 0;

        // Remove sample admin user (optional)
        const userResult = await tx.execute(sql`
          DELETE FROM users WHERE id = 'sample-admin-user'
        `);
        totalRemoved += userResult.rowCount || 0;

        return totalRemoved;
      });

      return {
        success: true,
        message: `Successfully removed ${result} sample data records`,
        removedCount: result
      };
    } catch (error) {
      console.error("Error removing sample data:", error);
      return {
        success: false,
        message: "Failed to remove sample data",
        removedCount: 0
      };
    }
  }

  async resetInstallation(): Promise<{ success: boolean; message: string }> {
    try {
      await db.transaction(async (tx) => {
        // Remove all installation data
        await tx.execute(sql`DELETE FROM installation_settings`);
        await tx.execute(sql`DROP TABLE IF EXISTS data_category_refs CASCADE`);
        await tx.execute(sql`DROP TABLE IF EXISTS consent_status_refs CASCADE`);
        await tx.execute(sql`DROP TABLE IF EXISTS dsar_status_refs CASCADE`);
        await tx.execute(sql`DROP TABLE IF EXISTS regulation_refs CASCADE`);
        await tx.execute(sql`DROP TABLE IF EXISTS incident_status_refs CASCADE`);
        await tx.execute(sql`DROP TABLE IF EXISTS default_alert_settings CASCADE`);
        await tx.execute(sql`DROP TABLE IF EXISTS default_retention_policies CASCADE`);
      });

      return {
        success: true,
        message: "Installation reset successfully"
      };
    } catch (error) {
      console.error("Error resetting installation:", error);
      return {
        success: false,
        message: "Failed to reset installation"
      };
    }
  }
}

export const installService = new InstallService();
