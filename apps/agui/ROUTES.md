# Scout GUI - Route Reference Guide

This document provides a comprehensive overview of all major routes and features in the Scout GUI application.

## 🏠 Main Application Routes

### `/` (Home/Interact Page)
**Purpose**: Main chat interface for interacting with Scout
**Features**:
- Real-time conversation with Scout agent
- Live reasoning visualization via SSE
- Task and thought timeline display
- Environmental impact tracking (carbon, water, tokens)
- Basic and Detailed view modes

### `/interact`
**Purpose**: Dedicated interact page (same as home)
**Features**: Identical to `/` - primary chat interface

### `/dashboard`
**Purpose**: Overview dashboard
**Features**: System overview and quick access to key features

## 👤 Account Management

### `/account`
**Purpose**: Main account management page
**Features**: Account overview and links to account sub-pages

### `/account/settings`
**Purpose**: User account settings
**Features**: Profile settings, preferences, account configuration

### `/account/api-keys`
**Purpose**: API key management
**Features**: Create, view, and revoke API keys for programmatic access

### `/account/privacy`
**Purpose**: Privacy settings and controls
**Features**: Data privacy preferences, data deletion requests

### `/account/consent`
**Purpose**: Consent management
**Features**: Review and manage consent preferences for data usage

## 💳 Billing & Usage

### `/billing`
**Purpose**: Billing and subscription management
**Features**:
- View usage statistics
- Manage subscription plans
- Payment method management
- Billing history
- Usage tracking and limits

## 🧠 Memory & Knowledge

### `/memory`
**Purpose**: Memory graph visualization
**Features**:
- Interactive memory graph
- Knowledge relationships
- Memory entries and context

## 🔐 Privacy & Consent

### `/consent`
**Purpose**: Global consent management page
**Features**: Data usage consent, marketing preferences, research participation

### `/account/consent`
**Purpose**: Account-level consent settings
**Features**: User-specific consent preferences

### `/account/privacy`
**Purpose**: Privacy settings and data controls
**Features**: Privacy preferences, data export, data deletion

## 🔑 Authentication

### `/login`
**Purpose**: User login page
**Features**: Username/password login, OAuth provider links

### `/oauth/[agent]/[provider]/callback`
**Purpose**: OAuth callback handler
**Features**: Processes OAuth responses from Google, Discord, etc.

### `/oauth-callback`
**Purpose**: Legacy OAuth callback
**Features**: Alternative OAuth callback endpoint

### `/oauth-complete.html` (Public file)
**Purpose**: OAuth completion page
**Features**: Stores tokens and redirects to `/interact` after successful OAuth

## 🛠️ System & Administration

### `/agents`
**Purpose**: Agent selection and management
**Features**: View and select available agents

### `/system`
**Purpose**: System monitoring and health
**Features**:
- System health status
- Service status monitoring
- System metrics

### `/services`
**Purpose**: Service health dashboard
**Features**: Individual service health and status

### `/status-dashboard`
**Purpose**: Comprehensive status dashboard
**Features**: Overall system status and metrics

### `/runtime`
**Purpose**: Runtime control and monitoring
**Features**:
- Runtime configuration
- Process control
- Real-time system state

### `/audit`
**Purpose**: Audit trail viewer
**Features**:
- View audit logs
- Hash chain verification
- Action history

### `/config`
**Purpose**: Configuration management
**Features**: System and agent configuration settings

### `/logs`
**Purpose**: System logs viewer
**Features**: View and search system logs

### `/users`
**Purpose**: User management (admin only)
**Features**: Manage user accounts and permissions

## 🔧 Tools & Utilities

### `/tools`
**Purpose**: Agent tools management
**Features**: View and configure available agent tools

### `/comms`
**Purpose**: Communication channels
**Features**: Manage communication channels and messaging

### `/wa` (WhatsApp Integration)
**Purpose**: WhatsApp integration
**Features**: WhatsApp communication setup and management

## 📚 Documentation & Testing

### `/docs`
**Purpose**: Documentation viewer
**Features**: API documentation, guides, help content

### `/api-demo`
**Purpose**: API demonstration page
**Features**: Interactive API examples and testing

### `/test-auth`
**Purpose**: Authentication testing
**Features**: Test authentication flows (dev/staging only)

### `/test-login`
**Purpose**: Login testing
**Features**: Test login functionality (dev/staging only)

### `/test-sdk`
**Purpose**: SDK testing
**Features**: Test SDK methods and integration (dev/staging only)

### `/debug-env`
**Purpose**: Environment variable debugging
**Features**: View environment configuration (dev/staging only)

## 🔌 API Routes

### `/api/version`
**Purpose**: Application version information
**Method**: GET
**Response**:
```json
{
  "version": "1.5.1",
  "commit": "12e4db7...",
  "commitShort": "12e4db7",
  "buildDate": "2025-10-20T03:15:00.000Z",
  "branch": "main"
}
```

## 🗺️ Route Categories

### Public Routes (No Auth Required)
- `/login`
- `/oauth/**`
- `/oauth-callback`
- `/api/version`

### Protected Routes (Auth Required)
- `/` (home/interact)
- `/interact`
- `/account/**`
- `/billing`
- `/memory`
- `/consent`
- `/dashboard`

### Admin Routes (Admin Role Required)
- `/users`
- `/system`
- `/services`
- `/audit`
- `/config`
- `/logs`
- `/runtime`
- `/status-dashboard`

### Development Routes (Dev/Staging Only)
- `/test-auth`
- `/test-login`
- `/test-sdk`
- `/debug-env`

## 🎯 Quick Access Map

**For End Users:**
- Chat with Scout: `/` or `/interact`
- Manage Account: `/account`
- View Memory: `/memory`
- Check Billing: `/billing`
- Privacy Settings: `/account/privacy`
- Consent Management: `/account/consent`

**For Admins:**
- System Health: `/system` or `/status-dashboard`
- User Management: `/users`
- Audit Trail: `/audit`
- Configuration: `/config`
- Logs: `/logs`

**For Developers:**
- API Demo: `/api-demo`
- Test Auth: `/test-auth`
- SDK Testing: `/test-sdk`
- Documentation: `/docs`

## 🔄 Common Navigation Flows

### First-Time User:
1. `/login` → OAuth → `/oauth-complete.html` → `/interact`
2. `/interact` - Start chatting with Scout
3. `/account/consent` - Review and accept consent

### Regular User Session:
1. `/login` - Sign in
2. `/interact` - Primary interaction
3. `/memory` - Review conversation history
4. `/billing` - Check usage

### Admin Session:
1. `/login` - Admin sign in
2. `/status-dashboard` - Check system health
3. `/audit` - Review audit trail
4. `/users` - Manage users
5. `/config` - Adjust settings

## 📱 Mobile-Friendly Routes

All routes are designed to be responsive, but these are particularly optimized for mobile:
- `/interact` - Chat interface
- `/account` - Account management
- `/billing` - Billing overview
- `/login` - Login page

## 🔗 External Redirects

After OAuth completion, users are redirected to:
- **Default**: `/interact`
- **Custom**: Value stored in `localStorage.authReturnUrl`

## Notes

- All authenticated routes check for valid JWT token
- Admin routes verify user role before allowing access
- Test/debug routes are typically disabled in production
- API routes use `/api/*` prefix
- OAuth flows use `/oauth/*` patterns
