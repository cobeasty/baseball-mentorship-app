# Project Overview
A legally compliant, subscription-based web app for baseball athletes ages 14–18 that delivers structured mentorship, mindset development, recruiting education, and limited video feedback from a professional player.

## Architecture
- Replit Auth (OIDC) for user accounts (sessions stored in PostgreSQL)
- React Frontend (Shadcn UI, Wouter, TanStack Query)
- Express + Drizzle Backend (PostgreSQL)
- Stripe for subscription billing (requires STRIPE_SECRET_KEY, STRIPE_TIER1_PRICE_ID, STRIPE_TIER2_PRICE_ID, STRIPE_TIER3_PRICE_ID, STRIPE_WEBHOOK_SECRET)

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
- Dashboard: progress tracker, announcements board, subscription banner, recent videos
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

## Environment Variables Required
- `DATABASE_URL`: PostgreSQL connection string (auto-provisioned)
- `SESSION_SECRET`: session encryption secret
- `STRIPE_SECRET_KEY`: Stripe secret key
- `STRIPE_WEBHOOK_SECRET`: Stripe webhook signing secret
- `STRIPE_TIER1_PRICE_ID`: Stripe price ID for Tier 1
- `STRIPE_TIER2_PRICE_ID`: Stripe price ID for Tier 2
- `STRIPE_TIER3_PRICE_ID`: Stripe price ID for Tier 3
