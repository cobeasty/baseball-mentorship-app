# Project Overview
A legally compliant, subscription-based web app for athletes ages 13–18 that delivers structured baseball mentorship, mindset development, recruiting education, and limited video feedback from a professional player.

## Architecture
- Replit Auth for user accounts (sessions stored in PostgreSQL)
- React Frontend (Shadcn UI, Wouter, React Query)
- Express + Drizzle Backend (PostgreSQL)

## Notes
- Stripe integration was deferred by the user. If they decide to implement it, we will need to either ask them to complete the Replit Integration for Stripe or provide their `STRIPE_SECRET_KEY` and `STRIPE_WEBHOOK_SECRET` in the Replit Secrets manager. Right now, payments and tier upgrades are mocked via a direct API call in the frontend.
