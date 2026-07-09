// AfriLaunch AI — Payment Service
// Gestion multi-providers avec recommandations par pays

import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import Stripe from 'stripe';
import Flutterwave from 'flutterwave-node-v3';

import { PrismaService } from '../prisma/prisma.service';

// ── Mapping Pays → Solutions Disponibles ─────────────────────
const COUNTRY_PAYMENT_MAP: Record<string, {
  recommended: string[];
  available: string[];
  mobileMoney: string[];
  cards: boolean;
}> = {
  // Afrique de l'Ouest francophone
  'CI': { // Côte d'Ivoire
    recommended: ['ORANGE_MONEY', 'MTN_MOMO', 'FLUTTERWAVE', 'PAYSTACK'],
    available: ['PAYPAL', 'PAYONEER', 'WISE', 'STRIPE'],
    mobileMoney: ['ORANGE_MONEY', 'MTN_MOMO', 'MOOV'],
    cards: true,
  },
  'SN': { // Sénégal
    recommended: ['ORANGE_MONEY', 'WAVE', 'FLUTTERWAVE', 'PAYSTACK'],
    available: ['PAYPAL', 'PAYONEER'],
    mobileMoney: ['ORANGE_MONEY', 'WAVE', 'FREE_MONEY'],
    cards: true,
  },
  'CM': { // Cameroun
    recommended: ['ORANGE_MONEY', 'MTN_MOMO', 'FLUTTERWAVE'],
    available: ['PAYPAL', 'PAYONEER', 'WISE'],
    mobileMoney: ['ORANGE_MONEY', 'MTN_MOMO'],
    cards: true,
  },
  'GQ': { // Guinée Équatoriale
    recommended: ['FLUTTERWAVE', 'PAYONEER', 'WISE'],
    available: ['PAYPAL', 'STRIPE'],
    mobileMoney: ['AIRTEL_MONEY'],
    cards: true,
  },
  // Afrique de l'Est
  'KE': { // Kenya
    recommended: ['MPESA', 'FLUTTERWAVE', 'PAYSTACK', 'STRIPE'],
    available: ['PAYPAL', 'PAYONEER', 'WISE'],
    mobileMoney: ['MPESA', 'AIRTEL_MONEY'],
    cards: true,
  },
  'NG': { // Nigeria
    recommended: ['PAYSTACK', 'FLUTTERWAVE', 'STRIPE'],
    available: ['PAYPAL', 'PAYONEER', 'WISE'],
    mobileMoney: ['MTN_MOMO', 'AIRTEL_MONEY'],
    cards: true,
  },
  'GH': { // Ghana
    recommended: ['PAYSTACK', 'FLUTTERWAVE', 'MTN_MOMO'],
    available: ['PAYPAL', 'PAYONEER', 'WISE', 'STRIPE'],
    mobileMoney: ['MTN_MOMO', 'VODAFONE_CASH', 'AIRTEL_MONEY'],
    cards: true,
  },
  'ZA': { // Afrique du Sud
    recommended: ['STRIPE', 'PAYFAST', 'PAYSTACK'],
    available: ['PAYPAL', 'PAYONEER', 'WISE'],
    mobileMoney: [],
    cards: true,
  },
  'MA': { // Maroc
    recommended: ['CMI', 'PAYONEER', 'WISE'],
    available: ['PAYPAL', 'STRIPE'],
    mobileMoney: ['ORANGE_MONEY', 'INWI_MONEY'],
    cards: true,
  },
  'TN': { // Tunisie
    recommended: ['KONNECT', 'PAYONEER'],
    available: ['PAYPAL', 'WISE'],
    mobileMoney: [],
    cards: true,
  },
  // Par défaut
  'DEFAULT': {
    recommended: ['FLUTTERWAVE', 'PAYONEER', 'WISE'],
    available: ['PAYPAL', 'STRIPE'],
    mobileMoney: [],
    cards: true,
  },
};

// ── Détails des Providers ─────────────────────────────────────
const PAYMENT_PROVIDERS_INFO: Record<string, {
  name: string;
  logo: string;
  description: string;
  setupUrl: string;
  fees: string;
  currencies: string[];
  pros: string[];
  cons: string[];
}> = {
  PAYSTACK: {
    name: 'Paystack',
    logo: '/providers/paystack.svg',
    description: 'La solution de paiement leader en Afrique',
    setupUrl: 'https://paystack.com/signup',
    fees: '1.5% + ₦100 par transaction',
    currencies: ['NGN', 'GHS', 'ZAR', 'KES', 'USD'],
    pros: ['Simple à intégrer', 'Populaire en Afrique', 'Dashboard puissant'],
    cons: ['Disponible dans peu de pays'],
  },
  FLUTTERWAVE: {
    name: 'Flutterwave',
    logo: '/providers/flutterwave.svg',
    description: 'Paiements transfrontaliers en Afrique',
    setupUrl: 'https://flutterwave.com/signup',
    fees: '1.4% par transaction',
    currencies: ['NGN', 'GHS', 'KES', 'ZAR', 'USD', 'EUR', 'GBP', 'XOF'],
    pros: ['Couverture pan-africaine', 'Mobile Money intégré', 'Multi-devises'],
    cons: ['KYC requis', 'Support parfois lent'],
  },
  ORANGE_MONEY: {
    name: 'Orange Money',
    logo: '/providers/orange-money.svg',
    description: 'Mobile Money Orange — 17 pays africains',
    setupUrl: 'https://www.orange.com/fr/groupes/orange-money/',
    fees: 'Variable selon pays',
    currencies: ['XOF', 'XAF', 'GNF', 'MGA', 'MAD'],
    pros: ['Très populaire', 'Sans compte bancaire', 'Réseau étendu'],
    cons: ['Limité aux pays Orange', 'Plafonds de transaction'],
  },
  MTN_MOMO: {
    name: 'MTN Mobile Money',
    logo: '/providers/mtn-momo.svg',
    description: 'MoMo — Plus de 200 millions d\'utilisateurs',
    setupUrl: 'https://momodeveloper.mtn.com/',
    fees: 'Variable',
    currencies: ['XOF', 'XAF', 'GHS', 'UGX', 'RWF', 'ZMW'],
    pros: ['Très large couverture', 'API développeur disponible', 'Fiable'],
    cons: ['Processus d\'intégration complexe'],
  },
  PAYPAL: {
    name: 'PayPal',
    logo: '/providers/paypal.svg',
    description: 'Solution de paiement internationale',
    setupUrl: 'https://www.paypal.com/signup',
    fees: '3.49% + frais fixes',
    currencies: ['USD', 'EUR', 'GBP', 'CAD'],
    pros: ['Reconnu mondialement', 'Protection acheteur'],
    cons: ['Pas disponible dans tous les pays africains', 'Frais élevés'],
  },
  PAYONEER: {
    name: 'Payoneer',
    logo: '/providers/payoneer.svg',
    description: 'Paiements internationaux et virements',
    setupUrl: 'https://www.payoneer.com/',
    fees: '2% sur réception',
    currencies: ['USD', 'EUR', 'GBP', 'JPY'],
    pros: ['Idéal pour freelances', 'Carte Mastercard incluse', 'Transferts rapides'],
    cons: ['Frais de retrait', 'Minimum de solde'],
  },
  WISE: {
    name: 'Wise (ex-TransferWise)',
    logo: '/providers/wise.svg',
    description: 'Transferts internationaux au vrai taux de change',
    setupUrl: 'https://wise.com/',
    fees: 'Taux de change réel + petite commission',
    currencies: ['50+ devises'],
    pros: ['Taux de change réel', 'Transparent', 'Rapide'],
    cons: ['Pas de paiements marchands'],
  },
  STRIPE: {
    name: 'Stripe',
    logo: '/providers/stripe.svg',
    description: 'Infrastructure de paiement pour développeurs',
    setupUrl: 'https://stripe.com/signup',
    fees: '2.9% + 0.30$ par transaction',
    currencies: ['135+ devises'],
    pros: ['API puissante', 'Global', 'Documentation excellente'],
    cons: ['Disponible dans peu de pays africains', 'Nécessite compte bancaire étranger'],
  },
  AIRTEL_MONEY: {
    name: 'Airtel Money',
    logo: '/providers/airtel.svg',
    description: 'Mobile Money Airtel — Afrique centrale et orientale',
    setupUrl: 'https://developers.airtel.africa/',
    fees: 'Variable',
    currencies: ['XAF', 'KES', 'TZS', 'UGX', 'ZMW', 'MWK'],
    pros: ['Couverture Afrique centrale', 'API disponible'],
    cons: ['Couverture limitée vs MTN/Orange'],
  },
};

@Injectable()
export class PaymentService {
  private stripe: Stripe;
  private flutterwave: any;

  constructor(
    private prisma: PrismaService,
    private config: ConfigService,
  ) {
    this.stripe = new Stripe(this.config.get<string>('STRIPE_SECRET_KEY')!, {
      apiVersion: '2024-06-20',
    });
    this.flutterwave = new Flutterwave(
      this.config.get<string>('FLW_PUBLIC_KEY')!,
      this.config.get<string>('FLW_SECRET_KEY')!,
    );
  }

  // ── Recommandations par pays ──────────────────────────────
  async getPaymentRecommendations(country: string) {
    const countryData = COUNTRY_PAYMENT_MAP[country.toUpperCase()] 
                     ?? COUNTRY_PAYMENT_MAP['DEFAULT'];

    const recommendations = countryData.recommended.map(provider => ({
      provider,
      info: PAYMENT_PROVIDERS_INFO[provider],
      isRecommended: true,
      isAvailable: true,
    }));

    const additional = countryData.available
      .filter(p => !countryData.recommended.includes(p))
      .map(provider => ({
        provider,
        info: PAYMENT_PROVIDERS_INFO[provider],
        isRecommended: false,
        isAvailable: true,
      }));

    const mobileMoney = countryData.mobileMoney.map(provider => ({
      provider,
      info: PAYMENT_PROVIDERS_INFO[provider],
      type: 'MOBILE_MONEY',
    }));

    return {
      country: country.toUpperCase(),
      recommended: recommendations,
      additional,
      mobileMoney,
      hasCardPayments: countryData.cards,
      tip: this.getCountryTip(country),
    };
  }

  // ── Créer un abonnement Stripe ────────────────────────────
  async createStripeSubscription(params: {
    organizationId: string;
    priceId: string;
    customerId?: string;
    trialDays?: number;
  }) {
    const { organizationId, priceId, customerId, trialDays = 14 } = params;

    let stripeCustomerId = customerId;

    if (!stripeCustomerId) {
      const org = await this.prisma.organization.findUnique({
        where: { id: organizationId },
        include: { members: { include: { user: true }, take: 1 } },
      });

      const customer = await this.stripe.customers.create({
        email: org?.members[0]?.user?.email,
        name: org?.name,
        metadata: { organizationId },
      });
      stripeCustomerId = customer.id;
    }

    const subscription = await this.stripe.subscriptions.create({
      customer: stripeCustomerId,
      items: [{ price: priceId }],
      trial_period_days: trialDays,
      payment_behavior: 'default_incomplete',
      expand: ['latest_invoice.payment_intent'],
      metadata: { organizationId },
    });

    return {
      subscriptionId: subscription.id,
      clientSecret: (subscription.latest_invoice as any)?.payment_intent?.client_secret,
      status: subscription.status,
    };
  }

  // ── Initier paiement Flutterwave ──────────────────────────
  async initiateFlutterwavePayment(params: {
    amount: number;
    currency: string;
    email: string;
    name: string;
    phone?: string;
    organizationId: string;
    planId: string;
  }) {
    const txRef = `afrilaunch-${params.organizationId}-${Date.now()}`;

    const payload = {
      tx_ref: txRef,
      amount: params.amount,
      currency: params.currency,
      redirect_url: `${this.config.get('APP_URL')}/billing/verify?provider=flutterwave`,
      customer: {
        email: params.email,
        phonenumber: params.phone,
        name: params.name,
      },
      customizations: {
        title: 'AfriLaunch AI',
        description: 'Abonnement AfriLaunch AI',
        logo: 'https://afrilaunch.ai/logo.png',
      },
      meta: {
        organizationId: params.organizationId,
        planId: params.planId,
      },
    };

    const response = await this.flutterwave.Charge.card(payload);
    return { paymentLink: response.data?.link, txRef };
  }

  // ── Webhook Stripe ────────────────────────────────────────
  async handleStripeWebhook(payload: Buffer, signature: string) {
    const webhookSecret = this.config.get<string>('STRIPE_WEBHOOK_SECRET')!;
    let event: Stripe.Event;

    try {
      event = this.stripe.webhooks.constructEvent(payload, signature, webhookSecret);
    } catch {
      throw new BadRequestException('Invalid webhook signature');
    }

    switch (event.type) {
      case 'customer.subscription.created':
      case 'customer.subscription.updated':
        await this.handleSubscriptionUpdate(event.data.object as Stripe.Subscription);
        break;

      case 'customer.subscription.deleted':
        await this.handleSubscriptionCancelled(event.data.object as Stripe.Subscription);
        break;

      case 'invoice.payment_succeeded':
        await this.handleInvoicePaid(event.data.object as Stripe.Invoice);
        break;

      case 'invoice.payment_failed':
        await this.handlePaymentFailed(event.data.object as Stripe.Invoice);
        break;
    }

    return { received: true };
  }

  private async handleSubscriptionUpdate(subscription: Stripe.Subscription) {
    const orgId = subscription.metadata?.organizationId;
    if (!orgId) return;

    await this.prisma.subscription.upsert({
      where: { organizationId: orgId },
      create: {
        organizationId: orgId,
        planId: 'pro', // Mapper depuis le price ID
        status: subscription.status.toUpperCase() as any,
        currentPeriodStart: new Date(subscription.current_period_start * 1000),
        currentPeriodEnd: new Date(subscription.current_period_end * 1000),
        providerSubId: subscription.id,
        provider: 'STRIPE',
        amount: subscription.items.data[0]?.price?.unit_amount! / 100,
        currency: subscription.currency.toUpperCase(),
      },
      update: {
        status: subscription.status.toUpperCase() as any,
        currentPeriodStart: new Date(subscription.current_period_start * 1000),
        currentPeriodEnd: new Date(subscription.current_period_end * 1000),
      },
    });
  }

  private async handleSubscriptionCancelled(subscription: Stripe.Subscription) {
    const orgId = subscription.metadata?.organizationId;
    if (!orgId) return;

    await this.prisma.subscription.update({
      where: { organizationId: orgId },
      data: { status: 'CANCELLED', cancelledAt: new Date() },
    });
  }

  private async handleInvoicePaid(invoice: Stripe.Invoice) {
    // Enregistrer la facture et activer les services
    console.log(`Invoice paid: ${invoice.id}`);
  }

  private async handlePaymentFailed(invoice: Stripe.Invoice) {
    // Notifier l'utilisateur et suspendre les services si nécessaire
    console.log(`Payment failed: ${invoice.id}`);
  }

  private getCountryTip(country: string): string {
    const tips: Record<string, string> = {
      'NG': '💡 Au Nigeria, Paystack et Flutterwave dominent le marché. Intégrez les deux pour maximiser votre couverture.',
      'GH': '💡 Au Ghana, MTN Mobile Money est utilisé par 60%+ de la population. Ne le négligez pas !',
      'CI': '💡 En Côte d\'Ivoire, Orange Money et Wave sont les wallets les plus populaires auprès des jeunes.',
      'CM': '💡 Au Cameroun, Orange Money et MTN Momo couvrent 95% des transactions digitales.',
      'KE': '💡 Au Kenya, M-Pesa est incontournable. C\'est le marché le plus mature pour le mobile money en Afrique.',
      'ZA': '💡 En Afrique du Sud, Stripe est disponible. Les cartes bancaires sont très répandues.',
      'GQ': '💡 En Guinée Équatoriale, Flutterwave et Payoneer sont les meilleures options. Les solutions locales sont limitées.',
    };
    return tips[country.toUpperCase()] ?? '💡 Choisissez un provider avec une API officielle et un support technique réactif.';
  }
}
