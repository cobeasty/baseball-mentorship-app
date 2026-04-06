import { getStripeSync } from "./stripeClient";
import { storage } from "./storage";
import { TIER_PRICES, getTierFromPriceId } from "./stripe";

export async function processStripeWebhook(payload: Buffer, signature: string): Promise<void> {
  if (!Buffer.isBuffer(payload)) {
    throw new Error(
      "Webhook payload must be a Buffer. " +
        "Ensure the webhook route is registered BEFORE app.use(express.json())."
    );
  }

  // 1. Let stripe-replit-sync sync data to the stripe schema tables
  const sync = await getStripeSync();
  await sync.processWebhook(payload, signature);

  // 2. Run our business logic on the event (signature already verified above)
  const event = JSON.parse(payload.toString());
  await handleBusinessLogic(event);
}

async function handleBusinessLogic(event: any): Promise<void> {
  const ts = new Date().toISOString();
  console.log(`[stripe-webhook] ${ts} event=${event.type} id=${event.id}`);
  try {
    switch (event.type) {
      case "checkout.session.completed": {
        const session = event.data.object;
        const userId =
          session.subscription_data?.metadata?.userId || session.metadata?.userId;
        const tier =
          session.subscription_data?.metadata?.tier || session.metadata?.tier;
        if (userId && tier) {
          const tierInfo = TIER_PRICES[tier];
          await storage.upsertSubscription(userId, {
            stripeCustomerId: session.customer,
            stripeSubscriptionId: session.subscription,
            tier,
            status: "active",
            videoCreditsLimit: tierInfo?.credits || 0,
            videoCreditsUsed: 0,
          });
          await storage.updateUser(userId, { tier, approvalStatus: "active" });
        }
        break;
      }

      case "customer.subscription.updated": {
        const subscription = event.data.object;
        const sub = await storage.getSubscriptionByStripeId(subscription.id);
        if (sub) {
          const tier = getTierFromPriceId(
            subscription.items.data[0]?.price?.id || ""
          );
          const tierInfo = tier !== "none" ? TIER_PRICES[tier] : null;
          await storage.upsertSubscription(sub.userId, {
            tier: tier || sub.tier || "none",
            status: subscription.status,
            cancelAtPeriodEnd: subscription.cancel_at_period_end,
            currentPeriodEnd: subscription.current_period_end
              ? new Date(subscription.current_period_end * 1000)
              : undefined,
            videoCreditsLimit: tierInfo?.credits ?? sub.videoCreditsLimit ?? 0,
          });
          await storage.updateUser(sub.userId, {
            tier: tier || sub.tier || "none",
          });
        }
        break;
      }

      case "customer.subscription.deleted": {
        const subscription = event.data.object;
        const sub = await storage.getSubscriptionByStripeId(subscription.id);
        if (sub) {
          await storage.upsertSubscription(sub.userId, {
            tier: "none",
            status: "cancelled",
          });
          await storage.updateUser(sub.userId, { tier: "none" });
        }
        break;
      }

      case "invoice.paid": {
        const invoice = event.data.object;
        const sub = await storage.getSubscriptionByStripeCustomerId(
          invoice.customer
        );
        if (sub) {
          // Reset video credits on new billing period
          await storage.upsertSubscription(sub.userId, { videoCreditsUsed: 0 });
        }
        break;
      }

      default:
        // Unhandled event type — stripe-replit-sync already synced the data
        break;
    }
  } catch (err) {
    console.error(`Webhook business logic error for ${event.type}:`, err);
    // Don't rethrow — we already returned 200 to Stripe via stripe-replit-sync
  }
}
