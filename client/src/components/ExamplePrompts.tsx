import { cn } from "@/lib/utils";
import { memo } from "react";

interface ExamplePrompt {
  title: string;
  prompt: string;
}

const EXAMPLE_PROMPTS: ExamplePrompt[] = [
  {
    title: "Invoice Processing Agent",
    prompt:
      "Design a clean, professional and exteremely feature rich web dashboard UI using React for managing invoice processing. Divide the invoices into two modes. Automated, Assisted. Where automated are auto processed by AI agent, where as assisted are needing Human review or approval. For automated mode, the status should only be in approved or rejected but not pending. For assisted, it could be in pending. Include sections for pending invoices, payment status, vendor details, and document attachments. Use a card-based layout with filters, search, and a side navigation bar. Prioritize usability and efficiency with a finance-friendly color palette. Only frontend code is required.",
  },
  {
    title: "KYC Verification Agent",
    prompt:
      "Create a modern, clean, professional and exteremely feature rich KYC (Know Your Customer) verification frontend interface for a compliance team using React. Divide the KYC into two modes. Automated, Assisted. Where automated are auto processed by AI agent, where as assisted are needing Human review or approval. Include a dashboard with customer onboarding status, document review sections (ID, address proof), face match results, and approval/rejection buttons. Use light mode, blue-gray theme, and minimalistic icons. Include a notifications sidebar and search/filter for applicants. Only frontend code is required.",
  },
  {
    title: "Customer Support Agent",
    prompt:
      "Design a modern, clean, professional and exteremely feature rich customer support request management system dashboard for support agents using React. Divide the tickets into two modes. Automated, Assisted. Where automated are auto processed by AI agent, where as assisted are needing Human review or approval. Show incoming tickets, priority levels, SLA timers, customer chat history, and escalation workflow. Use tabs for ‘Open’, ‘In Progress’, and ‘Closed’ requests. Add tags, search, and filters. Keep UI intuitive and collaborative. Only frontend code is required.",
  },
  {
    title: "Employee Onboarding Agent",
    prompt:
      "Design a modern, clean, professional and exteremely feature rich frontend page for HR to manage employee onboarding workflows using React. Divide the onboarding into two modes. Automated, Assisted. Where automated are auto processed by AI agent, where as assisted are needing Human review or approval. Include checklists for document upload, IT setup, training sessions, and role-specific tasks. Show progress bars, task completion tracking, and department-specific onboarding paths. Use a soft, professional color scheme and welcoming illustrations. Only frontend code is required.",
  },
  {
    title: "Procurement Processing Agent",
    prompt:
      "Create a modern, clean, professional and exteremely feature rich frontend interface for handling procurement requests in a company using React. Divide the procurement into two modes. Automated, Assisted. Where automated are auto processed by AI agent, where as assisted are needing Human review or approval. Include form-based item request UI, approval chains, budget limits, vendor selection, and real-time status tracking. Use a structured layout with data tables, approval status indicators, and a green-themed enterprise design aesthetic. Only frontend code is required.",
  },
  // {
  //   title: "Blog Website in SvelteKit",
  //   prompt:
  //     "Create a blog website in SvelteKit where users can write and publish posts, add comments, and manage their own content",
  // },
];

export const ExamplePrompts = memo(function ExamplePrompts({
  onPromptClick,
}: {
  onPromptClick: (prompt: string) => void;
}) {
  return (
    <div className="flex flex-wrap gap-3">
      {EXAMPLE_PROMPTS.map((item) => (
        <button
          key={item.title}
          className={cn(
            "rounded-full border border-gray-300 px-2 py-1 dark:bg-gray-800 dark:text-gray-400",
            "dark:hover:text-primary dark:hover:bg-zinc-700 dark:border-gray-700",
            " bg-white hover:bg-gray-100 text-gray-700 shadow-sm transition",
            "whitespace-nowrap text-sm md:text-[11px]"
          )}
          onClick={() => onPromptClick(item.prompt)}
        >
          {item.title}
        </button>
      ))}
    </div>
  );
});
