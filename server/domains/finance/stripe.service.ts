import Stripe from 'stripe';

export class StripeService {
  private static stripe: Stripe | null = null;

  private static getStripe(): Stripe {
    if (!this.stripe) {
      if (!process.env.STRIPE_SECRET_KEY) {
        throw new Error('STRIPE_SECRET_KEY is not set. Add it to your environment variables.');
      }
      this.stripe = new Stripe(process.env.STRIPE_SECRET_KEY, {
        apiVersion: '2025-01-27' as any,
      });
    }
    return this.stripe;
  }

  // ── Used by billing.routes.ts ──────────────────────────────────────────────

  /**
   * Generic one-time payment Checkout Session (used for bookings).
   * Supports optional Connect split via artistStripeAccountId + platformFee.
   */
  static async createCheckoutSession(params: {
    amount: number;                    // in cents
    currency?: string;
    artistStripeAccountId?: string;
    platformFee?: number;              // in cents
    metadata?: Record<string, string>;
    successUrl: string;
    cancelUrl: string;
  }): Promise<Stripe.Checkout.Session> {
    const stripe = this.getStripe();

    const sessionParams: Stripe.Checkout.SessionCreateParams = {
      mode: 'payment',
      line_items: [{
        price_data: {
          currency: params.currency ?? 'usd',
          product_data: { name: params.metadata?.trackTitle ?? 'Music Purchase' },
          unit_amount: params.amount,
        },
        quantity: 1,
      }],
      metadata: params.metadata ?? {},
      success_url: params.successUrl,
      cancel_url: params.cancelUrl,
    };

    // Connect split — only set when the artist has a connected Stripe account
    if (params.artistStripeAccountId && params.platformFee !== undefined) {
      sessionParams.payment_intent_data = {
        application_fee_amount: params.platformFee,
        transfer_data: { destination: params.artistStripeAccountId },
      };
    }

    return stripe.checkout.sessions.create(sessionParams);
  }

  /**
   * Retrieve and verify a completed Checkout Session directly from Stripe.
   * Used by the status callbacks so we never trust client-supplied amounts.
   */
  static async retrieveCheckoutSession(
    sessionId: string,
  ): Promise<Stripe.Checkout.Session> {
    return this.getStripe().checkout.sessions.retrieve(sessionId, {
      expand: ['payment_intent', 'line_items'],
    });
  }

  /**
   * Subscription Checkout Session.
   * Attaches to an existing customer when customerId is provided so payment
   * methods carry over between subscriptions.
   */
  static async createSubscriptionCheckoutSession(params: {
    priceId: string;
    customerEmail?: string;
    customerId?: string;
    metadata?: Record<string, string>;
    successUrl: string;
    cancelUrl: string;
  }): Promise<Stripe.Checkout.Session> {
    const stripe = this.getStripe();

    const sessionParams: Stripe.Checkout.SessionCreateParams = {
      mode: 'subscription',
      line_items: [{ price: params.priceId, quantity: 1 }],
      metadata: params.metadata ?? {},
      success_url: params.successUrl,
      cancel_url: params.cancelUrl,
    };

    if (params.customerId) {
      sessionParams.customer = params.customerId;
    } else if (params.customerEmail) {
      sessionParams.customer_email = params.customerEmail;
    }

    return stripe.checkout.sessions.create(sessionParams);
  }

  /**
   * Create a Stripe Customer Portal session so subscribers can self-manage
   * their plan, payment method, and invoices without contacting support.
   */
  static async createPortalSession(
    customerId: string,
    returnUrl: string,
  ): Promise<Stripe.BillingPortal.Session> {
    return this.getStripe().billingPortal.sessions.create({
      customer: customerId,
      return_url: returnUrl,
    });
  }

  static async createBillingPortalSession(
    customerId: string,
    returnUrl: string,
  ): Promise<Stripe.BillingPortal.Session> {
    return this.createPortalSession(customerId, returnUrl);
  }

  // ── Original methods (kept intact) ────────────────────────────────────────

  /** One-time payment with explicit Connect split — used by direct sales routes. */
  static async createSplitCheckoutSession(params: {
    amount: number;
    artistStripeId: string;
    platformFeePercent: number;
    metadata: any;
    successUrl: string;
    cancelUrl: string;
  }): Promise<Stripe.Checkout.Session> {
    const stripe = this.getStripe();
    const platformFeeAmount = Math.round(params.amount * (params.platformFeePercent / 100));

    return stripe.checkout.sessions.create({
      mode: 'payment',
      line_items: [{
        price_data: {
          currency: 'usd',
          product_data: {
            name: 'Digital Track / License',
            description: params.metadata.trackTitle || 'Music Purchase',
          },
          unit_amount: params.amount,
        },
        quantity: 1,
      }],
      payment_intent_data: {
        application_fee_amount: platformFeeAmount,
        transfer_data: { destination: params.artistStripeId },
      },
      metadata: params.metadata,
      success_url: params.successUrl,
      cancel_url: params.cancelUrl,
    });
  }

  /** Verify and construct a Stripe webhook event from raw body + signature. */
  static constructEvent(rawBody: string | Buffer, signature: string): Stripe.Event {
    const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;
    if (!webhookSecret) throw new Error('STRIPE_WEBHOOK_SECRET is not set.');
    return this.getStripe().webhooks.constructEvent(rawBody, signature, webhookSecret);
  }

  /** Initiate a payout transfer to a connected account. */
  static async createTransfer(params: {
    amount: number;
    destination: string;
    description: string;
  }): Promise<Stripe.Transfer> {
    return this.getStripe().transfers.create({
      amount: params.amount,
      currency: 'usd',
      destination: params.destination,
      description: params.description,
    });
  }

  /** Create a Stripe Connect Express account for an artist payout profile. */
  static async createConnectAccount(userId: string, email: string): Promise<Stripe.Account> {
    return this.getStripe().accounts.create({
      type: 'express',
      email,
      capabilities: {
        transfers:    { requested: true },
        card_payments: { requested: true },
      },
    });
  }

  /** Generate an onboarding link for a Connect account. */
  static async createOnboardingLink(
    accountId: string,
    returnPath: string,
  ): Promise<Stripe.AccountLink> {
    const appUrl = process.env.APP_URL ?? 'http://localhost:3000';
    return this.getStripe().accountLinks.create({
      account: accountId,
      refresh_url: `${appUrl}/api/billing/connect-refresh`,
      return_url:  `${appUrl}/${returnPath}`,
      type: 'account_onboarding',
    });
  }
}
