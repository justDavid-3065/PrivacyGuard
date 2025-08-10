import https from 'https';
import { storage } from '../storage';

export class SSLMonitor {
  async checkDomain(domainName: string, domainId: string): Promise<void> {
    try {
      const options = {
        hostname: domainName,
        port: 443,
        method: 'GET',
        timeout: 10000,
        servername: domainName,
      };

      const certificate = await this.getCertificateInfo(options);
      
      if (certificate) {
        await storage.createSslCertificate({
          domainId,
          issuer: certificate.issuer,
          subject: certificate.subject,
          validFrom: certificate.validFrom,
          validTo: certificate.validTo,
          isValid: certificate.isValid,
          error: certificate.error,
        });
      }
    } catch (error) {
      console.error(`SSL check failed for ${domainName}:`, error);
      
      // Store error information
      await storage.createSslCertificate({
        domainId,
        issuer: null,
        subject: null,
        validFrom: null,
        validTo: null,
        isValid: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      });
    }
  }

  private getCertificateInfo(options: https.RequestOptions): Promise<{
    issuer: string | null;
    subject: string | null;
    validFrom: Date | null;
    validTo: Date | null;
    isValid: boolean;
    error: string | null;
  }> {
    return new Promise((resolve) => {
      const req = https.request(options, (res) => {
        const cert = (res.socket as any).getPeerCertificate();
        
        if (!cert || Object.keys(cert).length === 0) {
          resolve({
            issuer: null,
            subject: null,
            validFrom: null,
            validTo: null,
            isValid: false,
            error: 'No certificate found',
          });
          return;
        }

        const now = new Date();
        const validFrom = new Date(cert.valid_from);
        const validTo = new Date(cert.valid_to);
        const isValid = now >= validFrom && now <= validTo;

        resolve({
          issuer: cert.issuer?.CN || cert.issuer?.O || 'Unknown',
          subject: cert.subject?.CN || cert.subject?.O || 'Unknown',
          validFrom,
          validTo,
          isValid,
          error: null,
        });

        res.destroy();
      });

      req.on('error', (error) => {
        resolve({
          issuer: null,
          subject: null,
          validFrom: null,
          validTo: null,
          isValid: false,
          error: error.message,
        });
      });

      req.on('timeout', () => {
        resolve({
          issuer: null,
          subject: null,
          validFrom: null,
          validTo: null,
          isValid: false,
          error: 'Connection timeout',
        });
        req.destroy();
      });

      req.end();
    });
  }

  async checkAllDomains(): Promise<void> {
    try {
      // Get all active domains from all users
      const domains = await storage.getDomains(''); // This would need to be modified to get all domains
      
      for (const domain of domains) {
        await this.checkDomain(domain.name, domain.id);
        // Add delay to avoid overwhelming servers
        await new Promise(resolve => setTimeout(resolve, 1000));
      }
    } catch (error) {
      console.error('Error checking all domains:', error);
    }
  }
}

export const sslMonitor = new SSLMonitor();

// Schedule SSL checks every 12 hours
setInterval(() => {
  sslMonitor.checkAllDomains();
}, 12 * 60 * 60 * 1000);
