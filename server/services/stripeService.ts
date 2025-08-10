
import Stripe from 'stripe';
import { storage } from '../storage';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY || '', {
  apiVersion: '2024-06-20'
});

interface SubscriptionPlan {
  id: string;
  name: string;
  price: number;
  interval: 'month' | 'year';
  features: string[];
}

const SUBSCRIPTION_PLANS: SubscriptionPlan[] = [
  {
    id: 'starter',
    name: 'Starter',
    price: 29,
    interval: 'month',
    features: ['Up to 5 domains', 'Basic SSL monitoring', 'Email alerts']
  },
  {
    id: 'professional',
    name: 'Professional', 
    price: 79,
    interval: 'month',
    features: ['Up to 25 domains', 'Advanced SSL monitoring', 'Multi-region checks', 'API access']
  },
  {
    id: 'enterprise',
    name: 'Enterprise',
    price: 199,
    interval: 'month',
    features: ['Unlimited domains', 'Advanced features', 'Priority support', 'Custom integrations']
  }
];

class StripeService {
  async createCustomer(email: string, name: string): Promise<string> {
    const customer = await stripe.customers.create({
      email,
      name
    });
    return customer.id;
  }

  async createCheckoutSession(userId: string, planId: string, successUrl: string, cancelUrl: string) {
    const plan = SUBSCRIPTION_PLANS.find(p => p.id === planId);
    if (!plan) {
      throw new Error('Invalid plan selected');
    }

    const session = await stripe.checkout.sessions.create({
      payment_method_types: ['card'],
      line_items: [{
        price_data: {
          currency: 'usd',
          product_data: {
            name: plan.name,
            description: plan.features.join(', ')
          },
          unit_amount: plan.price * 100,
          recurring: {
            interval: plan.interval
          }
        },
        quantity: 1
      }],
      mode: 'subscription',
      success_url: successUrl,
      cancel_url: cancelUrl,
      metadata: {
        userId,
        planId
      }
    });

    return session;
  }

  async handleWebhook(event: Stripe.Event) {
    switch (event.type) {
      case 'checkout.session.completed':
        const session = event.data.object as Stripe.Checkout.Session;
        await this.activateSubscription(session);
        break;
      
      case 'invoice.payment_succeeded':
        const invoice = event.data.object as Stripe.Invoice;
        await this.updatePaymentStatus(invoice);
        break;
        
      case 'customer.subscription.deleted':
        const subscription = event.data.object as Stripe.Subscription;
        await this.cancelSubscription(subscription);
        break;
    }
  }

  private async activateSubscription(session: Stripe.Checkout.Session) {
    const { userId, planId } = session.metadata!;
    
    await storage.createSubscription({
      userId,
      stripeCustomerId: session.customer as string,
      stripeSubscriptionId: session.subscription as string,
      planId,
      status: 'active',
      currentPeriodStart: new Date(),
      currentPeriodEnd: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000) // 30 days
    });
  }

  private async updatePaymentStatus(invoice: Stripe.Invoice) {
    if (invoice.subscription) {
      await storage.updateSubscriptionPayment(
        invoice.subscription as string,
        invoice.status === 'paid'
      );
    }
  }

  private async cancelSubscription(subscription: Stripe.Subscription) {
    await storage.updateSubscriptionStatus(
      subscription.id,
      'canceled'
    );
  }

  getPlans(): SubscriptionPlan[] {
    return SUBSCRIPTION_PLANS;
  }
}

export const stripeService = new StripeService();
