import { AppSidebar } from "@/components/app-sidebar";
import {
    SidebarInset,
    SidebarProvider,
    SidebarTrigger,
} from "@/components/ui/sidebar";
import { Outlet } from "react-router-dom";

export default function MainLayout() {
    return (
        <div className="flex min-h-screen">
            <SidebarProvider>
                <AppSidebar variant='floating' />
                <SidebarInset className="w-full">
                    <header className="flex h-14 shrink-0 items-center gap-2 border-b px-4">
                        <div className="flex items-center gap-2">
                            <SidebarTrigger />
                        </div>
                    </header>
                    <main className="flex-1 overflow-auto">
                        <Outlet />
                    </main>
                </SidebarInset>
            </SidebarProvider>
        </div>
    );
}