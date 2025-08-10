import nodemailer from 'nodemailer';

export class EmailService {
  private transporter: nodemailer.Transporter | null = null;

  constructor() {
    this.initializeTransporter();
  }

  private initializeTransporter(): void {
    // Configure based on environment variables
    const emailConfig = {
      host: process.env.SMTP_HOST || 'smtp.gmail.com',
      port: parseInt(process.env.SMTP_PORT || '587'),
      secure: process.env.SMTP_SECURE === 'true',
      auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS,
      },
    };

    if (emailConfig.auth.user && emailConfig.auth.pass) {
      this.transporter = nodemailer.createTransporter(emailConfig);
    } else {
      console.log('Email service not configured - SMTP credentials missing');
    }
  }

  async sendSSLExpirationAlert(
    recipientEmail: string,
    domainName: string,
    expirationDate: Date,
    daysUntilExpiry: number
  ): Promise<void> {
    if (!this.transporter) {
      console.log('Email service not available - skipping SSL expiration alert');
      return;
    }

    const subject = `SSL Certificate Expiring Soon - ${domainName}`;
    const html = `
      <h2>SSL Certificate Expiration Alert</h2>
      <p>The SSL certificate for <strong>${domainName}</strong> will expire soon.</p>
      <ul>
        <li><strong>Domain:</strong> ${domainName}</li>
        <li><strong>Expiration Date:</strong> ${expirationDate.toLocaleDateString()}</li>
        <li><strong>Days Remaining:</strong> ${daysUntilExpiry}</li>
      </ul>
      <p>Please renew the certificate before it expires to avoid service disruption.</p>
      <p><a href="${process.env.APP_URL || 'https://privacyguard.com'}/ssl-certificates">Manage SSL Certificates</a></p>
    `;

    try {
      await this.transporter.sendMail({
        from: process.env.SMTP_FROM || 'noreply@privacyguard.com',
        to: recipientEmail,
        subject,
        html,
      });
      
      console.log(`SSL expiration alert sent to ${recipientEmail} for ${domainName}`);
    } catch (error) {
      console.error('Failed to send SSL expiration alert:', error);
    }
  }

  async sendDSARReminderEmail(
    recipientEmail: string,
    dsarId: string,
    subjectEmail: string,
    dueDate: Date,
    daysUntilDue: number
  ): Promise<void> {
    if (!this.transporter) {
      console.log('Email service not available - skipping DSAR reminder');
      return;
    }

    const subject = `DSAR Request Due Soon - ${subjectEmail}`;
    const html = `
      <h2>Data Subject Access Request Reminder</h2>
      <p>A DSAR request is due soon and requires your attention.</p>
      <ul>
        <li><strong>Request ID:</strong> ${dsarId}</li>
        <li><strong>Subject:</strong> ${subjectEmail}</li>
        <li><strong>Due Date:</strong> ${dueDate.toLocaleDateString()}</li>
        <li><strong>Days Remaining:</strong> ${daysUntilDue}</li>
      </ul>
      <p>Please complete this request before the deadline to maintain compliance.</p>
      <p><a href="${process.env.APP_URL || 'https://privacyguard.com'}/dsar-manager">View DSAR Request</a></p>
    `;

    try {
      await this.transporter.sendMail({
        from: process.env.SMTP_FROM || 'noreply@privacyguard.com',
        to: recipientEmail,
        subject,
        html,
      });
      
      console.log(`DSAR reminder sent to ${recipientEmail} for ${dsarId}`);
    } catch (error) {
      console.error('Failed to send DSAR reminder:', error);
    }
  }
}

export const emailService = new EmailService();
