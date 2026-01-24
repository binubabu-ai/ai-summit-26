# Email Verification & Password Reset Implementation Plan

## Overview
This plan outlines the implementation of a robust email verification and password reset system for Docjays, ensuring security, great UX, and production-ready flows.

## User Flows

### 1. Email Verification Flow

#### A. After Signup
```
User fills signup form
  → Submit
  → Supabase creates account (email_confirmed = false)
  → Send verification email
  → Redirect to /auth/verify-email page
  → Show "Check your inbox" message
  → Display email address
  → Show resend button (disabled for 60 seconds)
  → After timeout, enable resend button
  → User clicks email link
  → Redirect to /auth/callback?type=email
  → Confirm email in Supabase
  → Redirect to /dashboard
```

#### B. Login with Unverified Email
```
User tries to login with unverified email
  → Enter credentials
  → Supabase returns success but email_confirmed = false
  → Detect unverified status
  → Redirect to /auth/verify-email?email={email}
  → Show "Email not verified" message
  → Provide resend option
  → User verifies email
  → Redirect to /dashboard
```

### 2. Forgot Password Flow

```
User clicks "Forgot password?" on login page
  → Redirect to /auth/forgot-password
  → Enter email address
  → Submit
  → Send password reset email
  → Show "Check your inbox" message
  → Display resend button (60s timeout)
  → User clicks email link
  → Redirect to /auth/reset-password?code={token}
  → Enter new password (with confirmation)
  → Submit
  → Update password in Supabase
  → Show success message
  → Auto-redirect to /auth/login after 3 seconds
```

## Technical Implementation

### 1. Environment Variables

Add to `.env` and `.env.local`:
```bash
# Base URL for email links (production and local)
NEXT_PUBLIC_BASE_URL=http://localhost:3000
# Production: https://docjays.vercel.app

# Supabase (existing)
NEXT_PUBLIC_SUPABASE_URL=...
NEXT_PUBLIC_SUPABASE_PUBLISHABLE_DEFAULT_KEY=...
```

### 2. Supabase Configuration

#### Email Templates
Configure in Supabase Dashboard → Authentication → Email Templates:

**Confirmation Email Template:**
```
Subject: Confirm your Docjays account

Hi {{ .Name }},

Thanks for signing up for Docjays! Please confirm your email address by clicking the link below:

{{ .ConfirmationURL }}

This link expires in 24 hours.

If you didn't create an account, you can safely ignore this email.

Best,
The Docjays Team
```

**Password Reset Template:**
```
Subject: Reset your Docjays password

Hi,

We received a request to reset your password for your Docjays account.

Click the link below to reset your password:

{{ .ConfirmationURL }}

This link expires in 1 hour.

If you didn't request this, you can safely ignore this email.

Best,
The Docjays Team
```

#### Auth Settings
- Email confirmation required: **Enabled**
- Confirm email redirect URL: `{NEXT_PUBLIC_BASE_URL}/auth/callback`
- Password reset redirect URL: `{NEXT_PUBLIC_BASE_URL}/auth/reset-password`

### 3. File Structure

```
app/
  auth/
    verify-email/
      page.tsx              # Email verification page with resend
    forgot-password/
      page.tsx              # Enter email for password reset
    reset-password/
      page.tsx              # Enter new password with token
    callback/
      route.ts              # Handle email confirmation callback

lib/
  email/
    verification.ts         # Email verification utilities
    password-reset.ts       # Password reset utilities
```

### 4. API Endpoints

#### `/api/auth/resend-verification` (POST)
- Input: `{ email: string }`
- Action: Resend verification email via Supabase
- Rate limit: 1 request per 60 seconds per email
- Response: `{ success: boolean, message: string }`

#### `/api/auth/send-reset-email` (POST)
- Input: `{ email: string }`
- Action: Send password reset email via Supabase
- Rate limit: 1 request per 60 seconds per email
- Response: `{ success: boolean, message: string }`

#### `/auth/callback` (GET Route Handler)
- Query params: `code`, `type` (email | recovery)
- Action: Exchange code for session
- Redirect to dashboard on success
- Redirect to login with error on failure

### 5. Components

#### VerifyEmailPage
```typescript
- Props: email (from query param or session)
- State:
  - countdown: number (60 seconds)
  - canResend: boolean
  - sending: boolean
  - error: string | null
- Features:
  - Display email being verified
  - Countdown timer for resend button
  - Resend functionality
  - Success/error states
  - Link to login page
```

#### ForgotPasswordPage
```typescript
- State:
  - email: string
  - sent: boolean
  - countdown: number
  - canResend: boolean
  - sending: boolean
  - error: string | null
- Features:
  - Email input
  - Submit button
  - "Check inbox" success state
  - Resend functionality with countdown
  - Link back to login
```

#### ResetPasswordPage
```typescript
- State:
  - password: string
  - confirmPassword: string
  - loading: boolean
  - error: string | null
  - success: boolean
- Features:
  - Password input with requirements
  - Confirm password input
  - Validation (8+ chars, match)
  - Submit button
  - Success state with auto-redirect
  - Link to login
```

### 6. Updated Flows

#### signup/page.tsx
```typescript
// After successful signup
await supabase.auth.signUp({
  email,
  password,
  options: {
    data: { name },
    emailRedirectTo: `${process.env.NEXT_PUBLIC_BASE_URL}/auth/callback`
  }
});

// Redirect to verification page
router.push(`/auth/verify-email?email=${encodeURIComponent(email)}`);
```

#### login/page.tsx
```typescript
// After login attempt
const { data, error } = await supabase.auth.signInWithPassword({ email, password });

if (error) {
  // Handle error
  return;
}

// Check if email is confirmed
if (data.user && !data.user.email_confirmed_at) {
  router.push(`/auth/verify-email?email=${encodeURIComponent(email)}`);
  return;
}

// Proceed to dashboard
router.push('/dashboard');
```

## Security Considerations

1. **Rate Limiting**: Implement 60-second cooldown on resend operations
2. **Token Expiry**:
   - Email verification: 24 hours
   - Password reset: 1 hour
3. **HTTPS Only**: Email links must use HTTPS in production
4. **No User Enumeration**: Always show "Email sent" even if email doesn't exist
5. **Session Management**: Clear old sessions on password reset
6. **Input Validation**: Validate email format, password strength

## UX Enhancements

1. **Visual Feedback**:
   - Loading states on all async operations
   - Success checkmarks
   - Error messages with retry options
   - Countdown timers with progress indicators

2. **Copy to Clipboard**: Allow users to copy verification email for manual checking

3. **Auto-refresh**: On verification page, periodically check if email is confirmed (every 10 seconds)

4. **Helpful Messages**:
   - "Didn't receive email? Check spam folder"
   - "Still having trouble? Contact support"
   - Clear next steps

5. **Mobile-Friendly**: Responsive design, large touch targets

## Testing Checklist

- [ ] Signup → Verify email → Login
- [ ] Signup → Close tab → Login (unverified) → Verify → Login again
- [ ] Forgot password → Reset → Login
- [ ] Resend verification email (multiple times)
- [ ] Resend password reset email (multiple times)
- [ ] Expired verification link
- [ ] Expired password reset link
- [ ] Invalid tokens
- [ ] Already verified email
- [ ] Non-existent email addresses
- [ ] Rate limiting
- [ ] Production deployment with docjays.vercel.app

## Deployment Steps

1. Update environment variables in Vercel:
   - `NEXT_PUBLIC_BASE_URL=https://docjays.vercel.app`

2. Configure Supabase email templates with production URLs

3. Enable email confirmation in Supabase settings

4. Test complete flows in staging environment

5. Monitor email delivery rates and bounce rates

6. Set up support channel for verification issues

## Success Metrics

- Email verification rate: > 80% within 24 hours
- Password reset completion rate: > 70%
- Support tickets related to auth: < 5%
- Average time to verify: < 5 minutes
