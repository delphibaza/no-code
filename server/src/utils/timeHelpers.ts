export function getDateTenYearsFromNow(): Date {
    const currentDate = new Date();
    const currentYear = currentDate.getFullYear();
    const currentMonth = currentDate.getMonth();
    const currentDay = currentDate.getDate();

    // Create a new date with the current day, month, and year + 10
    const tenYearsFromNow = new Date(currentYear + 10, currentMonth, currentDay);

    return tenYearsFromNow;
}

export function getDaysBetweenDates(startDate: Date, endDate: Date): number {
    const start = startDate.getTime(); // Convert Date to number
    const end = endDate.getTime();     // Convert Date to number

    // Calculate the difference in milliseconds
    const diffTime = Math.abs(end - start);

    // Convert milliseconds to days
    return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
}
/**
* Checks if daily tokens should be reset (past midnight)
*/
export function shouldResetDaily(lastReset: Date): boolean {
    const now = new Date();
    const lastResetDate = new Date(lastReset);
    // Set both dates to midnight for comparison
    const nowDay = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const lastResetDay = new Date(lastResetDate.getFullYear(), lastResetDate.getMonth(), lastResetDate.getDate());

    // If the last reset day is before today, we should reset
    return lastResetDay < nowDay;
}
// Helper function to set subscription plan data on request object
export function setPlanData(subscription: any) {
    return {
        subscriptionId: subscription.id,
        planType: subscription.planType,
        dailyTokenLimit: subscription.plan.dailyTokenLimit,
        monthlyTokenLimit: subscription.plan.monthlyTokenLimit,
        dailyTokensUsed: subscription.dailyTokensUsed,
        monthlyTokensUsed: subscription.monthlyTokensUsed,
        dailyTokensReset: subscription.dailyTokensReset,
        monthlyTokensReset: subscription.monthlyTokensReset,
        endDate: subscription.endDate,
        startDate: subscription.startDate
    };
}
/**
 * Checks if monthly tokens should be reset (new month)
 */
export function shouldResetMonthly(lastReset: Date): boolean {
    const now = new Date();
    const lastResetDate = new Date(lastReset);

    // If month or year has changed, we should reset
    return lastResetDate.getMonth() !== now.getMonth() ||
        lastResetDate.getFullYear() !== now.getFullYear();
}
// Define a custom error class with code property
export class ApplicationError extends Error {
    code: number;

    constructor(message: string, code: number) {
        super(message);
        this.name = 'ApplicationError';
        this.code = code;
    }
}