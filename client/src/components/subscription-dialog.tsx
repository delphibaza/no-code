import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from "@/components/ui/dialog"
import { Progress } from "@/components/ui/progress"
import { Separator } from "@/components/ui/separator"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"
import useFetch from "@/hooks/useFetch"
import { API_URL } from "@/lib/constants"
import { planDetails } from "@/lib/utils"
import { useProjectStore } from "@/store/projectStore"
import { BarChart3, Check, CreditCard, Gauge, Info, Loader2, Zap } from "lucide-react"
import { useEffect, useState } from "react"
import { useShallow } from "zustand/react/shallow"

export default function SubscriptionDialog() {
    const [open, setOpen] = useState(false);
    const [isLoading, setIsLoading] = useState(false);
    const { authenticatedFetch } = useFetch();
    const { subscriptionData, setSubscriptionData, refreshTokens } = useProjectStore(
        useShallow(state => ({
            subscriptionData: state.subscriptionData,
            setSubscriptionData: state.setSubscriptionData,
            refreshTokens: state.refreshTokens,
            setRefreshTokens: state.setRefreshTokens
        }))
    );
    const plan = subscriptionData?.plan ? planDetails[subscriptionData.plan as keyof typeof planDetails] : null;

    useEffect(() => {
        async function fetchSubscriptionData() {
            setIsLoading(true);
            try {
                const data = await authenticatedFetch(`${API_URL}/api/subscription`);
                setSubscriptionData(data);
            } catch (error) {
                console.error("Error fetching subscription data:", error);
            } finally {
                setIsLoading(false);
            }
        }
        fetchSubscriptionData();
    }, [refreshTokens]);

    return (
        <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
                <Button variant="ghost" className="px-0">
                    <CreditCard className="h-5 w-5" />
                    My Subscription
                </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[500px]">
                {isLoading ? (
                    <div className="flex justify-center items-center h-52 md:h-[550px]">
                        <Loader2 className="h-4 w-4 animate-spin text-gray-500 mx-auto" />
                    </div>
                ) : subscriptionData ? (
                    <>
                        <DialogHeader>
                            <DialogTitle className="flex items-center gap-2">
                                <CreditCard className="h-5 w-5" />
                                Subscription Details
                            </DialogTitle>
                            <DialogDescription>Your current plan and usage statistics</DialogDescription>
                        </DialogHeader>

                        <div className="space-y-6 py-4">
                            {/* Plan Type */}
                            <div className="space-y-2">
                                <div className="flex items-center justify-between">
                                    <h3 className="text-sm font-medium">Current Plan</h3>
                                    {plan && <Badge className={plan.color}>{plan.name}</Badge>}
                                </div>
                                <Card>
                                    <CardContent className="p-4">
                                        <div className="space-y-2">
                                            {plan?.features.map((feature, index) => (
                                                <div key={index} className="flex items-center gap-2">
                                                    <Check className="h-4 w-4 text-green-500" />
                                                    <span className="text-sm">{feature}</span>
                                                </div>
                                            ))}
                                        </div>
                                    </CardContent>
                                </Card>
                            </div>

                            {/* Billing Period */}
                            <div className="mt-4 space-y-2">
                                <h3 className="text-sm font-medium flex items-center gap-2">
                                    <CreditCard className="h-4 w-4" />
                                    Billing Period
                                </h3>
                                <div className="grid grid-cols-2 gap-4 rounded-lg border p-4">
                                    <div className="space-y-1">
                                        <span className="text-xs text-muted-foreground">
                                            Start Date {' '}
                                            <span className="text-xs md:text-[9px]">
                                                (MM/DD/YYYY)
                                            </span>
                                        </span>
                                        <p className="font-medium">{new Date(subscriptionData.startDate).toLocaleDateString()}</p>
                                    </div>
                                    <div className="space-y-1">
                                        <span className="text-xs text-muted-foreground">
                                            End Date {' '}
                                            <span className="text-xs md:text-[9px]">
                                                (MM/DD/YYYY)
                                            </span>
                                        </span>
                                        <p className="font-medium">{new Date(subscriptionData.endDate).toLocaleDateString()}</p>
                                    </div>
                                </div>
                            </div>

                            <Separator />

                            {/* Token Usage */}
                            <div className="space-y-4">
                                <h3 className="text-sm font-medium flex items-center gap-2">
                                    <Gauge className="h-4 w-4" />
                                    Token Usage
                                </h3>

                                {/* Daily Usage */}
                                <div className="space-y-2">
                                    <div className="flex items-center justify-between">
                                        <div className="flex items-center gap-2">
                                            <span className="text-sm text-muted-foreground">Daily</span>
                                            <TooltipProvider>
                                                <Tooltip>
                                                    <TooltipTrigger>
                                                        <Info className="h-3.5 w-3.5 text-muted-foreground" />
                                                    </TooltipTrigger>
                                                    <TooltipContent>
                                                        <p>Resets every 24 hours</p>
                                                    </TooltipContent>
                                                </Tooltip>
                                            </TooltipProvider>
                                        </div>
                                        <span className="text-sm font-medium">
                                            {subscriptionData.tokenUsage.daily.used.toLocaleString()} /{" "}
                                            {subscriptionData.tokenUsage.daily.limit.toLocaleString()}
                                        </span>
                                    </div>
                                    <Progress value={subscriptionData.tokenUsage.daily.percentage} className="h-2" />
                                </div>

                                {/* Monthly Usage */}
                                <div className="space-y-2">
                                    <div className="flex items-center justify-between">
                                        <div className="flex items-center gap-2">
                                            <span className="text-sm text-muted-foreground">Monthly</span>
                                            <TooltipProvider>
                                                <Tooltip>
                                                    <TooltipTrigger>
                                                        <Info className="h-3.5 w-3.5 text-muted-foreground" />
                                                    </TooltipTrigger>
                                                    <TooltipContent>
                                                        <p>Resets on first day of the month</p>
                                                    </TooltipContent>
                                                </Tooltip>
                                            </TooltipProvider>
                                        </div>
                                        <span className="text-sm font-medium">
                                            {subscriptionData.tokenUsage.monthly.used.toLocaleString()} /{" "}
                                            {subscriptionData.tokenUsage.monthly.limit.toLocaleString()}
                                        </span>
                                    </div>
                                    <Progress value={subscriptionData.tokenUsage.monthly.percentage} className="h-2" />
                                </div>
                            </div>

                            {/* Usage Stats */}
                            <Card className="bg-muted/50">
                                <CardHeader className="pb-2 pt-4">
                                    <CardTitle className="text-sm flex items-center gap-2">
                                        <BarChart3 className="h-4 w-4" />
                                        Usage Statistics
                                    </CardTitle>
                                </CardHeader>
                                <CardContent className="grid grid-cols-2 gap-4 p-4 pt-0">
                                    <div className="space-y-1">
                                        <p className="text-xs text-muted-foreground">Average Daily</p>
                                        <p className="text-lg font-semibold">{subscriptionData.dailyAverage.toLocaleString()}</p>
                                    </div>
                                    <div className="space-y-1">
                                        <p className="text-xs text-muted-foreground">Peak Usage</p>
                                        <p className="text-lg font-semibold">{subscriptionData.peakUsage.toLocaleString()}</p>
                                    </div>
                                </CardContent>
                            </Card>
                        </div>

                        <DialogFooter className="flex flex-col sm:flex-row gap-2">
                            <Button className="sm:w-full" disabled>
                                <Zap className="mr-2 h-4 w-4" />
                                Upgrade Plan
                            </Button>
                        </DialogFooter>
                    </>
                ) : (
                    <div className="py-6 text-center">
                        <p>No subscription data available</p>
                    </div>
                )}
            </DialogContent>
        </Dialog>
    )
}