# Backend OAuth Requirements

## Overview
The frontend OAuth callback has been updated to capture user email and marketing preferences. The backend needs to pass these values through the OAuth redirect.

## Current OAuth Flow

1. **Frontend initiates OAuth** (login page):
   ```
   GET https://scoutapi.ciris.ai/api/{agent_id}/v1/auth/oauth/{provider}/login
     ?redirect_uri=https://scout.ciris.ai/oauth-complete.html?marketing_opt_in={true|false}
   ```

2. **Backend redirects to OAuth provider** (Google, Discord, etc.)

3. **OAuth provider redirects back to backend** with auth code

4. **Backend exchanges code for tokens** and gets user info

5. **Backend redirects to frontend callback** ⬅️ **THIS IS WHAT NEEDS TO CHANGE**

## Required Changes

### Current Backend Redirect
```
https://scout.ciris.ai/oauth/[agent]/[provider]/callback
  ?access_token={token}
  &token_type=Bearer
  &role={role}
  &user_id={id}
  &expires_in={seconds}
```

### New Backend Redirect (REQUIRED)
```
https://scout.ciris.ai/oauth-complete.html
  ?access_token={token}
  &token_type=Bearer
  &role={role}
  &user_id={id}
  &expires_in={seconds}
  &email={user_email}                    ⬅️ NEW: User's email from OAuth provider
  &marketing_opt_in={true|false}         ⬅️ NEW: From original redirect_uri
  &agent={agent_id}                      ⬅️ NEW: Agent ID (e.g., "scout")
  &provider={provider}                   ⬅️ NEW: OAuth provider (e.g., "google")
```

## Implementation Details

### 1. Extract `marketing_opt_in` from redirect_uri
The frontend sends the marketing preference in the initial OAuth request's `redirect_uri` parameter:
```
redirect_uri=https://scout.ciris.ai/oauth-complete.html?marketing_opt_in=true
```

Backend should:
- Parse the `redirect_uri` query parameter
- Extract the `marketing_opt_in` value from it
- Pass it through to the final redirect

### 2. Get user email from OAuth provider
- **Google OAuth**: Use `email` field from user info endpoint
- **Discord OAuth**: Use `email` field from user object
- Store this in the database if needed
- Pass it in the redirect as `&email={email}`

### 3. Pass agent ID and provider
- Extract `agent_id` from the API path: `/api/{agent_id}/v1/auth/oauth/{provider}/login`
- Pass both in redirect as `&agent={agent_id}&provider={provider}`

### 4. Update redirect URL path
Change from:
```
/oauth/{agent}/{provider}/callback
```

To:
```
/oauth-complete.html
```

## Example Complete Flow

**Step 1: Frontend initiates**
```
GET https://scoutapi.ciris.ai/api/scout/v1/auth/oauth/google/login
  ?redirect_uri=https%3A%2F%2Fscout.ciris.ai%2Foauth-complete.html%3Fmarketing_opt_in%3Dtrue
```

**Step 5: Backend redirects to frontend**
```
Location: https://scout.ciris.ai/oauth-complete.html
  ?access_token=ya29.a0AfH6SMBx...
  &token_type=Bearer
  &role=user
  &user_id=google_123456789
  &expires_in=3600
  &email=user@example.com
  &marketing_opt_in=true
  &agent=scout
  &provider=google
```

## Frontend Behavior

The frontend will:
1. Parse all query parameters
2. Store auth token in `localStorage.ciris_auth_token`
3. Store user data (including email and marketing_opt_in) in `localStorage.ciris_user`
4. Store agent ID and provider for context
5. Redirect user to home page

## Testing

Test with:
```bash
# Success case with all parameters
curl -I "https://scout.ciris.ai/oauth-complete.html?access_token=test&token_type=Bearer&role=user&user_id=123&email=test@example.com&marketing_opt_in=true&agent=scout&provider=google"

# Should return 200 and load the OAuth completion page
```

## Questions?

Contact the ScoutGUI team if you need clarification on any of these requirements.
