# Cloudflare Pages Deployment Checklist

## Issue Summary

After pushing the latest fixes, you're still seeing:
1. ❌ API calls going to wrong domain: `scout.ciris.ai/v1/auth/me` (should be `scoutapi.ciris.ai`)
2. ❌ Double `/v1/v1` paths (now fixed in code)

## Fixes Pushed (Commits 8465e24 and 1331aee)

### What Was Fixed:
1. **Removed `/v1` from SDK baseURL fallback** - Resource methods already include `/v1` in their paths
2. **Added `.replace(/\/v1$/, '')` logic** - SDK now strips `/v1` from environment variable if present
3. **Updated `.env.example`** - Documented the correct format for environment variables

### Expected Behavior After Fix:
- Environment variable: `NEXT_PUBLIC_SCOUT_API_URL=https://scoutapi.ciris.ai/api/scout-remote-test-dahrb9/v1`
- SDK strips `/v1`: `https://scoutapi.ciris.ai/api/scout-remote-test-dahrb9`
- Resource adds `/v1/auth/me`: `https://scoutapi.ciris.ai/api/scout-remote-test-dahrb9/v1/auth/me` ✅

## Action Required: Check Cloudflare Pages Dashboard

### 1. Verify Deployment Status

Go to: **Cloudflare Pages Dashboard** → **scout.ciris.ai project** → **Deployments**

Check:
- [ ] Latest commit `1331aee` is deployed
- [ ] Deployment status is "Success" (not "Building" or "Failed")
- [ ] Deployment timestamp is recent (last 5-10 minutes)

### 2. Check Environment Variables

Go to: **Cloudflare Pages Dashboard** → **Settings** → **Environment Variables**

**Required Environment Variables:**

#### Production Environment:
```
NEXT_PUBLIC_SCOUT_API_URL = https://scoutapi.ciris.ai/api/scout-remote-test-dahrb9/v1
NEXT_PUBLIC_API_BASE_URL = https://scoutapi.ciris.ai/api/scout-remote-test-dahrb9/v1
```

⚠️ **IMPORTANT**: Both should include `/v1` at the end. The SDK will automatically strip it.

#### Check if you have incorrect values:
- ❌ `NEXT_PUBLIC_SCOUT_API_URL = https://scoutapi.ciris.ai` (missing agent path)
- ❌ `NEXT_PUBLIC_SCOUT_API_URL = https://scout.ciris.ai` (wrong domain - frontend instead of backend)
- ❌ Empty or not set

### 3. Clear Cloudflare Cache

If the deployment shows the old URLs, you may need to clear the cache:

**Option A: Purge Everything (Recommended)**
1. Go to **Caching** → **Configuration**
2. Click **Purge Everything**
3. Confirm the purge

**Option B: Via API (Advanced)**
```bash
curl -X POST "https://api.cloudflare.com/client/v4/zones/{zone_id}/purge_cache" \
  -H "Authorization: Bearer {api_token}" \
  -H "Content-Type: application/json" \
  --data '{"purge_everything":true}'
```

### 4. Force Rebuild (If Needed)

If environment variables changed but deployment didn't pick them up:
1. Go to **Deployments**
2. Find the latest deployment (commit `1331aee`)
3. Click **...** (three dots) → **Retry deployment**
4. Wait for rebuild to complete

### 5. Test After Deployment

Once deployed, test in a fresh browser session (or incognito):

1. **Clear browser cache**: Ctrl+F5 or Cmd+Shift+R
2. **Open DevTools Console** (F12)
3. **Navigate to**: `https://scout.ciris.ai`
4. **Click "Sign in with Google"**
5. **Check Console for API calls**

Expected logs:
```
[CIRIS SDK] Creating default client with baseURL: https://scoutapi.ciris.ai/api/scout-remote-test-dahrb9
[CIRIS SDK] Transport debug: {
  baseURL: 'https://scoutapi.ciris.ai/api/scout-remote-test-dahrb9',
  path: '/v1/auth/me',
  finalURL: 'https://scoutapi.ciris.ai/api/scout-remote-test-dahrb9/v1/auth/me'
}
```

❌ **If you still see**:
- `scout.ciris.ai/v1/auth/me` → Environment variable not set or deployment not picked up
- `scoutapi.ciris.ai/v1/v1/...` → Old code still running (deployment didn't update)

## Troubleshooting

### Problem: Still seeing `scout.ciris.ai` (wrong domain)

**Cause**: Environment variables not set in Cloudflare Pages dashboard

**Solution**:
1. Go to **Settings** → **Environment Variables**
2. Add/update:
   - `NEXT_PUBLIC_SCOUT_API_URL` = `https://scoutapi.ciris.ai/api/scout-remote-test-dahrb9/v1`
   - `NEXT_PUBLIC_API_BASE_URL` = `https://scoutapi.ciris.ai/api/scout-remote-test-dahrb9/v1`
3. Save and retry deployment

### Problem: Still seeing double `/v1/v1` paths

**Cause**: Old code still running (deployment didn't update)

**Solution**:
1. Verify latest commit `1331aee` is deployed
2. Check deployment logs for build errors
3. Clear Cloudflare cache
4. Clear browser cache (Ctrl+F5)

### Problem: OAuth callback fails with 404

**Cause**: Backend not configured with correct redirect_uri

**Solution**:
- Verify backend expects: `https://scout.ciris.ai/oauth-complete.html`
- Check `BACKEND_OAUTH_REQUIREMENTS.md` for backend configuration

### Problem: "Failed to fetch" or CORS errors

**Cause**: Backend CORS not allowing requests from `scout.ciris.ai`

**Solution**:
- Backend must allow CORS from: `https://scout.ciris.ai`
- Check backend CORS configuration

## Summary

### Changes Made (Code):
1. ✅ SDK client strips `/v1` from environment variable
2. ✅ Updated `.env.example` with correct format
3. ✅ Added comments explaining the behavior

### Changes Needed (Cloudflare Dashboard):
1. ⚠️ Set environment variables in Cloudflare Pages
2. ⚠️ Verify deployment of commit `1331aee` completed successfully
3. ⚠️ Clear Cloudflare cache if old code persists
4. ⚠️ Test in fresh browser session

## Next Steps

1. **Check Cloudflare Pages Dashboard** → Environment Variables
2. **Verify latest deployment** is live
3. **Clear caches** (Cloudflare + Browser)
4. **Test OAuth flow** in incognito window
5. **Report back** with console logs if still seeing issues

---

**Last Updated**: 2025-10-15
**Commits**: 8465e24, 1331aee
**Status**: Code fixes pushed, awaiting Cloudflare configuration verification
