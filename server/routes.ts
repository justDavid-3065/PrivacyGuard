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

  const httpServer = createServer(app);
  return httpServer;
}
