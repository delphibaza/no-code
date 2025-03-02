import prisma from '@repo/db/client';
import { Request, Response, NextFunction } from 'express';
import { shouldResetDaily, shouldResetMonthly } from '../utils';
import { getUserWithSubscription } from '../services/subscriptionService';
// This should only be called after `ensureUserExists` middleware
export async function resetLimits(req: Request, res: Response, next: NextFunction) {
    if (!req.auth.userId) {
        res.status(401).json({ msg: 'Unauthorized' });
        return;
    }

    try {
        if (!req.plan) {
            const userWithSubscription = await getUserWithSubscription(req.auth.userId);
            // Happens if reset limits is called before ensureUserExists
            if (!userWithSubscription) {
                throw new Error("User not found");
            }
            const subscription = userWithSubscription.subscription[0];
            req.plan = {
                subscriptionId: subscription.id,
                dailyTokenLimit: subscription.plan.dailyTokenLimit,
                monthlyTokenLimit: subscription.plan.monthlyTokenLimit,
                dailyTokensUsed: subscription.dailyTokensUsed,
                monthlyTokensUsed: subscription.monthlyTokensUsed,
                dailyTokensReset: subscription.dailyTokensReset,
                monthlyTokensReset: subscription.monthlyTokensReset
            }
        }
        const subscription = req.plan;
        // We ensure that a user contains a single active subscription
        // Check if token limits need to be reset
        const updates: Record<string, any> = {};
        // Check if daily reset is needed (if it's past midnight)
        if (shouldResetDaily(subscription.dailyTokensReset)) {
            updates['dailyTokensUsed'] = 0;
            updates['dailyTokensReset'] = new Date();
        }
        // Check if monthly reset is needed (if it's a new month)
        if (shouldResetMonthly(subscription.monthlyTokensReset)) {
            updates['monthlyTokensUsed'] = 0;
            updates['monthlyTokensReset'] = new Date();
        }
        // If updates are needed, apply them
        if (Object.keys(updates).length > 0) {
            const updatedSubscription = await prisma.subscription.update({
                where: {
                    id: subscription.subscriptionId,
                    userId: req.auth.userId,
                },
                data: updates,
                include: {
                    plan: true
                }
            });
            req.plan = {
                subscriptionId: updatedSubscription.id,
                dailyTokenLimit: updatedSubscription.plan.dailyTokenLimit,
                monthlyTokenLimit: updatedSubscription.plan.monthlyTokenLimit,
                dailyTokensUsed: updatedSubscription.dailyTokensUsed,
                monthlyTokensUsed: updatedSubscription.monthlyTokensUsed,
                dailyTokensReset: updatedSubscription.dailyTokensReset,
                monthlyTokensReset: updatedSubscription.monthlyTokensReset
            }
            next();
        }
    } catch (error) {
        console.error(error);
        res.status(500).json({
            msg: error instanceof Error ? error.message : "Failed to reset limits",
        });
    }
}