import { STARTER_TEMPLATES } from "@repo/common/constants";
import { FloatingDock } from "./floating-dock";

interface TemplateShowcaseProps {
  onPromptSelect: (prompt: string, templateName?: string) => void;
}

export function TemplateShowcase({ onPromptSelect }: TemplateShowcaseProps) {
  return (
    <div className="space-y-4">
      <div className="text-sm">
        or start with a blank template and start from there
      </div>
      <FloatingDock
        items={STARTER_TEMPLATES.map((t) => ({
          title: t.label,
          icon: t.icon,
          onTemplateClick: () =>
            onPromptSelect(
              `Create a blank project using \`${t.name}\` template`,
              t.name
            ),
        }))}
      />
    </div>
  );
}
