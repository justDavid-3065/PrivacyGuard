
import crypto from 'crypto';
import { storage } from '../storage';

interface WebhookEvent {
  type: 'consent.granted' | 'consent.withdrawn' | 'consent.updated';
  data: {
    subjectEmail: string;
    subjectName?: string;
    consentType: string;
    status: string;
    timestamp: string;
    source: string;
    metadata?: Record<string, any>;
  };
  webhook: {
    id: string;
    url: string;
    secret: string;
  };
}

interface WebhookEndpoint {
  id: string;
  userId: string;
  url: string;
  secret: string;
  events: string[];
  active: boolean;
  createdAt: Date;
}

class WebhookService {
  private async generateSignature(payload: string, secret: string): Promise<string> {
    return crypto
      .createHmac('sha256', secret)
      .update(payload)
      .digest('hex');
  }

  async createWebhook(userId: string, url: string, events: string[]): Promise<WebhookEndpoint> {
    const webhook: WebhookEndpoint = {
      id: crypto.randomUUID(),
      userId,
      url,
      secret: crypto.randomBytes(32).toString('hex'),
      events,
      active: true,
      createdAt: new Date()
    };

    await storage.createWebhook(webhook);
    return webhook;
  }

  async sendWebhook(event: WebhookEvent): Promise<boolean> {
    try {
      const payload = JSON.stringify(event);
      const signature = await this.generateSignature(payload, event.webhook.secret);

      const response = await fetch(event.webhook.url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-Webhook-Signature': `sha256=${signature}`,
          'X-Webhook-Event': event.type,
          'User-Agent': 'PrivacyGuard-Webhook/1.0'
        },
        body: payload
      });

      if (!response.ok) {
        console.error(`Webhook delivery failed: ${response.status} ${response.statusText}`);
        return false;
      }

      await storage.logWebhookDelivery({
        webhookId: event.webhook.id,
        eventType: event.type,
        status: 'success',
        responseCode: response.status,
        deliveredAt: new Date()
      });

      return true;
    } catch (error) {
      console.error('Webhook delivery error:', error);
      
      await storage.logWebhookDelivery({
        webhookId: event.webhook.id,
        eventType: event.type,
        status: 'failed',
        error: error instanceof Error ? error.message : 'Unknown error',
        deliveredAt: new Date()
      });

      return false;
    }
  }

  async triggerConsentWebhooks(userId: string, consentData: any): Promise<void> {
    const webhooks = await storage.getActiveWebhooks(userId, 'consent.granted');
    
    const webhookPromises = webhooks.map(async (webhook) => {
      const event: WebhookEvent = {
        type: 'consent.granted',
        data: {
          subjectEmail: consentData.subjectEmail,
          subjectName: consentData.subjectName,
          consentType: consentData.consentType,
          status: consentData.status,
          timestamp: new Date().toISOString(),
          source: 'privacy_guard'
        },
        webhook: {
          id: webhook.id,
          url: webhook.url,
          secret: webhook.secret
        }
      };

      return this.sendWebhook(event);
    });

    await Promise.allSettled(webhookPromises);
  }

  async verifyWebhookSignature(payload: string, signature: string, secret: string): Promise<boolean> {
    const expectedSignature = await this.generateSignature(payload, secret);
    return crypto.timingSafeEqual(
      Buffer.from(signature, 'hex'),
      Buffer.from(expectedSignature, 'hex')
    );
  }

  async getWebhooks(userId: string): Promise<WebhookEndpoint[]> {
    return storage.getWebhooks(userId);
  }

  async deleteWebhook(webhookId: string, userId: string): Promise<void> {
    await storage.deleteWebhook(webhookId, userId);
  }
}

export const webhookService = new WebhookService();
