import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarRail,
} from "@/components/ui/sidebar";
import { API_URL } from "@/lib/constants";
import { useProjectStore } from "@/store/projectStore";
import { Loader2, MessageCircle, Sparkles } from "lucide-react";
import * as React from "react";
import { useEffect, useState } from "react";
import toast from "react-hot-toast";
import { useShallow } from "zustand/react/shallow";
import { SearchForm } from "./search-form";
import { ModeToggle } from "./ui/mode-toggle";
import { NavProjects } from "./ui/nav-projects";
import { NavUser } from "./ui/nav-user";

export function AppSidebar({ ...props }: React.ComponentProps<typeof Sidebar>) {
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const { setProjects } = useProjectStore(
    useShallow((state) => ({
      projects: state.projects,
      currentProjectId: state.currentProjectId,
      setProjects: state.setProjects,
      setCurrentProjectId: state.setCurrentProjectId,
    }))
  );

  useEffect(() => {
    async function fetchProjects() {
      try {
        const res = await fetch(`${API_URL}/api/projects`);
        const data = await res.json();
        if (!res.ok) {
          throw new Error(data?.msg);
        }
        setProjects(data);
      } catch (error) {
        toast.error(error instanceof Error
          ? error.message
          : "Something went wrong while fetching projects"
        );
      } finally {
        setIsLoading(false);
      }
    }
    fetchProjects();
  }, []);

  return (
    <Sidebar {...props}>
      <SidebarHeader>
        <SidebarMenuButton size="lg" asChild>
          <a href="/">
            <div className="flex aspect-square size-8 items-center justify-center rounded-lg bg-sidebar-primary text-sidebar-primary-foreground">
              <Sparkles className="size-5" />
            </div>
            <div className="leading-none">
              <span className="font-semibold">NoCode</span>
            </div>
          </a>
        </SidebarMenuButton>
      </SidebarHeader>
      <SearchForm searchQuery={searchQuery} setSearchQuery={setSearchQuery} />
      <SidebarMenu className="mt-2 px-2">
        <SidebarMenuItem>
          <SidebarMenuButton asChild className="font-medium bg-sky-100 hover:bg-sky-100 hover:text-blue-500 text-blue-500">
            <a href="/">
              <div className="flex items-center gap-x-2">
                <MessageCircle className="size-4" />
                <span className="font-semibold">Start a new chat</span>
              </div>
            </a>
          </SidebarMenuButton>
        </SidebarMenuItem>
      </SidebarMenu>
      <SidebarContent>
        {
          isLoading ? (
            <div className="flex h-full items-center justify-center">
              <Loader2 className="animate-spin size-5 text-sidebar-primary" />
            </div>
          ) : (
            <SidebarGroup>
              <SidebarGroupLabel>Chats</SidebarGroupLabel>
              <NavProjects searchQuery={searchQuery} />
            </SidebarGroup>
          )}
        <SidebarGroup className="mt-auto">
          <SidebarGroupContent>
            <SidebarMenu>
              <SidebarMenuItem>
                <SidebarMenuButton size="sm">
                  <ModeToggle />
                </SidebarMenuButton>
              </SidebarMenuItem>
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>
      <SidebarRail />
      <SidebarFooter>
        <NavUser />
      </SidebarFooter>
    </Sidebar>
  )
}
