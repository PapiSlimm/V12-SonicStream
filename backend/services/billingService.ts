// backend/services/billingService.ts
import prisma from '../db/client.ts';

export const getSubscriptionStatus = async (userId: string) => {
  const sub = await prisma.subscription.findUnique({
    where: { userId }
  });
  return sub || { plan: 'free', status: 'active' };
};

export const updateSubscription = async (userId: string, plan: string, status: string, stripeCustomerId?: string) => {
  return await prisma.subscription.upsert({
    where: { userId },
    update: { plan, status, stripeCustomerId },
    create: { userId, plan, status, stripeCustomerId }
  });
};
