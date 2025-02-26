import { useProjectStore } from "@/store/projectStore";
import { useShallow } from "zustand/react/shallow";
import { SidebarMenu, SidebarMenuButton, SidebarMenuItem, SidebarMenuSub, SidebarMenuSubButton, SidebarMenuSubItem } from "./sidebar";
import { formatProjectsByDate } from "@/lib/formatterHelpers";

export function NavProjects({ searchQuery }: { searchQuery: string }) {
    const { projects, currentProjectId } = useProjectStore(
        useShallow((state) => ({
            projects: state.projects,
            currentProjectId: state.currentProjectId,
        }))
    );
    const filteredProjects = projects.filter(project => 
        project.name.toLowerCase().includes(searchQuery.toLowerCase())
    );
    return (
        <SidebarMenu>
            {Object.entries(formatProjectsByDate(filteredProjects)).map(([date, projectsForDate]) => (
                <SidebarMenuItem key={date}>
                    <SidebarMenuButton className="cursor-default hover:bg-sidebar font-medium">
                        {date}
                    </SidebarMenuButton>
                    {projectsForDate.length > 0 && (
                        <SidebarMenuSub>
                            {projectsForDate.map((project) => (
                                <SidebarMenuSubItem key={project.id}>
                                    <SidebarMenuSubButton asChild isActive={project.id === currentProjectId}>
                                        <a href={project.id === currentProjectId ? '#' : `/project/${project.id}`}
                                            className="overflow-hidden text-ellipsis whitespace-nowrap">
                                            {project.name}
                                        </a>
                                    </SidebarMenuSubButton>
                                </SidebarMenuSubItem>
                            ))}
                        </SidebarMenuSub>
                    )}
                </SidebarMenuItem>
            ))}
        </SidebarMenu>
    );
}