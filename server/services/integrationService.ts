
interface Integration {
  id: string;
  name: string;
  type: 'hubspot' | 'stripe' | 'mailchimp' | 'salesforce' | 'slack';
  config: Record<string, any>;
  status: 'active' | 'inactive' | 'error';
  lastSync?: Date;
}

interface ContactData {
  email: string;
  firstName?: string;
  lastName?: string;
  company?: string;
  source: string;
  consentTypes: string[];
  metadata?: Record<string, any>;
}

class IntegrationService {
  private integrations: Map<string, Integration> = new Map();

  async connectHubSpot(userId: string, apiKey: string): Promise<Integration> {
    try {
      // Validate HubSpot connection
      const response = await fetch('https://api.hubapi.com/contacts/v1/lists/all/contacts/all', {
        headers: {
          'Authorization': `Bearer ${apiKey}`,
          'Content-Type': 'application/json'
        }
      });

      if (!response.ok) {
        throw new Error('Invalid HubSpot API key');
      }

      const integration: Integration = {
        id: crypto.randomUUID(),
        name: 'HubSpot',
        type: 'hubspot',
        config: { apiKey },
        status: 'active',
        lastSync: new Date()
      };

      await storage.createIntegration(userId, integration);
      this.integrations.set(integration.id, integration);

      return integration;
    } catch (error) {
      throw new Error(`HubSpot connection failed: ${error}`);
    }
  }

  async syncHubSpotContacts(integrationId: string): Promise<ContactData[]> {
    const integration = await storage.getIntegration(integrationId);
    if (!integration || integration.type !== 'hubspot') {
      throw new Error('Invalid HubSpot integration');
    }

    try {
      const response = await fetch('https://api.hubapi.com/contacts/v1/lists/all/contacts/all?count=100', {
        headers: {
          'Authorization': `Bearer ${integration.config.apiKey}`,
          'Content-Type': 'application/json'
        }
      });

      const data = await response.json();
      const contacts: ContactData[] = data.contacts?.map((contact: any) => ({
        email: contact.properties?.email?.value || '',
        firstName: contact.properties?.firstname?.value,
        lastName: contact.properties?.lastname?.value,
        company: contact.properties?.company?.value,
        source: 'hubspot',
        consentTypes: ['marketing'], // Default consent type
        metadata: {
          hubspotId: contact.vid,
          lastModified: contact.properties?.lastmodifieddate?.value
        }
      })) || [];

      // Store contacts and create consent records
      for (const contact of contacts) {
        if (contact.email) {
          await storage.createConsentRecord({
            userId: integration.userId,
            subjectEmail: contact.email,
            subjectName: `${contact.firstName || ''} ${contact.lastName || ''}`.trim(),
            consentType: 'marketing',
            status: 'granted',
            method: 'integration',
            policyVersion: '1.0',
            metadata: JSON.stringify(contact.metadata)
          });
        }
      }

      await storage.updateIntegrationSync(integrationId, new Date());
      return contacts;
    } catch (error) {
      await storage.updateIntegrationStatus(integrationId, 'error');
      throw new Error(`HubSpot sync failed: ${error}`);
    }
  }

  async connectSlack(userId: string, webhookUrl: string): Promise<Integration> {
    try {
      // Test Slack webhook
      const testMessage = {
        text: 'Privacy Guard integration test - connection successful!'
      };

      const response = await fetch(webhookUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(testMessage)
      });

      if (!response.ok) {
        throw new Error('Invalid Slack webhook URL');
      }

      const integration: Integration = {
        id: crypto.randomUUID(),
        name: 'Slack',
        type: 'slack',
        config: { webhookUrl },
        status: 'active',
        lastSync: new Date()
      };

      await storage.createIntegration(userId, integration);
      return integration;
    } catch (error) {
      throw new Error(`Slack connection failed: ${error}`);
    }
  }

  async sendSlackAlert(integrationId: string, message: string, severity: 'info' | 'warning' | 'error'): Promise<void> {
    const integration = await storage.getIntegration(integrationId);
    if (!integration || integration.type !== 'slack') {
      throw new Error('Invalid Slack integration');
    }

    const colorMap = {
      info: '#36a64f',
      warning: '#ffb347', 
      error: '#ff6b6b'
    };

    const slackMessage = {
      attachments: [{
        color: colorMap[severity],
        title: 'Privacy Guard Alert',
        text: message,
        timestamp: Math.floor(Date.now() / 1000)
      }]
    };

    await fetch(integration.config.webhookUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(slackMessage)
    });
  }

  async getIntegrations(userId: string): Promise<Integration[]> {
    return storage.getIntegrations(userId);
  }

  async deleteIntegration(integrationId: string, userId: string): Promise<void> {
    await storage.deleteIntegration(integrationId, userId);
    this.integrations.delete(integrationId);
  }

  async scheduleDataSync(integrationId: string): Promise<void> {
    const integration = await storage.getIntegration(integrationId);
    if (!integration) return;

    switch (integration.type) {
      case 'hubspot':
        await this.syncHubSpotContacts(integrationId);
        break;
      // Add other sync methods for different integrations
    }
  }
}

export const integrationService = new IntegrationService();
