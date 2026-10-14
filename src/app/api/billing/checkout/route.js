import { NextResponse } from 'next/server';
import { SITE_URL } from '@/lib/siteUrl';
import dbConnect from '@/lib/db';
import User from '@/models/User';
import { getSession } from '@/lib/auth';
import { getStripe, isStripeConfigured } from '@/lib/stripe';

export async function POST(req) {
  try {
    const session = await getSession();
    if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    // No Stripe keys: use the checkout simulator (local development and demos).
    if (!isStripeConfigured) {
      return NextResponse.json({ url: '/dashboard/billing/mock-checkout' });
    }

    await dbConnect();
    const user = await User.findById(session.userId);
    const stripe = getStripe();

    let customerId = user.subscription?.stripeCustomerId;
    if (!customerId) {
      const customer = await stripe.customers.create({ email: user.email, name: user.name, metadata: { userId: user._id.toString() } });
      customerId = customer.id;
      user.subscription = { ...user.subscription, stripeCustomerId: customerId };
      await user.save();
    }

    // Use the explicitly configured BlogWrite Writer price
    const priceId = process.env.STRIPE_PRICE_ID_WRITER;
    if (!priceId) {
      console.error('[Stripe] STRIPE_PRICE_ID_WRITER env var is not set!');
      return NextResponse.json({ error: 'Billing not configured' }, { status: 500 });
    }

    const checkoutSession = await stripe.checkout.sessions.create({
      customer: customerId,
      mode: 'subscription',
      line_items: [{ price: priceId, quantity: 1 }],
      success_url: `${SITE_URL}/dashboard/billing?success=true`,
      cancel_url: `${SITE_URL}/dashboard/billing?canceled=true`,
      metadata: { userId: user._id.toString() },
    });

    return NextResponse.json({ url: checkoutSession.url });
  } catch (error) {
    console.error('Stripe checkout failed:', error.message);
    return NextResponse.json({ error: 'Checkout is unavailable right now. Please try again.' }, { status: 502 });
  }
}
