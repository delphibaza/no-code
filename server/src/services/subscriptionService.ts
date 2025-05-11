import { PlanInfo } from "@repo/common/types";
import prisma from "@repo/db/client";
import { ApplicationError } from "../utils/timeHelpers";

export async function getUserWithSubscription(userId: string) {
  const userWithSubscription = await prisma.user.findUnique({
    where: { id: userId },
    include: {
      subscription: {
        where: {
          startDate: { lte: new Date() },
          endDate: { gte: new Date() },
          status: "active",
        },
        include: {
          plan: true,
        },
      },
    },
  });

  return userWithSubscription;
}

export function checkLimits(plan: PlanInfo, minTokens?: number) {
  const {
    dailyTokensUsed,
    monthlyTokensUsed,
    dailyTokenLimit,
    monthlyTokenLimit,
  } = plan;

  if (minTokens && dailyTokenLimit - dailyTokensUsed <= minTokens) {
    return {
      success: false,
      message: "You do not have enough tokens to make this request",
    };
  } else if (dailyTokensUsed >= dailyTokenLimit) {
    return {
      success: false,
      message: "You have reached your daily token limit",
    };
  } else if (monthlyTokensUsed >= monthlyTokenLimit) {
    return {
      success: false,
      message: "You have reached your monthly token limit",
    };
  } else {
    return {
      success: true,
    };
  }
}

export async function updateSubscription(planInfo: PlanInfo) {
  try {
    await prisma.subscription.update({
      where: { id: planInfo.subscriptionId },
      // Prevent negative token usage based on limits,
      // we only update the tokens till the limit
      data: {
        monthlyTokensUsed:
          planInfo.monthlyTokensUsed >= planInfo.monthlyTokenLimit
            ? planInfo.monthlyTokenLimit
            : planInfo.monthlyTokensUsed,
        dailyTokensUsed:
          planInfo.dailyTokensUsed >= planInfo.dailyTokenLimit
            ? planInfo.dailyTokenLimit
            : planInfo.dailyTokensUsed,
        monthlyTokensReset: planInfo.monthlyTokensReset,
        dailyTokensReset: planInfo.dailyTokensReset,
      },
    });
  } catch (error) {
    throw new Error("Failed to update subscription details");
  }
}

/**
 * Updates token usage and checks against limits
 *
 * @param {Object} plan - User's subscription plan
 * @param {Object} usage - Token usage from the latest API call
 * @returns {Promise<void>}
 * @throws {Error} If token limits are exceeded
 */
export async function checkAndUpdateTokenUsage(plan: PlanInfo) {
  const limitsCheck = checkLimits(plan);

  if (!limitsCheck.success) {
    // Update token usage if limits are exceeded
    await updateSubscription(plan);
    throw new ApplicationError(
      limitsCheck.message ?? "You have reached your token limit",
      403
    );
  }
}
