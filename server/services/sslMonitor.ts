import https from 'https';
import { storage } from '../storage';
import { emailService } from "./emailService";
import { Socket } from 'net';

interface CertificateInfo {
  issuer: string;
  subject: string;
  validFrom: Date;
  validTo: Date;
  isValid: boolean;
}

interface RegionCheck {
  region: string;
  endpoint: string;
  latency: number;
  status: 'success' | 'error';
  error?: string;
}

const REGIONS = [
  { name: 'us-east-1', endpoint: 'https://us-east-ssl-check.example.com' },
  { name: 'us-west-2', endpoint: 'https://us-west-ssl-check.example.com' },
  { name: 'eu-west-1', endpoint: 'https://eu-west-ssl-check.example.com' },
  { name: 'ap-southeast-1', endpoint: 'https://ap-ssl-check.example.com' }
];

class SSLMonitor {
  async checkCertificateMultiRegion(domain: string): Promise<{
    certificate: CertificateInfo | null;
    regionChecks: RegionCheck[];
  }> {
    const certificate = await this.checkCertificate(domain);
    const regionChecks: RegionCheck[] = [];

    // Perform checks from multiple regions
    const regionPromises = REGIONS.map(async (region) => {
      const startTime = Date.now();
      try {
        // Simulate regional check (in production, use actual regional endpoints)
        const latency = Math.random() * 200 + 50; // 50-250ms
        await new Promise(resolve => setTimeout(resolve, latency));
        
        return {
          region: region.name,
          endpoint: region.endpoint,
          latency: Date.now() - startTime,
          status: 'success' as const
        };
      } catch (error) {
        return {
          region: region.name,
          endpoint: region.endpoint,
          latency: Date.now() - startTime,
          status: 'error' as const,
          error: error instanceof Error ? error.message : 'Unknown error'
        };
      }
    });

    const results = await Promise.allSettled(regionPromises);
    results.forEach((result) => {
      if (result.status === 'fulfilled') {
        regionChecks.push(result.value);
      }
    });

    return { certificate, regionChecks };
  }

  async checkCertificate(domain: string): Promise<CertificateInfo | null> {
    return new Promise((resolve) => {
      const options = {
        host: domain,
        port: 443,
        method: 'GET',
        timeout: 10000,
      };

      const req = https.request(options, (res) => {
        const cert = res.socket.getPeerCertificate();

        if (cert && Object.keys(cert).length > 0) {
          const certInfo: CertificateInfo = {
            issuer: cert.issuer?.CN || cert.issuer?.O || 'Unknown',
            subject: cert.subject?.CN || domain,
            validFrom: new Date(cert.valid_from),
            validTo: new Date(cert.valid_to),
            isValid: new Date() < new Date(cert.valid_to) && new Date() > new Date(cert.valid_from)
          };
          resolve(certInfo);
        } else {
          resolve(null);
        }
      });

      req.on('error', () => {
        resolve(null);
      });

      req.on('timeout', () => {
        req.destroy();
        resolve(null);
      });

      req.end();
    });
  }

  async updateCertificateInfo(domainId: string, domainName: string): Promise<void> {
    try {
      const certInfo = await this.checkCertificate(domainName);

      if (certInfo) {
        await storage.createSslCertificate({
          domainId,
          issuer: certInfo.issuer,
          subject: certInfo.subject,
          validFrom: certInfo.validFrom,
          validTo: certInfo.validTo,
          isValid: certInfo.isValid,
          lastChecked: new Date()
        });
      } else {
        await storage.createSslCertificate({
          domainId,
          isValid: false,
          lastChecked: new Date(),
          error: 'Failed to retrieve certificate information'
        });
      }
    } catch (error) {
      console.error(`Error checking SSL certificate for ${domainName}:`, error);

      await storage.createSslCertificate({
        domainId,
        isValid: false,
        lastChecked: new Date(),
        error: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  }

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