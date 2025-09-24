# Next.js SaaS Template - Replit Setup

## Overview
This is a complete Next.js SaaS template with authentication (Clerk), PostgreSQL database, AI chat features, billing/subscription management, and admin panel. The project has been successfully configured to run in the Replit environment.

## Recent Changes
- **2024-09-24**: Initial project setup in Replit environment
  - Created PostgreSQL database and configured connection
  - Set up environment variables for Replit hosting
  - Configured Next.js for Replit proxy environment
  - Set up workflow to serve on port 5000
  - Configured deployment settings for production

- **2024-09-24**: FiiAI Platform Transformation
  - Removed forced subscription redirects from protected layout
  - Created FiiAI-specific agent pages: Avaliador de Carteiras and Direcionador de Aportes
  - Implemented admin permission system with email-based access control
  - Updated sidebar navigation with FiiAI agents and conditional admin access
  - Configured environment variables for admin email management
  - Fixed post-login flow to provide direct access to dashboard and agents

## Project Architecture
- **Frontend**: Next.js 15 with App Router
- **Authentication**: Clerk (requires configuration)
- **Database**: PostgreSQL with Prisma ORM
- **Styling**: Tailwind CSS + Radix UI components
- **AI Features**: Vercel AI SDK with multiple providers
- **Deployment**: Configured for Replit autoscale deployment

## Key Configuration Files
- `next.config.ts`: Configured for Replit environment with cross-origin support
- `.env.local`: Environment variables (Clerk keys need to be configured)
- `prisma/schema.prisma`: Database schema
- `package.json`: Dependencies and scripts

## Environment Setup
The project is configured with:
- Database URL: Auto-configured from Replit PostgreSQL
- App URL: Auto-configured for Replit domain
- Server binding: 0.0.0.0:5000 for Replit proxy

## Required User Configuration
To fully use the application, users need to:

1. **Clerk Authentication** (Required):
   - Sign up at https://clerk.com
   - Create a new application
   - Add the following environment variables to `.env.local`:
     - `NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY`
     - `CLERK_SECRET_KEY`
     - `CLERK_WEBHOOK_SECRET` (for webhooks)

2. **Optional Integrations**:
   - Stripe for payments (`STRIPE_SECRET_KEY`, etc.)
   - AI providers (OpenAI, Anthropic, etc.)
   - Vercel Blob for file uploads (`BLOB_READ_WRITE_TOKEN`)

## Running the Application
- The Next.js server runs automatically via the configured workflow
- Access the application through Replit's web preview
- Database migrations have been applied automatically

## Features Available
- Landing page with marketing content
- User authentication (Clerk configured and working)
- Protected dashboard area with direct access post-login
- FiiAI Agents:
  - Avaliador de Carteiras (Portfolio Evaluator)
  - Direcionador de Aportes (Investment Director)
- Admin-only features:
  - Carteiras Recomendadas (Recommended Portfolios)
- Excel file upload functionality for portfolio analysis
- Billing and subscription management
- User profile management

## Development Notes
- Uses `--legacy-peer-deps` for npm install due to zod version conflicts
- Prisma client is generated automatically in the workflow
- Database schema is ready and migrated
- TypeScript configuration ignores build errors for faster development
- Admin access controlled via NEXT_PUBLIC_ADMIN_EMAILS environment variable
- FiiAI agents reuse existing portfolio upload and analysis components
- Authentication flow bypasses subscription requirements for immediate agent access