import { NextResponse } from 'next/server';
import dbConnect from '@/lib/db';
import User from '@/models/User';
import { getStripe } from '@/lib/stripe';
import { sendSubscriptionEmail } from '@/lib/email';

export async function POST(req) {
  try {
    const stripe = getStripe();
    const body = await req.text();
    const sig = req.headers.get('stripe-signature');

    let event;
    try {
      event = stripe.webhooks.constructEvent(body, sig, process.env.STRIPE_WEBHOOK_SECRET);
    } catch (err) {
      return NextResponse.json({ error: 'Webhook signature verification failed' }, { status: 400 });
    }

    await dbConnect();

    switch (event.type) {
      case 'checkout.session.completed': {
        const session = event.data.object;
        const userId = session.metadata?.userId;
        if (userId) {
          const subscription = await stripe.subscriptions.retrieve(session.subscription);
          await User.findByIdAndUpdate(userId, {
            'subscription.plan': 'writer',
            'subscription.stripeSubscriptionId': session.subscription,
            'subscription.currentPeriodEnd': new Date(subscription.current_period_end * 1000),
          });
          const user = await User.findById(userId);
          sendSubscriptionEmail(user.email, user.name, 'Writer').catch(() => {});
        }
        break;
      }
      case 'customer.subscription.deleted': {
        const sub = event.data.object;
        await User.findOneAndUpdate(
          { 'subscription.stripeSubscriptionId': sub.id },
          { 'subscription.plan': 'free', 'subscription.stripeSubscriptionId': null, 'subscription.currentPeriodEnd': null },
        );
        break;
      }
      case 'invoice.payment_succeeded': {
        const invoice = event.data.object;
        if (invoice.subscription) {
          const sub = await stripe.subscriptions.retrieve(invoice.subscription);
          await User.findOneAndUpdate(
            { 'subscription.stripeSubscriptionId': invoice.subscription },
            { 'subscription.currentPeriodEnd': new Date(sub.current_period_end * 1000) },
          );
        }
        break;
      }
    }

    return NextResponse.json({ received: true });
  } catch (error) {
    console.error('Webhook error:', error);
    return NextResponse.json({ error: 'Webhook handler failed' }, { status: 500 });
  }
}
