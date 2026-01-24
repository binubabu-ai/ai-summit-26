# Email Verification & Password Reset Setup Guide

This guide explains how to configure and use the email verification and password reset features in Docjays.

## Environment Variables

Add the following to your `.env.local` file:

```bash
# Base URL for email redirects
# Local development
NEXT_PUBLIC_BASE_URL=http://localhost:3000

# Production (Vercel)
# NEXT_PUBLIC_BASE_URL=https://docjays.vercel.app
```

**Important:** Update `NEXT_PUBLIC_BASE_URL` in your Vercel environment variables to `https://docjays.vercel.app` for production.

## Supabase Configuration

### 1. Enable Email Confirmation

Go to Supabase Dashboard → Authentication → Settings:

1. Enable "Confirm email" under Email section
2. Set "Confirmation URL" to: `{{ .ConfirmationURL }}`
3. Set "Redirect URLs" to include:
   - `http://localhost:3000/auth/callback` (development)
   - `https://docjays.vercel.app/auth/callback` (production)

### 2. Configure Email Templates

#### Confirmation Email

Go to Supabase Dashboard → Authentication → Email Templates → Confirm signup:

```html
<h2>Confirm your signup for Docjays</h2>

<p>Hi {{ .Name }},</p>

<p>Thanks for signing up for Docjays! Please confirm your email address by clicking the link below:</p>

<p><a href="{{ .ConfirmationURL }}">Confirm your email address</a></p>

<p>Or copy and paste this URL into your browser:</p>
<p>{{ .ConfirmationURL }}</p>

<p>This link expires in 24 hours.</p>

<p>If you didn't create an account with Docjays, you can safely ignore this email.</p>

<p>Best regards,<br>The Docjays Team</p>
```

#### Password Reset Email

Go to Supabase Dashboard → Authentication → Email Templates → Reset Password:

```html
<h2>Reset your Docjays password</h2>

<p>Hi,</p>

<p>We received a request to reset your password for your Docjays account.</p>

<p>Click the link below to reset your password:</p>

<p><a href="{{ .ConfirmationURL }}">Reset your password</a></p>

<p>Or copy and paste this URL into your browser:</p>
<p>{{ .ConfirmationURL }}</p>

<p>This link expires in 1 hour.</p>

<p>If you didn't request this password reset, you can safely ignore this email. Your password won't be changed.</p>

<p>Best regards,<br>The Docjays Team</p>
```

### 3. SMTP Configuration (Optional but Recommended)

For production, configure custom SMTP for better email deliverability:

Supabase Dashboard → Project Settings → Auth → SMTP Settings:

**Using SendGrid (Recommended):**
- Sender email: `noreply@docjays.com`
- Sender name: `Docjays`
- Host: `smtp.sendgrid.net`
- Port number: `587`
- Username: `apikey`
- Password: `[Your SendGrid API Key]`

**Using AWS SES:**
- Sender email: `noreply@docjays.com`
- Sender name: `Docjays`
- Host: `email-smtp.[region].amazonaws.com`
- Port number: `587`
- Username: `[Your SMTP Username]`
- Password: `[Your SMTP Password]`

## User Flows

### Signup Flow

1. User fills signup form at `/auth/signup`
2. Account created in Supabase (email not confirmed)
3. Verification email sent automatically
4. User redirected to `/auth/verify-email?email={email}`
5. User clicks link in email
6. Callback at `/auth/callback` confirms email
7. User redirected to `/dashboard`

### Login with Unverified Email

1. User tries to login at `/auth/login`
2. Credentials are valid but email not confirmed
3. User redirected to `/auth/verify-email?email={email}`
4. Shows "Email not verified" message with resend option
5. User verifies email and can then login

### Forgot Password Flow

1. User clicks "Forgot password?" on login page
2. Redirected to `/auth/forgot-password`
3. Enters email address and submits
4. Password reset email sent
5. User clicks link in email
6. Redirected to `/auth/reset-password` with session
7. Enters new password
8. Password updated
9. Auto-redirect to `/auth/login` after 3 seconds

## Features

### Email Verification Page (`/auth/verify-email`)

- **Auto-check**: Polls every 10 seconds to detect when email is verified
- **Resend button**: Available after 60-second cooldown
- **Rate limiting**: Prevents spam (60 seconds between requests)
- **Instructions**: Clear next steps for users
- **Email display**: Shows which email to check
- **Success state**: Green checkmark when verified, auto-redirects

### Forgot Password Page (`/auth/forgot-password`)

- **Email input**: Simple, clear form
- **Success state**: Shows "check your inbox" after sending
- **Resend functionality**: 60-second countdown timer
- **Link to login**: Easy navigation back to login

### Reset Password Page (`/auth/reset-password`)

- **Session validation**: Checks for valid reset session on load
- **Password requirements**: Minimum 8 characters
- **Password confirmation**: Must match
- **Show/hide password**: Toggle visibility
- **Strength indicator**: Visual feedback on password strength
- **Expired link handling**: Clear error with link to request new reset

## Security Features

1. **Rate Limiting**: 60-second cooldown on resend operations
2. **Token Expiry**:
   - Email verification: 24 hours
   - Password reset: 1 hour
3. **Session Validation**: Reset password page validates session
4. **No User Enumeration**: Always shows success message even if email doesn't exist
5. **Password Requirements**: Minimum 8 characters enforced

## Testing Checklist

### Email Verification

- [ ] Signup → Receive email → Click link → Dashboard
- [ ] Signup → Close tab → Login without verify → Verify page shown
- [ ] Click resend → Receive new email
- [ ] Test countdown timer (60 seconds)
- [ ] Test auto-check polling (10 seconds)
- [ ] Test with non-existent email

### Password Reset

- [ ] Forgot password → Receive email → Click link → Reset → Login
- [ ] Click resend → Receive new email
- [ ] Test countdown timer
- [ ] Test password validation (8+ chars)
- [ ] Test password mismatch error
- [ ] Test expired reset link
- [ ] Test invalid reset link
- [ ] Test with non-existent email (should still show success)

### Production

- [ ] Test with production BASE_URL
- [ ] Verify email templates render correctly
- [ ] Check spam folders
- [ ] Test from multiple email providers (Gmail, Outlook, etc.)
- [ ] Monitor email delivery rates in Supabase

## Troubleshooting

### Emails Not Being Received

1. **Check Supabase Logs**: Go to Supabase Dashboard → Logs → Auth logs
2. **Check Spam Folder**: Emails might be marked as spam
3. **Verify SMTP**: If using custom SMTP, verify credentials
4. **Check Rate Limits**: Supabase has email rate limits on free tier
5. **Verify Email Domain**: Some email providers block certain domains

### Reset Link Expired

- Links expire after 1 hour for security
- User can request a new reset link at `/auth/forgot-password`

### Email Already Verified

- If user tries to verify already-verified email, they'll be redirected to dashboard
- No error shown, smooth UX

### Missing Environment Variable

- If `NEXT_PUBLIC_BASE_URL` is not set, defaults to `http://localhost:3000`
- **Must** be set in production Vercel environment

## Deployment

### Vercel Setup

1. Add environment variable in Vercel dashboard:
   ```
   NEXT_PUBLIC_BASE_URL=https://docjays.vercel.app
   ```

2. Redeploy the application

3. Update Supabase redirect URLs to include production URL

### Supabase Setup

1. Add production URL to redirect URLs list
2. Update email templates if using custom domain
3. Configure custom SMTP for production
4. Test complete flow in production

## Future Enhancements

1. **Magic Link Login**: Passwordless authentication
2. **2FA**: Two-factor authentication with TOTP
3. **Social Logins**: Google, GitHub, etc.
4. **Email Preferences**: Allow users to customize email notifications
5. **Account Verification Badge**: Show verification status in UI
6. **Email Change Flow**: Verify new email when user changes it
7. **Redis Rate Limiting**: More robust rate limiting in production
8. **Email Templates**: Custom branded HTML templates
9. **Welcome Email**: Send after email verification
10. **Password Policy**: More complex password requirements

## API Endpoints

### `POST /api/auth/resend-verification`

Resend email verification email.

**Request:**
```json
{
  "email": "user@example.com"
}
```

**Response:**
```json
{
  "success": true,
  "message": "Verification email sent successfully"
}
```

**Errors:**
- `400`: Email required
- `429`: Rate limited (60 second cooldown)
- `500`: Unexpected error

### `GET /auth/callback`

Handles email confirmation and password reset callbacks from Supabase.

**Query Params:**
- `code`: Supabase auth code (required)
- `type`: `email` or `recovery` (optional)
- `next`: Redirect path after success (optional, defaults to `/dashboard`)

**Redirects:**
- Email verification: `/dashboard`
- Password reset: `/auth/reset-password?verified=true`
- Error: `/auth/login?error={message}`

## Support

If users are experiencing issues with email verification or password reset:

1. Check Supabase auth logs
2. Verify environment variables are set correctly
3. Test email delivery
4. Check rate limiting logs
5. Review Supabase email settings

For persistent issues, consider adding a "Contact Support" link that directs users to support@docjays.com.
