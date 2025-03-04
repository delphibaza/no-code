/// <reference types="@clerk/express/env" />

declare namespace Express {
    interface Request {
        plan?: {
            planType: string;
            subscriptionId: string;
            dailyTokenLimit: number;
            monthlyTokenLimit: number;
            dailyTokensUsed: number;
            monthlyTokensUsed: number;
            dailyTokensReset: Date;
            monthlyTokensReset: Date;
            endDate: Date;
            startDate: Date;
        }
    }
}