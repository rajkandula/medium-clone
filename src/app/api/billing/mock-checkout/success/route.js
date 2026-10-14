import { NextResponse } from 'next/server';
import dbConnect from '@/lib/db';
import User from '@/models/User';
import { getSession } from '@/lib/auth';
import { isStripeConfigured } from '@/lib/stripe';

// Checkout simulator: only for instances without Stripe. Once real billing is
// configured, nobody can upgrade themselves for free through this route.
export async function POST() {
  if (isStripeConfigured) {
    return NextResponse.json({ error: 'Simulated checkout is disabled when Stripe is configured' }, { status: 403 });
  }
  try {
    const session = await getSession();
    if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    await dbConnect();
    const user = await User.findById(session.userId);
    if (!user) return NextResponse.json({ error: 'User not found' }, { status: 404 });

    // Update to simulated premium writer plan
    user.subscription = {
      plan: 'writer',
      stripeCustomerId: user.subscription?.stripeCustomerId || `cus_sim_${Math.random().toString(36).substring(2, 10)}`,
      stripeSubscriptionId: `sub_sim_${Math.random().toString(36).substring(2, 10)}`,
      currentPeriodEnd: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30 days
    };
    
    await user.save();

    return NextResponse.json({ success: true, plan: 'writer' });
  } catch (error) {
    console.error('Simulated success error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
