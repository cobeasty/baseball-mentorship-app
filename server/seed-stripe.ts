/**
 * Stripe Product Seed Script
 * Run with: npx tsx server/seed-stripe.ts
 *
 * Creates the three subscription tier products in Stripe (idempotent).
 * After running, copy the printed price IDs to your environment variables:
 *   STRIPE_TIER1_PRICE_ID=price_...
 *   STRIPE_TIER2_PRICE_ID=price_...
 *   STRIPE_TIER3_PRICE_ID=price_...
 */

import { getUncachableStripeClient } from "./stripeClient";

const TIERS = [
  {
    metadataKey: "tier1",
    name: "Elite Mentorship – Tier 1",
    description:
      "Full curriculum access (Levels 1–3), weekly mentorship content, AI Baseball Mentor (unlimited), progress tracking.",
    unitAmount: 2900,
    features: [
      "Full curriculum access (Levels 1–3)",
      "Weekly mentorship content",
      "AI Baseball Mentor (unlimited)",
      "Progress tracking & analytics",
    ],
  },
  {
    metadataKey: "tier2",
    name: "Elite Mentorship – Tier 2 (Video)",
    description:
      "Everything in Tier 1 plus 4 video feedback submissions per month with professional written and video feedback.",
    unitAmount: 5900,
    features: [
      "Everything in Tier 1",
      "4 video feedback submissions/month",
      "Written + video feedback from coaches",
      "Priority review queue",
    ],
  },
  {
    metadataKey: "tier3",
    name: "Elite Mentorship – Tier 3 (Premium Elite)",
    description:
      "Everything in Tier 2 plus 8 video submissions, live session access, recruiting blueprint resources.",
    unitAmount: 9900,
    features: [
      "Everything in Tier 2",
      "8 video feedback submissions/month",
      "Live session access",
      "Recruiting blueprint resources",
      "Direct coach messaging",
    ],
  },
];

async function seedProducts() {
  console.log("Connecting to Stripe...");
  const stripe = await getUncachableStripeClient();
  console.log("Connected.\n");

  const results: Record<string, string> = {};

  for (const tier of TIERS) {
    console.log(`Processing: ${tier.name}`);

    // Check if product already exists (idempotent)
    const existing = await stripe.products.search({
      query: `metadata['tier']:'${tier.metadataKey}'`,
    });

    let product;
    if (existing.data.length > 0) {
      product = existing.data[0];
      console.log(`  ↳ Found existing product: ${product.id}`);
    } else {
      product = await stripe.products.create({
        name: tier.name,
        description: tier.description,
        metadata: {
          tier: tier.metadataKey,
          features: JSON.stringify(tier.features),
        },
      });
      console.log(`  ↳ Created product: ${product.id}`);
    }

    // Check if price already exists for this product
    const existingPrices = await stripe.prices.list({
      product: product.id,
      active: true,
    });

    let price;
    if (existingPrices.data.length > 0) {
      price = existingPrices.data[0];
      console.log(`  ↳ Found existing price: ${price.id} ($${price.unit_amount! / 100}/mo)`);
    } else {
      price = await stripe.prices.create({
        product: product.id,
        unit_amount: tier.unitAmount,
        currency: "usd",
        recurring: { interval: "month" },
        metadata: { tier: tier.metadataKey },
      });
      console.log(`  ↳ Created price: ${price.id} ($${price.unit_amount! / 100}/mo)`);
    }

    results[tier.metadataKey] = price.id;
  }

  console.log("\n✅ Done! Add these to your environment secrets:\n");
  console.log(`STRIPE_TIER1_PRICE_ID=${results["tier1"]}`);
  console.log(`STRIPE_TIER2_PRICE_ID=${results["tier2"]}`);
  console.log(`STRIPE_TIER3_PRICE_ID=${results["tier3"]}`);
  console.log("\nThen restart the application.");
}

seedProducts().catch((err) => {
  console.error("Seed failed:", err.message);
  process.exit(1);
});
