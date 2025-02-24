import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarMenuSub,
  SidebarMenuSubButton,
  SidebarMenuSubItem,
  SidebarRail,
} from "@/components/ui/sidebar";
import { API_URL } from "@/lib/constants";
import { formatProjectsByDate } from "@/lib/formatterHelpers";
import { useProjectStore } from "@/store/projectStore";
import { GalleryVerticalEnd, Loader2 } from "lucide-react";
import * as React from "react";
import { useEffect, useState } from "react";
import toast from "react-hot-toast";
import { Link } from "react-router-dom";
import { useShallow } from "zustand/react/shallow";

export function AppSidebar({ ...props }: React.ComponentProps<typeof Sidebar>) {
  const [isLoading, setIsLoading] = useState(true);
  const { projects, setProjects, currentProjectId } = useProjectStore(
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
  }, [setProjects]);

  return (
    <Sidebar {...props}>
      <SidebarHeader>
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton size="lg" asChild>
              <a href="#">
                <div className="flex aspect-square size-8 items-center justify-center rounded-lg bg-sidebar-primary text-sidebar-primary-foreground">
                  <GalleryVerticalEnd className="size-4" />
                </div>
                <div className="flex flex-col gap-0.5 leading-none">
                  <span className="font-semibold">Documentation</span>
                  <span className="">v1.0.0</span>
                </div>
              </a>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarHeader>
      <SidebarContent>
        <SidebarGroup>
          <SidebarMenu>
            {isLoading ? (
              <div className="md:h-96 w-full flex justify-center items-center">
                <Loader2 className="animate-spin size-6" />
              </div>
            ) : (
              Object.entries(formatProjectsByDate(projects)).map(([date, projectsForDate]) => (
                <SidebarMenuItem key={date}>
                  <SidebarMenuButton>
                    {date}
                  </SidebarMenuButton>
                  {projectsForDate.length > 0 && (
                    <SidebarMenuSub>
                      {projectsForDate.map((project) => (
                        <SidebarMenuSubItem key={project.id}>
                          <SidebarMenuSubButton asChild isActive={project.id === currentProjectId}>
                            <Link to={`/project/${project.id}`}>
                              {project.name}
                            </Link>
                          </SidebarMenuSubButton>
                        </SidebarMenuSubItem>
                      ))}
                    </SidebarMenuSub>
                  )}
                </SidebarMenuItem>
              ))
            )}
          </SidebarMenu>
        </SidebarGroup>
      </SidebarContent>
      <SidebarRail />
    </Sidebar>
  )
}
