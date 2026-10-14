import Stripe from 'stripe';

let _stripe;
export function getStripe() {
  if (!_stripe) {
    _stripe = new Stripe(process.env.STRIPE_SECRET_KEY, {
      apiVersion: '2023-10-16',
    });
  }
  return _stripe;
}

// Keep backward-compatible named export (lazy getter)
export const stripe = new Proxy({}, {
  get(_, prop) {
    return getStripe()[prop];
  },
});

/**
 * Real billing is on only when both the secret key and the Writer price are
 * set. Without them, upgrades go through the built-in checkout simulator
 * (/dashboard/billing/mock-checkout), which is refused once Stripe is set up.
 */
export const isStripeConfigured = !!(process.env.STRIPE_SECRET_KEY && process.env.STRIPE_PRICE_ID_WRITER);

// Stripe Price IDs — $1/month Writer plan (set STRIPE_PRICE_ID_WRITER)
export const STRIPE_PRICES = {
  writer: process.env.STRIPE_PRICE_ID_WRITER || 'price_blogwrite_writer_monthly',
};

export const PLAN_LIMITS = {
  free: {
    maxPosts: 3,
    maxStorage: 52428800,       // 50MB
    aiCallsPerMonth: 0,
    analytics: false,
  },
  writer: {
    maxPosts: -1,                // Unlimited
    maxStorage: 5368709120,      // 5GB
    aiCallsPerMonth: 500,
    analytics: true,
  },
};
