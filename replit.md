# Privacy Guard - GDPR & SSL Compliance Platform

## Overview

Privacy Guard is a comprehensive privacy compliance and SSL monitoring platform built with React, Express.js, and PostgreSQL. The application provides tools for GDPR, CCPA, and UK DPA compliance management, including data inventory tracking, consent management, DSAR (Data Subject Access Request) handling, privacy notice management, incident logging, and SSL certificate monitoring with automated alerts.

## User Preferences

Preferred communication style: Simple, everyday language.

## System Architecture

### Frontend Architecture
- **Framework**: React 18 with TypeScript using Vite as the build tool
- **UI Components**: Shadcn/ui component library built on Radix UI primitives
- **Styling**: Tailwind CSS with CSS variables for theming and dark mode support
- **State Management**: React Query (TanStack Query) for server state and data fetching
- **Form Management**: React Hook Form with Zod validation schemas
- **Routing**: Wouter for client-side routing
- **Build Target**: Single-page application served from `/dist/public`

### Backend Architecture
- **Runtime**: Node.js with Express.js framework
- **Language**: TypeScript with ES modules
- **API Design**: RESTful endpoints under `/api` prefix with JSON responses
- **Authentication**: Replit Auth integration using OpenID Connect with Passport.js
- **Session Management**: Express sessions stored in PostgreSQL with connect-pg-simple
- **Request Logging**: Custom middleware for API request/response logging
- **Error Handling**: Centralized error middleware with structured JSON responses

### Database Architecture
- **Database**: PostgreSQL with Neon serverless driver
- **ORM**: Drizzle ORM with schema-first approach
- **Schema Location**: Shared schema definitions in `/shared/schema.ts`
- **Migrations**: Drizzle Kit for schema migrations stored in `/migrations`
- **Connection**: Connection pooling with WebSocket support for serverless environments

### Data Models
The application manages several core entities:
- **Users**: Authentication and role-based access (owner, admin, viewer)
- **Data Types**: Data inventory for GDPR compliance tracking
- **Consent Records**: User consent tracking with timestamps and methods
- **DSAR Requests**: Data subject access request management
- **Privacy Notices**: Version-controlled privacy policy documents
- **Incidents**: Security incident logging and management
- **Domains**: Domain monitoring configuration
- **SSL Certificates**: Automated SSL certificate tracking
- **Alert Settings**: Email, SMS, and webhook notification preferences

### Security Features
- **Authentication**: Required for all application routes except landing page
- **Session Security**: HTTP-only cookies with secure flags
- **CSRF Protection**: Built into session management
- **Input Validation**: Zod schemas for all API inputs
- **SQL Injection Prevention**: Parameterized queries through Drizzle ORM

### Monitoring & Alerting
- **SSL Monitoring**: Automated certificate expiration checking
- **Email Notifications**: Nodemailer integration for alerts
- **Domain Health Checks**: Periodic SSL certificate validation
- **Dashboard Analytics**: Real-time compliance metrics and statistics

## External Dependencies

### Authentication & Session Management
- **Replit Auth**: OpenID Connect provider for user authentication
- **PostgreSQL**: Session storage using connect-pg-simple for persistence

### Database Services
- **Neon Database**: Serverless PostgreSQL hosting with connection pooling
- **Drizzle ORM**: Type-safe database operations with schema validation

### Email Services
- **Nodemailer**: SMTP email delivery for SSL expiration alerts and notifications
- **Configuration**: Environment-based SMTP settings (Gmail, custom SMTP)

### UI & Styling
- **Shadcn/ui**: Pre-built accessible components based on Radix UI
- **Tailwind CSS**: Utility-first CSS framework with custom design tokens
- **Radix UI**: Headless component primitives for accessibility

### Development Tools
- **Vite**: Development server and build tooling with HMR
- **TypeScript**: Static type checking across frontend and backend
- **ESBuild**: Production bundling for server-side code
- **Replit Integration**: Development environment plugins and error overlays

### Third-party Integrations
- **WebSocket Support**: For real-time features via ws library
- **SSL Certificate Validation**: Native HTTPS module for certificate checking
- **Date Handling**: date-fns for consistent date/time operations
- **Form Validation**: @hookform/resolvers for React Hook Form + Zod integration