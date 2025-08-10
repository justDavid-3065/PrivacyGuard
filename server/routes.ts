import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { setupAuth, isAuthenticated } from "./replitAuth";
import { 
  insertDataTypeSchema,
  insertConsentRecordSchema,
  insertDsarRequestSchema,
  insertPrivacyNoticeSchema,
  insertIncidentSchema,
  insertDomainSchema,
  insertAlertSettingsSchema
} from "@shared/schema";
import { z } from "zod";
import { sslMonitor } from "./services/sslMonitor";
import { accessibilityScanner } from "./services/accessibilityScanner";
import { stripeService } from "./services/stripeService";
import { privacyNoticeGenerator } from "./services/privacyNoticeGenerator";
import { webhookService } from "./services/webhookService";
import { auditService } from "./services/auditService";
import { integrationService } from "./services/integrationService";

export async function registerRoutes(app: Express): Promise<Server> {
  // Auth middleware
  await setupAuth(app);

  // Auth routes
  app.get('/api/auth/user', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const user = await storage.getUser(userId);
      res.json(user);
    } catch (error) {
      console.error("Error fetching user:", error);
      res.status(500).json({ message: "Failed to fetch user" });
    }
  });

  // Dashboard stats
  app.get('/api/dashboard/stats', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const stats = await storage.getDashboardStats(userId);
      res.json(stats);
    } catch (error) {
      console.error("Error fetching dashboard stats:", error);
      res.status(500).json({ message: "Failed to fetch dashboard stats" });
    }
  });

  // Data Types routes
  app.post('/api/data-types', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const dataType = insertDataTypeSchema.parse({ ...req.body, userId });
      const result = await storage.createDataType(dataType);
      res.json(result);
    } catch (error) {
      console.error("Error creating data type:", error);
      res.status(400).json({ message: "Failed to create data type" });
    }
  });

  app.get('/api/data-types', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const dataTypes = await storage.getDataTypes(userId);
      res.json(dataTypes);
    } catch (error) {
      console.error("Error fetching data types:", error);
      res.status(500).json({ message: "Failed to fetch data types" });
    }
  });

  app.put('/api/data-types/:id', isAuthenticated, async (req: any, res) => {
    try {
      const { id } = req.params;
      const updates = insertDataTypeSchema.partial().parse(req.body);
      const result = await storage.updateDataType(id, updates);
      res.json(result);
    } catch (error) {
      console.error("Error updating data type:", error);
      res.status(400).json({ message: "Failed to update data type" });
    }
  });

  app.delete('/api/data-types/:id', isAuthenticated, async (req: any, res) => {
    try {
      const { id } = req.params;
      await storage.deleteDataType(id);
      res.json({ success: true });
    } catch (error) {
      console.error("Error deleting data type:", error);
      res.status(500).json({ message: "Failed to delete data type" });
    }
  });

  // Consent Records routes
  app.post('/api/consent-records', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const consent = insertConsentRecordSchema.parse({ ...req.body, userId });
      const result = await storage.createConsentRecord(consent);
      res.json(result);
    } catch (error) {
      console.error("Error creating consent record:", error);
      res.status(400).json({ message: "Failed to create consent record" });
    }
  });

  app.get('/api/consent-records', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const records = await storage.getConsentRecords(userId);
      res.json(records);
    } catch (error) {
      console.error("Error fetching consent records:", error);
      res.status(500).json({ message: "Failed to fetch consent records" });
    }
  });

  // Public consent API endpoint (for websites to submit consent)
  app.post('/api/public/consent', async (req, res) => {
    try {
      const { apiKey, ...consentData } = req.body;
      // In production, validate apiKey and get associated userId
      const userId = "public-api"; // Placeholder - implement proper API key validation
      
      const consent = insertConsentRecordSchema.parse({ 
        ...consentData, 
        userId,
        method: "api"
      });
      const result = await storage.createConsentRecord(consent);
      res.json(result);
    } catch (error) {
      console.error("Error creating consent record via API:", error);
      res.status(400).json({ message: "Failed to create consent record" });
    }
  });

  // DSAR routes
  app.post('/api/dsar-requests', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      
      // Calculate due date (30 days from submission for GDPR)
      const dueDate = new Date();
      dueDate.setDate(dueDate.getDate() + 30);
      
      const request = insertDsarRequestSchema.parse({ 
        ...req.body, 
        userId,
        dueDate
      });
      const result = await storage.createDsarRequest(request);
      res.json(result);
    } catch (error) {
      console.error("Error creating DSAR request:", error);
      res.status(400).json({ message: "Failed to create DSAR request" });
    }
  });

  app.get('/api/dsar-requests', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const requests = await storage.getDsarRequests(userId);
      res.json(requests);
    } catch (error) {
      console.error("Error fetching DSAR requests:", error);
      res.status(500).json({ message: "Failed to fetch DSAR requests" });
    }
  });

  app.put('/api/dsar-requests/:id', isAuthenticated, async (req: any, res) => {
    try {
      const { id } = req.params;
      const updates = insertDsarRequestSchema.partial().parse(req.body);
      const result = await storage.updateDsarRequest(id, updates);
      res.json(result);
    } catch (error) {
      console.error("Error updating DSAR request:", error);
      res.status(400).json({ message: "Failed to update DSAR request" });
    }
  });

  // Privacy Notices routes
  app.post('/api/privacy-notices', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const notice = insertPrivacyNoticeSchema.parse({ ...req.body, userId });
      const result = await storage.createPrivacyNotice(notice);
      res.json(result);
    } catch (error) {
      console.error("Error creating privacy notice:", error);
      res.status(400).json({ message: "Failed to create privacy notice" });
    }
  });

  app.get('/api/privacy-notices', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const notices = await storage.getPrivacyNotices(userId);
      res.json(notices);
    } catch (error) {
      console.error("Error fetching privacy notices:", error);
      res.status(500).json({ message: "Failed to fetch privacy notices" });
    }
  });

  app.put('/api/privacy-notices/:id', isAuthenticated, async (req: any, res) => {
    try {
      const { id } = req.params;
      const updates = insertPrivacyNoticeSchema.partial().parse(req.body);
      const result = await storage.updatePrivacyNotice(id, updates);
      res.json(result);
    } catch (error) {
      console.error("Error updating privacy notice:", error);
      res.status(400).json({ message: "Failed to update privacy notice" });
    }
  });

  app.delete('/api/privacy-notices/:id', isAuthenticated, async (req: any, res) => {
    try {
      const { id } = req.params;
      await storage.deletePrivacyNotice(id);
      res.json({ success: true });
    } catch (error) {
      console.error("Error deleting privacy notice:", error);
      res.status(500).json({ message: "Failed to delete privacy notice" });
    }
  });

  // Incidents routes
  app.post('/api/incidents', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const incident = insertIncidentSchema.parse({ ...req.body, userId });
      const result = await storage.createIncident(incident);
      res.json(result);
    } catch (error) {
      console.error("Error creating incident:", error);
      res.status(400).json({ message: "Failed to create incident" });
    }
  });

  app.get('/api/incidents', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const incidents = await storage.getIncidents(userId);
      res.json(incidents);
    } catch (error) {
      console.error("Error fetching incidents:", error);
      res.status(500).json({ message: "Failed to fetch incidents" });
    }
  });

  app.put('/api/incidents/:id', isAuthenticated, async (req: any, res) => {
    try {
      const { id } = req.params;
      const updates = insertIncidentSchema.partial().parse(req.body);
      const result = await storage.updateIncident(id, updates);
      res.json(result);
    } catch (error) {
      console.error("Error updating incident:", error);
      res.status(400).json({ message: "Failed to update incident" });
    }
  });

  // Domain routes
  app.post('/api/domains', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const domain = insertDomainSchema.parse({ ...req.body, userId });
      const result = await storage.createDomain(domain);
      
      // Trigger initial SSL check
      await sslMonitor.checkDomain(result.name, result.id);
      
      res.json(result);
    } catch (error) {
      console.error("Error creating domain:", error);
      res.status(400).json({ message: "Failed to create domain" });
    }
  });

  app.get('/api/domains', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const domains = await storage.getAllDomainsWithCertificates(userId);
      res.json(domains);
    } catch (error) {
      console.error("Error fetching domains:", error);
      res.status(500).json({ message: "Failed to fetch domains" });
    }
  });

  app.delete('/api/domains/:id', isAuthenticated, async (req: any, res) => {
    try {
      const { id } = req.params;
      await storage.deleteDomain(id);
      res.json({ success: true });
    } catch (error) {
      console.error("Error deleting domain:", error);
      res.status(500).json({ message: "Failed to delete domain" });
    }
  });

  // SSL Certificate routes
  app.get('/api/ssl-certificates/expiring', isAuthenticated, async (req: any, res) => {
    try {
      const { days = 30 } = req.query;
      const certificates = await storage.getExpiringCertificates(parseInt(days as string));
      res.json(certificates);
    } catch (error) {
      console.error("Error fetching expiring certificates:", error);
      res.status(500).json({ message: "Failed to fetch expiring certificates" });
    }
  });

  // Alert Settings routes
  app.get('/api/alert-settings', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const settings = await storage.getAlertSettings(userId);
      res.json(settings || {});
    } catch (error) {
      console.error("Error fetching alert settings:", error);
      res.status(500).json({ message: "Failed to fetch alert settings" });
    }
  });

  app.post('/api/alert-settings', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const settings = insertAlertSettingsSchema.parse({ ...req.body, userId });
      const result = await storage.upsertAlertSettings(settings);
      res.json(result);
    } catch (error) {
      console.error("Error updating alert settings:", error);
      res.status(400).json({ message: "Failed to update alert settings" });
    }
  });

  // Accessibility scanning routes
  app.post('/api/accessibility/scan', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const { url } = req.body;
      const result = await accessibilityScanner.scanUrl(url, userId);
      res.json(result);
    } catch (error) {
      console.error("Error performing accessibility scan:", error);
      res.status(500).json({ message: "Failed to perform accessibility scan" });
    }
  });

  app.get('/api/accessibility/scans', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const scans = await accessibilityScanner.getScanHistory(userId);
      res.json(scans);
    } catch (error) {
      console.error("Error fetching accessibility scans:", error);
      res.status(500).json({ message: "Failed to fetch accessibility scans" });
    }
  });

  // Stripe billing routes
  app.get('/api/billing/plans', async (req, res) => {
    try {
      const plans = stripeService.getPlans();
      res.json(plans);
    } catch (error) {
      console.error("Error fetching billing plans:", error);
      res.status(500).json({ message: "Failed to fetch billing plans" });
    }
  });

  app.post('/api/billing/checkout', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const { planId } = req.body;
      const session = await stripeService.createCheckoutSession(
        userId,
        planId,
        `${req.headers.origin}/dashboard?payment=success`,
        `${req.headers.origin}/billing?payment=cancelled`
      );
      res.json({ sessionUrl: session.url });
    } catch (error) {
      console.error("Error creating checkout session:", error);
      res.status(500).json({ message: "Failed to create checkout session" });
    }
  });

  app.post('/api/billing/webhook', async (req, res) => {
    try {
      const signature = req.headers['stripe-signature'];
      // Verify webhook signature and process event
      await stripeService.handleWebhook(req.body);
      res.json({ received: true });
    } catch (error) {
      console.error("Error processing Stripe webhook:", error);
      res.status(400).json({ message: "Webhook error" });
    }
  });

  // Privacy notice generator routes
  app.get('/api/privacy-notice/templates', isAuthenticated, async (req: any, res) => {
    try {
      const templates = privacyNoticeGenerator.getTemplates();
      res.json(templates);
    } catch (error) {
      console.error("Error fetching templates:", error);
      res.status(500).json({ message: "Failed to fetch templates" });
    }
  });

  app.post('/api/privacy-notice/generate', isAuthenticated, async (req: any, res) => {
    try {
      const { templateId, companyInfo, customSections } = req.body;
      const notice = privacyNoticeGenerator.generateNotice(templateId, companyInfo, customSections);
      res.json({ notice });
    } catch (error) {
      console.error("Error generating privacy notice:", error);
      res.status(500).json({ message: "Failed to generate privacy notice" });
    }
  });

  // Webhook management routes
  app.post('/api/webhooks', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const { url, events } = req.body;
      const webhook = await webhookService.createWebhook(userId, url, events);
      res.json(webhook);
    } catch (error) {
      console.error("Error creating webhook:", error);
      res.status(500).json({ message: "Failed to create webhook" });
    }
  });

  app.get('/api/webhooks', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const webhooks = await webhookService.getWebhooks(userId);
      res.json(webhooks);
    } catch (error) {
      console.error("Error fetching webhooks:", error);
      res.status(500).json({ message: "Failed to fetch webhooks" });
    }
  });

  // Compliance and audit routes
  app.get('/api/compliance/score', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const score = await auditService.calculateComplianceScore(userId);
      res.json(score);
    } catch (error) {
      console.error("Error calculating compliance score:", error);
      res.status(500).json({ message: "Failed to calculate compliance score" });
    }
  });

  app.get('/api/audit/trail', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const trail = await auditService.getAuditTrail(userId, req.query);
      res.json(trail);
    } catch (error) {
      console.error("Error fetching audit trail:", error);
      res.status(500).json({ message: "Failed to fetch audit trail" });
    }
  });

  // Integration routes
  app.post('/api/integrations/hubspot', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const { apiKey } = req.body;
      const integration = await integrationService.connectHubSpot(userId, apiKey);
      res.json(integration);
    } catch (error) {
      console.error("Error connecting HubSpot:", error);
      res.status(500).json({ message: "Failed to connect HubSpot" });
    }
  });

  app.get('/api/integrations', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const integrations = await integrationService.getIntegrations(userId);
      res.json(integrations);
    } catch (error) {
      console.error("Error fetching integrations:", error);
      res.status(500).json({ message: "Failed to fetch integrations" });
    }
  });

  const httpServer = createServer(app);
  return httpServer;
}
