# Project Overview
A legally compliant, subscription-based web app for baseball athletes ages 14–18 that delivers structured mentorship, mindset development, recruiting education, and limited video feedback from a professional player.

## Architecture
- **Session-based Authentication** (Passport.js LocalStrategy + bcrypt + express-session + connect-pg-simple) — HttpOnly cookies, 30-day sessions stored in PostgreSQL `sessions` table. Requires SESSION_SECRET env var.
- React Frontend (Shadcn UI, Wouter, TanStack Query, framer-motion, clsx, tailwind-merge, date-fns)
- Tailwind CSS dark mode with volt green (`--primary: 69 100% 50%`) athletic design, Oswald/Manrope fonts
- Express + Drizzle Backend (PostgreSQL)
- Stripe for subscription billing (requires STRIPE_SECRET_KEY, STRIPE_TIER1_PRICE_ID, STRIPE_TIER2_PRICE_ID, STRIPE_TIER3_PRICE_ID, STRIPE_WEBHOOK_SECRET)
- S3 private video storage with presigned URLs (requires AWS_ACCESS_KEY_ID, AWS_SECRET_ACCESS_KEY, AWS_S3_BUCKET, AWS_REGION — gracefully degrades to URL-based fallback when unconfigured)

## Features Built

### Compliance & Age Restrictions
- Age gate enforced at onboarding (14–18 only, under-13 blocked)
- DOB collection required for athletes
- Parent email required for minors (under 18)
- All agreements (TOS, Privacy, Liability, Consent) recorded with timestamps
- **Pending approval gate**: Athletes with `approvalStatus=pending` see the PendingApproval screen instead of the dashboard
- **Parental consent flow**: Backend endpoint `/api/parent-consent/send` creates a consent token and `/api/parent-consent/approve?token=...` approves it and activates the athlete's account

### Subscriptions (Stripe)
- Three tiers: Tier 1 (Mentorship $29/mo), Tier 2 (Mentorship+Video $59/mo), Tier 3 (Premium Elite $99/mo)
- Stripe Checkout for subscription creation
- Stripe Billing Portal for managing/canceling
- Webhook handling for: checkout.session.completed, subscription updated/deleted, invoice.paid (resets video credits)
- Video submission credit limits enforced per tier (Tier 1: 0, Tier 2: 4/mo, Tier 3: 8/mo)

### Athlete Portal
- Dashboard: progress tracker, announcements board, subscription banner, recent videos, Coach's Corner tips card
- Training Modules: locked progression through Level 1 (Foundations), Level 2 (Competitive Mindset), Level 3 (Recruiting Blueprint)
- Video Analysis: submit videos (tier-gated), track review status
- Settings: subscription management, billing portal, plan upgrade/downgrade/cancel

### Parent Portal
- Shows linked athletes (matched by parent email on athlete profile)
- Full athlete progress display (modules completed per level)
- Video submission history
- Legal agreements download
- Billing management via Stripe portal

### Admin Dashboard (tabbed interface)
- **Metrics**: total users, active athletes, pending approvals, suspended, tier breakdown, video stats
- **Users**: pending approval queue (approve/deny), full athlete roster with suspend/approve controls
- **Video Queue**: pending reviews with feedback submission, completed reviews archive
- **Content**: create/delete training modules per level
- **Announcements**: post/pin/delete announcements shown on athlete dashboard

## Database Schema
- `users`: id, email, firstName, lastName, profileImageUrl, role, tier, dateOfBirth, parentEmail, approvalStatus, createdAt, updatedAt
- `sessions`: Replit Auth session storage
- `modules`: training content (level 1/2/3, video URL, PDF URL, orderIndex, isPublished)
- `user_progress`: module completion tracking
- `videos`: athlete video submissions (status: submitted/review/completed)
- `video_feedback`: admin written/video feedback per submission
- `agreements`: timestamped TOS/privacy/liability/consent records
- `subscriptions`: Stripe subscription data (customerId, subscriptionId, tier, status, videoCredits)
- `announcements`: platform announcements (pinnable, tier-targeted)
- `parent_consents`: parental consent tokens and approval status
- `conversations` + `messages`: AI mentor chat history

## Security Architecture
- **JWT Auth**: `server/jwtAuth.ts` — `signToken(userId)`, `verifyToken(token)`, `requireAuth` middleware. Token in `Authorization: Bearer` header. Signed with `SESSION_SECRET`.
- **Client storage**: JWT stored in `localStorage` under key `jwt_token`. Cleared on logout.
- **Admin enforcement**: `requireAdmin` middleware on all admin endpoints — returns 403 for non-admins
- **Self-or-admin**: `requireSelfOrAdmin` on user update, agreements, progress — only own data or admin
- **Server-side age validation**: Onboarding enforces 14–18 age gate server-side (cannot be bypassed client-side)
- **Role immutability**: Non-admins cannot change their own `approvalStatus` or `tier` via PUT /api/users/:id
- **Feedback ownership**: Athletes can only view feedback on their own videos
- **Parent portal**: Parent email query only allowed for own email (or admin)
- **Auth upsert safety**: Email uniqueness conflict handled gracefully — won't crash on duplicate emails

## Stripe Integration (stripe-replit-sync pattern)
- Uses Replit connector API for credentials (not environment variable for secret key)
- `server/stripeClient.ts`: Fetches Stripe credentials from Replit connector
- `server/webhookHandlers.ts`: Processes webhooks via stripe-replit-sync + business logic
- `server/seed-stripe.ts`: Idempotent script to create subscription products in Stripe
- Webhook at `/api/stripe/webhook` is registered BEFORE `express.json()` (required for raw Buffer)
- Managed webhook auto-configured by stripe-replit-sync on startup
- stripe-replit-sync syncs all Stripe data to `stripe.*` schema tables on startup

## Environment Variables Required
- `DATABASE_URL`: PostgreSQL connection string (auto-provisioned)
- `SESSION_SECRET`: session encryption secret
- `STRIPE_TIER1_PRICE_ID`: price_1T5zvFPWjKFz5GQ336irv8JW (set)
- `STRIPE_TIER2_PRICE_ID`: price_1T5zvGPWjKFz5GQ3Klf449wL (set)
- `STRIPE_TIER3_PRICE_ID`: price_1T5zvHPWjKFz5GQ3EtriEKUr (set)
- Stripe credentials: provided via Replit connector (no STRIPE_SECRET_KEY env var needed)
