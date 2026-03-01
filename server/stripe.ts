// Stripe tier product configuration
// Price IDs are set via environment variables after running server/seed-stripe.ts
export const TIER_PRICES: Record<
  string,
  { priceId: string; name: string; credits: number; price: string; features: string[] }
> = {
  tier1: {
    priceId: process.env.STRIPE_TIER1_PRICE_ID || "",
    name: "Mentorship",
    credits: 0,
    price: "$29/mo",
    features: [
      "Full curriculum access (Levels 1–3)",
      "Weekly mentorship content",
      "AI Baseball Mentor (unlimited)",
      "Progress tracking & analytics",
    ],
  },
  tier2: {
    priceId: process.env.STRIPE_TIER2_PRICE_ID || "",
    name: "Mentorship + Video",
    credits: 4,
    price: "$59/mo",
    features: [
      "Everything in Tier 1",
      "4 video feedback submissions/month",
      "Written + video feedback from coaches",
      "Priority review queue",
    ],
  },
  tier3: {
    priceId: process.env.STRIPE_TIER3_PRICE_ID || "",
    name: "Premium Elite",
    credits: 8,
    price: "$99/mo",
    features: [
      "Everything in Tier 2",
      "8 video feedback submissions/month",
      "Live session access",
      "Recruiting blueprint resources",
      "Direct coach messaging",
    ],
  },
};

export function getTierFromPriceId(priceId: string): string {
  for (const [tier, info] of Object.entries(TIER_PRICES)) {
    if (info.priceId && info.priceId === priceId) return tier;
  }
  return "none";
}
