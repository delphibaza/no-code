import { SidebarTrigger } from "@/components/ui/sidebar";
import { useProjectStore } from "@/stores/project";
import {
  SignedIn,
  SignedOut,
  SignInButton,
  UserButton,
} from "@clerk/clerk-react";
import { useShallow } from "zustand/react/shallow";
import { Button } from "./button";
import { Sparkles } from "lucide-react";

export function SiteHeader() {
  const { currentProjectId, projects } = useProjectStore(
    useShallow((state) => ({
      currentProjectId: state.currentProjectId,
      projects: state.projects,
    }))
  );
  const currentProject = projects.find(
    (project) => project.id === currentProjectId
  );

  return (
    <header className="flex sticky top-0 z-50 w-full items-center border-b bg-background/80 backdrop-blur-md shrink-0">
      <div className="flex h-[--header-height] w-full items-center justify-between gap-2 px-4">
        <div className="flex items-center gap-x-2 justify-center">
          <SidebarTrigger className="text-muted-foreground hover:text-foreground md:mt-[1px]" />
          <div
            onClick={() => window.location.assign("/")}
            className="flex items-center gap-x-2 cursor-pointer text-lg"
          >
            <Sparkles className="size-6 text-primary/85" />
            <span className="leading-none font-semibold text-primary/85">
              NoCode
            </span>
          </div>
        </div>
        {currentProject && (
          <div className="flex items-center border px-4 py-1 rounded-md cursor-default bg-background/50">
            <div className="font-semibold truncate text-sm">
              {currentProject.name || ""}
            </div>
          </div>
        )}
        <div>
          <SignedOut>
            <Button size={"sm"} variant="default">
              <SignInButton />
            </Button>
          </SignedOut>
          <SignedIn>
            <UserButton />
          </SignedIn>
        </div>
      </div>
    </header>
  );
}
