# Plan: Fixing React Pages OAuth Callbacks on Cloudflare Pages

## Executive Summary

**Current Issue**: Dynamic OAuth callback routes (`/oauth/[agent]/[provider]/callback`) return 500 errors when using React pages with `@cloudflare/next-on-pages` adapter.

**Working Solution**: Static HTML file (`/oauth-complete.html`) works perfectly but lacks React integration.

**Root Cause**: `@cloudflare/next-on-pages` v1.13.7 has fundamental compatibility issues with:
- Dynamic routes using edge runtime
- Next.js 15 async params
- React Server Components in edge runtime
- The package is officially **deprecated** as of April 2025

**Recommended Path**: Migrate to `@opennextjs/cloudflare` adapter which uses Node.js runtime and provides full Next.js 15 support.

---

## Research Findings

### 1. @cloudflare/next-on-pages Issues

**Package Status**:
- ✅ Currently using: v1.13.7
- 📦 Latest version: v1.13.16
- ⚠️ **DEPRECATED** - Official recommendation is to migrate to OpenNext
- 🚫 Only supports Edge runtime, not Node.js runtime

**Known Issues**:
- Dynamic routes with edge runtime frequently return 500 errors
- React hooks unavailable in edge runtime
- `async_hooks` module errors at runtime
- Route handlers return 404 (not supported)
- Poor compatibility with Next.js 15 features

**Why Our OAuth Route Fails**:
```typescript
// This configuration doesn't work reliably
export const runtime = 'edge';  // ← Edge runtime required but problematic
export const dynamic = 'force-dynamic';

export default function OAuthCallbackPage() {
  // React components in edge runtime are unstable
  return <html>...</html>;
}
```

### 2. OpenNext Cloudflare Adapter (Recommended)

**Package**: `@opennextjs/cloudflare` v1.0.0-beta+

**Key Advantages**:
- ✅ Uses **Node.js runtime** (not edge runtime)
- ✅ Full Next.js 15 support (all minor and patch versions)
- ✅ Supports dynamic routes, route handlers, and React Server Components
- ✅ Better compatibility with Next.js App Router
- ✅ Official Cloudflare recommendation
- ✅ Active development and support

**Supported Features**:
- App Router ✅
- Route Handlers ✅
- Static Site Generation ✅
- Server-Side Rendering ✅
- Middleware ✅
- Image optimization ✅
- Incremental Static Regeneration ✅

**Limitations**:
- Node Middleware (Next.js 15.2+) not yet supported
- Limited Windows support (use WSL)
- Cloudflare Worker size limits apply (3-10 MiB)

---

## Approach Options

### Option 1: Migrate to OpenNext (RECOMMENDED)

**Pros**:
- ✅ Official solution recommended by Cloudflare
- ✅ Fixes dynamic route issues permanently
- ✅ Better long-term support and compatibility
- ✅ Enables React pages for OAuth callback
- ✅ Access to full Node.js runtime features
- ✅ Better Next.js 15 compatibility

**Cons**:
- ⚠️ Requires configuration changes
- ⚠️ Need to test all existing functionality
- ⚠️ Learning curve for new adapter
- ⚠️ Beta status (but production-ready)

**Effort Estimate**: 4-6 hours
- 2 hours: Migration and configuration
- 2 hours: Testing and validation
- 1-2 hours: Documentation updates

**Implementation Steps**:
1. Install `@opennextjs/cloudflare` and remove `@cloudflare/next-on-pages`
2. Create `wrangler.jsonc` with Worker configuration
3. Create `open-next.config.ts` for Cloudflare-specific options
4. Remove `export const runtime = 'edge'` from all pages
5. Update package.json scripts
6. Test OAuth flow end-to-end
7. Test all other app functionality
8. Update documentation

### Option 2: Keep Static HTML + Add Client-Side React

**Pros**:
- ✅ Already working
- ✅ Fast to implement
- ✅ No infrastructure changes
- ✅ Minimal risk

**Cons**:
- ❌ No server-side React integration
- ❌ Can't use Next.js features in OAuth callback
- ❌ Separate codebase for OAuth page
- ❌ Doesn't fix the underlying issue
- ❌ Deprecated adapter remains a technical debt

**Effort Estimate**: 1-2 hours
- Add React client-side hydration to static HTML
- Style with Tailwind classes
- Test OAuth flow

### Option 3: Quick Fixes with Current Adapter (NOT RECOMMENDED)

**Attempt A: Remove Edge Runtime**
```typescript
// Try removing edge runtime
// export const runtime = 'edge'; // ← Comment out

export default function OAuthCallbackPage() {
  return <html>...</html>;
}
```

**Risk**: Cloudflare Pages requires edge runtime for dynamic routes, so this will likely fail at build time.

**Attempt B: Upgrade to v1.13.16**
```bash
pnpm add -D @cloudflare/next-on-pages@1.13.16
```

**Risk**: Package is deprecated and fundamental issues remain. Unlikely to fix 500 errors.

**Attempt C: Minimal Test Route**
Create a simple test route to isolate the issue:
```typescript
// app/test/[id]/page.tsx
export const runtime = 'edge';
export default function TestPage() {
  return <div>Test</div>;
}
```

**Risk**: Will likely also return 500 errors, confirming the adapter limitation.

---

## Recommended Action Plan

### Phase 1: Preparation (Day 1)
1. ✅ **Research completed** - OpenNext is the way forward
2. 📋 Create backup branch of current working state
3. 📋 Document current environment variables and configuration
4. 📋 Set up testing checklist for all app features

### Phase 2: OpenNext Migration (Day 1-2)
1. 📋 Install `@opennextjs/cloudflare` and dependencies
2. 📋 Create `wrangler.jsonc` configuration:
   ```jsonc
   {
     "name": "scoutgui",
     "compatibility_date": "2024-12-30",
     "compatibility_flags": ["nodejs_compat"],
     "pages_build_output_dir": ".open-next/worker"
   }
   ```
3. 📋 Create `open-next.config.ts`:
   ```typescript
   import type { OpenNextConfig } from '@opennextjs/cloudflare';

   const config: OpenNextConfig = {
     default: {
       override: {
         wrapper: 'cloudflare-node',
       },
     },
   };

   export default config;
   ```
4. 📋 Update `package.json` scripts:
   ```json
   {
     "scripts": {
       "pages:build": "npx opennextjs-cloudflare",
       "pages:deploy": "npm run pages:build && wrangler pages deploy",
       "preview": "npm run pages:build && wrangler pages dev"
     }
   }
   ```
5. 📋 Remove `export const runtime = 'edge'` from all pages
6. 📋 Update `next.config.js` if needed
7. 📋 Build and test locally

### Phase 3: OAuth Route Implementation (Day 2)
1. 📋 Update OAuth callback page to use React properly:
   ```typescript
   // app/oauth/[agent]/[provider]/callback/page.tsx
   // NO edge runtime export needed!

   import { redirect } from 'next/navigation';

   type Props = {
     params: Promise<{ agent: string; provider: string }>;
     searchParams: Promise<{
       access_token?: string;
       token_type?: string;
       role?: string;
       user_id?: string;
       expires_in?: string;
       email?: string;
       marketing_opt_in?: string;
     }>;
   };

   export default async function OAuthCallbackPage({ params, searchParams }: Props) {
     const { agent, provider } = await params;
     const query = await searchParams;

     // Could do server-side validation here if needed

     return (
       <html>
         <head>
           <meta charSet="utf-8" />
           <title>Completing Authentication...</title>
           {/* ... styles ... */}
         </head>
         <body>
           <div className="spinner" />
           <script dangerouslySetInnerHTML={{ __html: `
             // Client-side token storage logic
             const params = ${JSON.stringify(query)};
             // ... rest of OAuth logic ...
           ` }} />
         </body>
       </html>
     );
   }
   ```

2. 📋 Test OAuth flow end-to-end
3. 📋 Verify all params captured correctly

### Phase 4: Testing & Validation (Day 2-3)
1. 📋 Test OAuth login flow
2. 📋 Test all existing routes
3. 📋 Test SSR pages
4. 📋 Test API routes
5. 📋 Test static pages
6. 📋 Test middleware
7. 📋 Test image optimization
8. 📋 Performance testing
9. 📋 Load testing if needed

### Phase 5: Deployment (Day 3)
1. 📋 Deploy to Cloudflare Pages preview environment
2. 📋 Test on preview URL
3. 📋 Update environment variables if needed
4. 📋 Deploy to production
5. 📋 Monitor for errors
6. 📋 Update documentation

### Phase 6: Cleanup (Day 3)
1. 📋 Remove deprecated `@cloudflare/next-on-pages` package
2. 📋 Update README.md deployment instructions
3. 📋 Update CI/CD workflows if needed
4. 📋 Archive this planning document

---

## Quick Wins (If Migration Not Approved)

If migrating to OpenNext is not approved or needs to be delayed:

### Quick Win 1: Enhance Static HTML with React Hydration
1. Add React client-side bundle to static HTML
2. Use Tailwind classes for styling consistency
3. Add loading states and error handling
4. Still pure client-side, but better UX

### Quick Win 2: Test Edge Runtime Removal
1. Try removing `export const runtime = 'edge'`
2. See if build succeeds (unlikely)
3. Document findings

### Quick Win 3: Create Minimal Test Route
1. Create simplest possible dynamic route
2. Test if 500 error persists
3. Confirms adapter limitation
4. Builds case for OpenNext migration

---

## Risk Assessment

### Option 1: OpenNext Migration
- **Technical Risk**: 🟡 Medium - Beta status but production-ready
- **Timeline Risk**: 🟡 Medium - 4-6 hours of work
- **Breaking Changes**: 🟡 Medium - Configuration changes, thorough testing needed
- **Long-term Benefit**: 🟢 High - Official solution, better support

### Option 2: Keep Static HTML
- **Technical Risk**: 🟢 Low - Already working
- **Timeline Risk**: 🟢 Low - 1-2 hours
- **Breaking Changes**: 🟢 Low - No changes to existing code
- **Long-term Benefit**: 🔴 Low - Technical debt remains

### Option 3: Quick Fixes
- **Technical Risk**: 🔴 High - Unlikely to work
- **Timeline Risk**: 🟢 Low - Quick to test
- **Breaking Changes**: 🟡 Medium - May break deployment
- **Long-term Benefit**: 🔴 Low - Deprecated adapter remains

---

## Decision Matrix

| Criteria | OpenNext Migration | Static HTML | Quick Fixes |
|----------|-------------------|-------------|-------------|
| Fixes 500 errors | ✅ Yes | ⚠️ N/A (workaround) | ❌ Unlikely |
| React integration | ✅ Full | ⚠️ Client-side only | ❌ No |
| Long-term support | ✅ Official | ❌ DIY | ❌ Deprecated |
| Implementation time | 🟡 4-6 hours | 🟢 1-2 hours | 🟢 1 hour |
| Risk level | 🟡 Medium | 🟢 Low | 🔴 High |
| **RECOMMENDED** | **✅ YES** | ⚠️ Temporary | ❌ No |

---

## Next Steps

1. **Get stakeholder approval** for OpenNext migration
2. **Schedule migration** (recommend 1-2 day sprint)
3. **Create backup branch** before starting
4. **Follow Phase 1-6** implementation plan
5. **Test thoroughly** before production deployment

---

## Questions for Discussion

1. **Timeline**: Can we allocate 4-6 hours for OpenNext migration?
2. **Risk tolerance**: Comfortable with beta software that's production-ready?
3. **Testing resources**: Who can help test all app features after migration?
4. **Rollback plan**: If migration fails, we have working static HTML fallback
5. **Environment**: Any custom Cloudflare Workers configuration we need to preserve?

---

## References

- [OpenNext Cloudflare Documentation](https://opennext.js.org/cloudflare)
- [Cloudflare Next.js Guide](https://developers.cloudflare.com/pages/framework-guides/nextjs/ssr/)
- [@cloudflare/next-on-pages Deprecation Notice](https://github.com/cloudflare/next-on-pages)
- [Next.js 15 Documentation](https://nextjs.org/docs)

---

## Appendix: Configuration Files

### A. wrangler.jsonc (OpenNext)
```jsonc
{
  "name": "scoutgui",
  "compatibility_date": "2024-12-30",
  "compatibility_flags": ["nodejs_compat"],
  "pages_build_output_dir": ".open-next/worker",
  "observability": {
    "enabled": true
  }
}
```

### B. open-next.config.ts
```typescript
import type { OpenNextConfig } from '@opennextjs/cloudflare';

const config: OpenNextConfig = {
  default: {
    override: {
      wrapper: 'cloudflare-node',
      converter: 'edge',
      incrementalCache: 'dummy', // or configure R2 for ISR
    },
  },
};

export default config;
```

### C. Updated package.json scripts
```json
{
  "scripts": {
    "dev": "next dev",
    "build": "next build",
    "pages:build": "npx opennextjs-cloudflare",
    "pages:deploy": "npm run pages:build && wrangler pages deploy",
    "preview": "npm run pages:build && wrangler pages dev",
    "test": "jest"
  }
}
```

---

**Document Status**: Ready for review and approval
**Last Updated**: 2025-10-15
**Author**: Claude Code with ScoutGUI team
