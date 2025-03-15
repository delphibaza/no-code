import prisma from '@repo/db/client';
import { NextFunction, Request, Response } from 'express';
import { getUserWithSubscription } from '../services/subscriptionService';
import { setPlanData, shouldResetDaily, shouldResetMonthly } from '../utils/timeHeplers';

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
            // We ensure that a user contains a single active subscription
            const subscription = userWithSubscription.subscription[0];
            req.plan = setPlanData(subscription);
        }
        const subscription = req.plan;
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
            req.plan = setPlanData(updatedSubscription);
        }
        next();
    } catch (error) {
        console.error(error);
        res.status(500).json({
            msg: error instanceof Error ? error.message : "Failed to reset limits",
        });
    }
}