# ScoutGUI Versioning System

This document describes the versioning system implemented for ScoutGUI.

## Overview

ScoutGUI uses a hybrid versioning approach combining:
- **Semantic versioning** (package.json version)
- **Git commit SHA** for exact build traceability
- **Build timestamp** for deployment tracking
- **Git branch** for environment identification

## Version Information Display

### UI Badge
A version badge is displayed in the bottom-right corner of all authenticated pages:
- **Click** to toggle between compact and detailed view
- **Compact**: `v1.5.1 (12e4db7)`
- **Detailed**: `v1.5.1 (12e4db7) - Built on 2025-10-20 at 03:15 UTC from main`

### API Endpoint
Version information is available programmatically at:
```
GET /api/version
```

Response:
```json
{
  "version": "1.5.1",
  "commit": "12e4db7abc123...",
  "commitShort": "12e4db7",
  "buildDate": "2025-10-20T03:15:00.000Z",
  "branch": "main"
}
```

## How It Works

### Build-Time Injection
Version information is injected at build time through environment variables:

```bash
NEXT_PUBLIC_APP_VERSION=$(node -p "require('./package.json').version")
NEXT_PUBLIC_GIT_SHA=$(git rev-parse HEAD)
NEXT_PUBLIC_GIT_BRANCH=$(git rev-parse --abbrev-ref HEAD)
NEXT_PUBLIC_BUILD_DATE=$(date -u +"%Y-%m-%dT%H:%M:%SZ")
```

These are automatically set in the build scripts:
- `pnpm build` - Standard Next.js build
- `pnpm pages:build` - Cloudflare Pages build

### Components

#### lib/version.ts
Core version information module that reads from environment variables.

#### components/VersionBadge.tsx
React components for displaying version information:
- `VersionBadge` - Interactive badge with click-to-expand
- `VersionBadgeCompact` - Minimal display for tight spaces
- `VersionInfoCard` - Full version details card

#### app/api/version/route.ts
API endpoint for programmatic access to version information.

## Cloudflare Pages Integration

When deploying via Cloudflare Pages, the following environment variables are automatically available:
- `CF_PAGES_COMMIT_SHA` - Git commit hash
- `CF_PAGES_BRANCH` - Git branch name

Our build script uses git commands directly, which work in the Cloudflare Pages build environment.

## Updating Versions

### Patch Release (Bug Fixes)
```bash
npm version patch  # 1.5.1 -> 1.5.2
git push && git push --tags
```

### Minor Release (New Features)
```bash
npm version minor  # 1.5.1 -> 1.6.0
git push && git push --tags
```

### Major Release (Breaking Changes)
```bash
npm version major  # 1.5.1 -> 2.0.0
git push && git push --tags
```

## Best Practices

1. **Semantic Versioning**: Follow semver guidelines
   - MAJOR: Breaking changes
   - MINOR: New features (backward compatible)
   - PATCH: Bug fixes (backward compatible)

2. **Git Commits**: Use conventional commits for clarity
   - `feat:` - New features
   - `fix:` - Bug fixes
   - `chore:` - Maintenance tasks
   - `docs:` - Documentation updates

3. **Deployment Verification**: After deploying, check:
   - Version badge in UI shows expected version
   - `/api/version` returns correct commit SHA
   - Build date is recent

4. **Rollback**: If needed, the commit SHA allows exact rollback
   ```bash
   git revert <commit-sha>
   # or
   git reset --hard <commit-sha>
   git push --force
   ```

## Troubleshooting

### Version shows "unknown"
- Git commands may have failed during build
- Check build logs for git-related errors
- Ensure `.git` directory is available during build

### Version not updating
- Clear build cache: `rm -rf .next .vercel`
- Rebuild: `pnpm build`
- For Cloudflare: Trigger a fresh deployment

### Wrong commit SHA displayed
- Cloudflare Pages caches builds
- Use "Retry deployment" to force fresh build
- Check that latest commit is pushed to GitHub

## Example Usage

### In React Components
```typescript
import { VERSION_INFO, getVersionString } from '@/lib/version';

function MyComponent() {
  return <div>Running {getVersionString()}</div>;
}
```

### In API Routes
```typescript
import { VERSION_INFO } from '@/lib/version';

export async function GET() {
  return Response.json({
    ...data,
    version: VERSION_INFO.version,
  });
}
```

### Command Line
```bash
# Check deployed version
curl https://scout.ciris.ai/api/version | jq
```
