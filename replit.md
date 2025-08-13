
# Privacy Guard - Comprehensive Privacy Compliance SaaS Platform

## Overview

Privacy Guard is a comprehensive SaaS platform built with TypeScript, PostgreSQL, and Replit Auth that helps organizations manage privacy compliance across multiple regulations including GDPR, CCPA, and more. The platform provides advanced features for SSL monitoring, accessibility scanning, audit logging, and third-party integrations.

## Core Architecture

### Technology Stack
- **Frontend**: React with TypeScript, TailwindCSS, shadcn/ui components
- **Backend**: Express.js with TypeScript
- **Database**: PostgreSQL with Drizzle ORM
- **Authentication**: Replit Auth
- **Payments**: Stripe integration
- **Mobile**: React Native with Expo

### Database Schema
The application uses a comprehensive database schema with the following core tables:
- `users` - User accounts and profiles
- `data_types` - Data inventory management
- `consent_records` - Consent tracking and management
- `dsar_requests` - Data Subject Access Requests
- `privacy_notices` - Privacy policy management
- `incidents` - Security incident tracking
- `domains` - Domain monitoring
- `ssl_certificates` - SSL certificate tracking
- `accessibility_scans` - Accessibility audit results
- `subscriptions` - Billing and subscription management
- `webhooks` - Webhook endpoint management
- `audit_events` - Comprehensive audit logging
- `integrations` - Third-party service integrations

## Core Features

### 1. Data Inventory Management
- Comprehensive data type cataloging
- Legal basis tracking for GDPR compliance
- Data processing purpose documentation
- Retention period management

### 2. Consent Management
- Multi-channel consent collection (website, API, manual)
- Granular consent tracking by purpose
- Consent withdrawal mechanisms
- Audit trail for all consent changes

### 3. DSAR (Data Subject Access Request) Management
- Automated request intake and tracking
- 30-day deadline monitoring
- Status workflow management
- Response documentation

### 4. Privacy Notice Management
- Multi-jurisdiction template support (GDPR, CCPA, UK DPA, PIPEDA)
- Automated notice generation
- Version control and change tracking
- Compliance validation

### 5. Incident Management
- Security incident logging
- Severity classification
- Response workflow tracking
- Regulatory notification requirements

## Advanced Features

### 1. AI-Powered Accessibility Scanning
- **Website accessibility audits** with WCAG compliance checking
- **AI-generated suggestions** for accessibility improvements
- **Automated scanning** with scheduled checks
- **Impact assessment** and priority scoring

**API Endpoints:**
```
POST /api/accessibility/scan
GET /api/accessibility/scans
```

### 2. Stripe Subscription Billing
- **Multiple subscription tiers**: Starter ($29/mo), Professional ($79/mo), Enterprise ($199/mo)
- **Feature-based access control** with usage limits
- **Automated billing cycles** and payment processing
- **Webhook-based subscription management**

**Subscription Plans:**
- **Starter**: Up to 5 domains, basic SSL monitoring, email alerts
- **Professional**: Up to 25 domains, advanced SSL monitoring, multi-region checks, API access
- **Enterprise**: Unlimited domains, all advanced features, priority support, custom integrations

**API Endpoints:**
```
GET /api/billing/plans
POST /api/billing/checkout
POST /api/billing/webhook
```

### 3. Advanced SSL Certificate Monitoring
- **Multi-region SSL checks** from 4 global regions (US East/West, EU West, Asia Pacific)
- **Real-time certificate validation** with expiration tracking
- **Performance monitoring** with latency measurements
- **Automated alert system** for certificate issues

**Monitoring Features:**
- Certificate validity verification
- Expiration date tracking (30, 60, 90-day alerts)
- Multi-region availability testing
- SSL configuration security analysis

### 4. Automated Privacy Notice Generator
- **Template-based generation** for multiple jurisdictions
- **GDPR templates** with Article 13/14 compliance
- **CCPA templates** with consumer rights documentation
- **Custom section support** for organization-specific requirements
- **Compliance validation** and gap analysis

**Supported Jurisdictions:**
- GDPR (European Union)
- CCPA (California)
- UK DPA (United Kingdom)
- PIPEDA (Canada)

### 5. Real-Time Webhook Integration
- **Consent tracking webhooks** for real-time updates
- **Secure webhook delivery** with HMAC signature verification
- **Event filtering** by consent type and status
- **Delivery retry logic** with failure handling
- **Webhook endpoint management** with status monitoring

**Supported Events:**
- `consent.granted` - New consent recorded
- `consent.withdrawn` - Consent withdrawal
- `consent.updated` - Consent modification

### 6. Advanced Audit Logging & Compliance Scoring
- **Comprehensive activity logging** with user, IP, and timestamp tracking
- **Real-time compliance scoring** based on multiple metrics
- **Risk assessment** with automated recommendations
- **Security event detection** with alert triggers
- **Compliance reporting** with exportable audit trails

**Compliance Metrics:**
- Data Inventory Completeness (25% weight)
- Consent Management (20% weight)
- Privacy Notices (15% weight)
- DSAR Response Time (20% weight)
- Security Measures (20% weight)

### 7. Third-Party Integrations
- **HubSpot CRM integration** for contact and consent synchronization
- **Slack notifications** for critical alerts and updates
- **Stripe payment processing** for subscription management
- **Custom API integrations** for enterprise clients

**Integration Features:**
- OAuth-based authentication where supported
- Real-time data synchronization
- Bi-directional consent updates
- Error handling and retry logic

### 8. React Native Mobile Application
- **Cross-platform mobile app** for iOS and Android
- **Dashboard overview** with key compliance metrics
- **Consent management** on-the-go
- **DSAR request handling** from mobile devices
- **SSL monitoring alerts** and status updates
- **Push notifications** for critical events

## API Documentation

### Authentication
All API endpoints require authentication using Replit Auth. Include the session token in the Authorization header.

### Core API Endpoints

#### Data Types
```
POST /api/data-types - Create new data type
GET /api/data-types - List user's data types
PUT /api/data-types/:id - Update data type
DELETE /api/data-types/:id - Delete data type
```

#### Consent Records
```
POST /api/consent-records - Create consent record
GET /api/consent-records - List consent records
POST /api/public/consent - Public API for consent submission
```

#### DSAR Requests
```
POST /api/dsar-requests - Create DSAR request
GET /api/dsar-requests - List DSAR requests
PUT /api/dsar-requests/:id - Update DSAR request
```

#### Domain & SSL Monitoring
```
POST /api/domains - Add domain for monitoring
GET /api/domains - List monitored domains
DELETE /api/domains/:id - Remove domain
GET /api/ssl-certificates/expiring - Get expiring certificates
```

### Advanced API Endpoints

#### Accessibility Scanning
```
POST /api/accessibility/scan - Perform accessibility scan
GET /api/accessibility/scans - Get scan history
```

#### Billing & Subscriptions
```
GET /api/billing/plans - Get subscription plans
POST /api/billing/checkout - Create checkout session
```

#### Privacy Notice Generation
```
GET /api/privacy-notice/templates - Get available templates
POST /api/privacy-notice/generate - Generate privacy notice
```

#### Webhooks
```
POST /api/webhooks - Create webhook endpoint
GET /api/webhooks - List user webhooks
```

#### Compliance & Audit
```
GET /api/compliance/score - Get compliance score
GET /api/audit/trail - Get audit trail
```

#### Integrations
```
POST /api/integrations/hubspot - Connect HubSpot
GET /api/integrations - List integrations
```

## Database Migrations

The application includes comprehensive database migrations:

1. **0001_initial.sql** - Core tables (users, data_types, consent_records, etc.)
2. **0002_add_triggers.sql** - Database triggers for automated timestamps
3. **0003_seed_data.sql** - Initial seed data for testing
4. **0004_new_features.sql** - Advanced features tables (accessibility_scans, subscriptions, webhooks, etc.)

Run migrations using:
```bash
node migrations/migrate.js
```

## Testing

### Test Structure
```
tests/
├── unit/                          # Unit tests for individual services
│   ├── accessibility-scanner.test.ts
│   ├── audit-service.test.ts
│   ├── schema-validation.test.ts
│   ├── storage.test.ts
│   └── stripe-service.test.ts
├── integration/                   # Integration tests for API endpoints
│   ├── advanced-features.test.ts
│   ├── api.test.ts
│   ├── privacy-compliance.test.ts
│   ├── ssl-monitor.test.ts
│   └── ssl-monitoring.test.ts
└── setup.ts                      # Test configuration and utilities
```

### Running Tests
```bash
npm test                    # Run all tests
npm run test:unit          # Run unit tests only
npm run test:integration   # Run integration tests only
npm run test:coverage     # Run tests with coverage report
```

## Security Features

### Data Protection
- **Encryption at rest** for sensitive data
- **TLS encryption** for all API communications
- **Input validation** and sanitization
- **SQL injection protection** via parameterized queries

### Access Control
- **Role-based access control** (RBAC)
- **API rate limiting** to prevent abuse
- **Session management** with secure cookies
- **CORS protection** for cross-origin requests

### Audit & Monitoring
- **Comprehensive audit logging** for all user actions
- **Real-time security alerts** for suspicious activity
- **Failed login attempt tracking**
- **Data access monitoring** with detailed logs

## Deployment

### Environment Variables

**CRITICAL:** The following environment variables must be configured in Replit Secrets before deployment:

#### Required for Core Functionality
```
DATABASE_URL=postgresql://username:password@host:port/database_name
REPLIT_DOMAINS=your-replit-domain.replit.app
REPL_ID=your-repl-id-here
SESSION_SECRET=your-32-character-random-session-secret
STRIPE_SECRET_KEY=sk_test_your_stripe_secret_key_here
```

#### Required for Email Services
```
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_SECURE=false
SMTP_USER=your-email@gmail.com
SMTP_PASS=your-app-password-here
SMTP_FROM=noreply@privacyguard.com
```

#### Application Configuration
```
PORT=5000
NODE_ENV=production
APP_URL=https://your-app-domain.com
```

#### Optional Advanced Features
```
OPENAI_API_KEY=your-openai-api-key-for-ai-features
HUBSPOT_API_KEY=your-hubspot-api-key-for-integration
SLACK_WEBHOOK_URL=your-slack-webhook-url-for-notifications
```

**Installation Note:** Use the `ask_secrets` tool during import to request these values from the user, as the codebase requires them to be present for proper operation.

### Production Setup
1. Configure environment variables
2. Run database migrations
3. Set up SSL certificates
4. Configure monitoring and alerting
5. Deploy to Replit Autoscale

## Compliance Standards

### GDPR Compliance
- **Article 13/14** information requirements
- **Article 7** consent requirements
- **Article 15-22** data subject rights
- **Article 25** data protection by design
- **Article 32** security of processing

### CCPA Compliance
- **Consumer rights** implementation
- **Data category** disclosure
- **Opt-out mechanisms** for data sales
- **Non-discrimination** requirements

### Security Standards
- **SOC 2 Type II** controls framework
- **ISO 27001** security management
- **OWASP Top 10** vulnerability protection

## Support & Maintenance

### Monitoring
- **Application performance monitoring** with metrics
- **Database performance** optimization
- **SSL certificate** automated renewal
- **Compliance score** trending analysis

### Backup & Recovery
- **Automated daily backups** with 30-day retention
- **Point-in-time recovery** capabilities
- **Disaster recovery** procedures
- **Data export** functionality for compliance

## Future Roadmap

### Planned Features
- **SAML/SSO integration** for enterprise customers
- **Advanced analytics** with custom dashboards
- **Machine learning** for compliance risk prediction
- **Multi-language support** for global compliance
- **Advanced workflow automation** with approval processes

### Technical Improvements
- **GraphQL API** for more efficient data fetching
- **Real-time notifications** via WebSocket
- **Microservices architecture** for better scalability
- **Advanced caching** with Redis integration

---

For technical support or feature requests, please contact the development team through the Replit workspace.
