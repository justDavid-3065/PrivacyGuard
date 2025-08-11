
import type { Express } from "express";
import { installService } from "../services/installService";
import { isAuthenticated } from "../replitAuth";
import { z } from "zod";

const installOptionsSchema = z.object({
  includeSampleData: z.boolean().optional().default(false),
  adminUser: z.object({
    email: z.string().email(),
    firstName: z.string().min(1),
    lastName: z.string().min(1)
  }).optional()
});

export function registerInstallRoutes(app: Express) {
  
  // Check installation status (public endpoint)
  app.get('/api/install/status', async (req, res) => {
    try {
      const status = await installService.checkInstallationStatus();
      res.json(status);
    } catch (error) {
      console.error("Error checking installation status:", error);
      res.status(500).json({ 
        success: false, 
        message: "Failed to check installation status" 
      });
    }
  });

  // Perform installation (public endpoint for initial setup)
  app.post('/api/install', async (req, res) => {
    try {
      // Check if already installed
      const status = await installService.checkInstallationStatus();
      if (status.isInstalled) {
        return res.status(400).json({
          success: false,
          message: "Application is already installed"
        });
      }

      const options = installOptionsSchema.parse(req.body);
      const result = await installService.performInstallation(options);
      
      res.json(result);
    } catch (error) {
      console.error("Installation error:", error);
      res.status(500).json({
        success: false,
        message: "Installation failed",
        error: error instanceof Error ? error.message : "Unknown error"
      });
    }
  });

  // Remove sample data (authenticated endpoint)
  app.delete('/api/install/sample-data', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      // Only allow owners to remove sample data
      const user = await req.storage?.getUser(userId);
      if (user?.role !== 'owner') {
        return res.status(403).json({
          success: false,
          message: "Only owners can remove sample data"
        });
      }

      const result = await installService.removeSampleData();
      res.json(result);
    } catch (error) {
      console.error("Error removing sample data:", error);
      res.status(500).json({
        success: false,
        message: "Failed to remove sample data"
      });
    }
  });

  // Reset installation (authenticated endpoint - dangerous operation)
  app.post('/api/install/reset', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      // Only allow owners to reset installation
      const user = await req.storage?.getUser(userId);
      if (user?.role !== 'owner') {
        return res.status(403).json({
          success: false,
          message: "Only owners can reset installation"
        });
      }

      const result = await installService.resetInstallation();
      res.json(result);
    } catch (error) {
      console.error("Error resetting installation:", error);
      res.status(500).json({
        success: false,
        message: "Failed to reset installation"
      });
    }
  });

  // Get reference data (for dropdowns and filters)
  app.get('/api/install/reference-data', async (req, res) => {
    try {
      // This endpoint provides the reference data for frontend components
      const { type } = req.query;
      
      let query = '';
      switch (type) {
        case 'categories':
          query = 'SELECT * FROM data_category_refs ORDER BY sort_order';
          break;
        case 'consent-statuses':
          query = 'SELECT * FROM consent_status_refs ORDER BY sort_order';
          break;
        case 'dsar-statuses':
          query = 'SELECT * FROM dsar_status_refs ORDER BY sort_order';
          break;
        case 'regulations':
          query = 'SELECT * FROM regulation_refs ORDER BY sort_order';
          break;
        case 'incident-statuses':
          query = 'SELECT * FROM incident_status_refs ORDER BY sort_order';
          break;
        default:
          return res.status(400).json({
            success: false,
            message: "Invalid reference data type"
          });
      }

      const result = await req.db.execute(query);
      res.json(result.rows || []);
    } catch (error) {
      console.error("Error fetching reference data:", error);
      res.status(500).json({
        success: false,
        message: "Failed to fetch reference data"
      });
    }
  });
}
