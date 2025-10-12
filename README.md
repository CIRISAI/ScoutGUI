# ScoutGUI

A dedicated web interface for Scout, a production-ready AI agent with transparent ethical reasoning.

## Overview

ScoutGUI provides a Next.js 15-based frontend for interacting with Scout, featuring:
- Real-time reasoning visualization via Server-Sent Events (SSE)
- Full transparency into decision-making processes
- OAuth authentication (Google, Discord)
- Environmental impact tracking
- Billing integration for production usage

## Structure

- **apps/agui** – Next.js 15 frontend using the CIRIS SDK
- **docker/** – Dockerfiles for local development (optional)
- **scripts/** – Development and deployment scripts

## Development

### Prerequisites
- Node.js 18+ and pnpm
- Access to Scout API (via Cloudflare)

### Setup

1. Install dependencies:
   ```bash
   cd apps/agui
   pnpm install
   ```

2. Copy environment configuration:
   ```bash
   cp .env.example .env.local
   ```

3. Update `.env.local` with your Scout API URL:
   ```bash
   NEXT_PUBLIC_SCOUT_API_URL=https://your-scout-api-url.com
   ```

4. Run development server:
   ```bash
   pnpm dev
   ```

The interface will be available at `http://localhost:3000`

## Environment Variables

Key configuration variables:

- `NEXT_PUBLIC_SCOUT_API_URL` – Scout agent API base URL (accessed through Cloudflare)
- `NEXT_PUBLIC_API_BASE_URL` – Alias for Scout API URL
- `NEXT_PUBLIC_SCOUT_API_PORT` – API port (default: 8080, for local development)

See `.env.example` for complete configuration options.

## Production Deployment (Cloudflare Pages)

ScoutGUI is configured for deployment to Cloudflare Pages using Wrangler.

### Prerequisites

- [Wrangler CLI](https://developers.cloudflare.com/workers/wrangler/install-and-update/) installed globally
- Cloudflare account with Pages enabled
- Scout API endpoint configured at `scoutapi.ciris.ai`

### Initial Setup

1. Install Wrangler globally (if not already installed):
   ```bash
   npm install -g wrangler
   ```

2. Authenticate with Cloudflare:
   ```bash
   wrangler login
   ```

3. Navigate to the app directory:
   ```bash
   cd apps/agui
   ```

### Building for Cloudflare Pages

Build the Next.js app for Cloudflare Pages:

```bash
npm run pages:build
```

This command:
- Runs Next.js build with static export
- Uses `@cloudflare/next-on-pages` adapter
- Outputs to `.vercel/output/static` directory

### Deploying to Production

Deploy to Cloudflare Pages:

```bash
npm run pages:deploy
```

This will build and deploy your application. The first deployment will create a new Pages project.

### Environment Variables

Configure environment variables in the Cloudflare dashboard:

1. Go to your Cloudflare Pages project
2. Navigate to Settings → Environment variables
3. Add the following variables:

   **Production:**
   - `NEXT_PUBLIC_SCOUT_API_URL` = `https://scoutapi.ciris.ai`
   - `NEXT_PUBLIC_API_BASE_URL` = `https://scoutapi.ciris.ai`
   - `NEXT_PUBLIC_SCOUT_API_PORT` = `8080`
   - `NEXT_PUBLIC_OAUTH_CLIENT_ID` = (your OAuth client ID)
   - `NEXT_PUBLIC_OAUTH_REDIRECT_URI` = `https://yourdomain.com/oauth/scout/google/callback`

   **Preview (optional):**
   Set the same variables for preview deployments if needed.

### OAuth Configuration

Update your OAuth provider settings with the production callback URLs:

- **Google OAuth:** `https://yourdomain.com/oauth/scout/google/callback`
- **Discord OAuth:** `https://yourdomain.com/oauth/scout/discord/callback`

Replace `yourdomain.com` with your actual Cloudflare Pages domain.

### Custom Domain Setup

1. In Cloudflare Pages dashboard, go to your project
2. Navigate to Custom domains
3. Add your domain (e.g., `scout.ciris.ai`)
4. Update DNS records as instructed
5. Update OAuth redirect URIs to match your custom domain

### Local Preview

Test the Cloudflare Pages build locally:

```bash
npm run preview
```

This builds the app and serves it using Wrangler's local development server.

### Continuous Deployment

For automatic deployments:

1. Connect your GitHub repository to Cloudflare Pages
2. Configure build settings:
   - **Build command:** `cd apps/agui && npm install && npm run pages:build`
   - **Build output directory:** `apps/agui/.vercel/output/static`
   - **Root directory:** `/`
3. Set environment variables in the Cloudflare dashboard
4. Every push to your main branch will trigger a deployment

### Troubleshooting

**Build failures:**
- Ensure all dependencies are installed: `pnpm install`
- Check that `output: 'export'` is set in `next.config.js`
- Verify environment variables are set correctly

**OAuth callback errors:**
- Verify redirect URIs match exactly in OAuth provider settings
- Check that callback URLs use HTTPS in production
- Ensure environment variables are set in Cloudflare dashboard

**API connection issues:**
- Confirm `NEXT_PUBLIC_SCOUT_API_URL` points to `https://scoutapi.ciris.ai`
- Check CORS settings on the Scout API
- Verify the API is accessible from your deployment

## Features

### For Users
- **Interactive Chat**: Communicate with Scout in natural language
- **Reasoning Transparency**: See each thought processed through Scout's decision-making pipeline
- **View Modes**: Toggle between Basic (simplified) and Detailed (full pipeline) views
- **Environmental Impact**: Track carbon emissions and water usage for each interaction

### For Administrators
- System monitoring and health checks
- User management and access control
- Audit trail viewing
- Runtime control and configuration

## Architecture

ScoutGUI is built as a single-agent interface (unlike multi-agent CIRISGUI):
- Hardcoded to connect to Scout agent only
- No agent selection or discovery
- Simplified authentication flow
- Direct API communication via Cloudflare

## License

See LICENSE file for details.
