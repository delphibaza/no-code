import { cn } from "@/lib/utils";

interface ExamplePrompt {
  title: string;
  prompt: string;
}

const EXAMPLE_PROMPTS: ExamplePrompt[] = [
  {
    title: "React Todo App",
    prompt:
      "Create a simple, user-friendly to-do list application using React where users can add, edit, and delete tasks and mark them as completed.",
  },
  {
    title: "Next.js Portfolio Website",
    prompt:
      "Design a modern, responsive personal portfolio website using Next.js that showcases projects, skills, experience, and contact information.",
  },
  {
    title: "Recipe Finder App in Angular",
    prompt:
      "Develop an app using Angular where users can search for recipes by ingredients, save favorites, and get step-by-step cooking instructions.",
  },
  {
    title: "Vue.js Fitness Tracker",
    prompt:
      "Build a fitness tracker using Vue.js that allows users to log workouts, set goals, track progress, and visualize activity over time.",
  },
  {
    title: "E-commerce Website",
    prompt:
      "Create an E-commerce website in React that allows users to browse products, add them to a cart and checkout.",
  },
  {
    title: "Blog Website in SvelteKit",
    prompt:
      "Create a blog website in SvelteKit where users can write and publish posts, add comments, and manage their own content.",
  },
];

export function ExamplePrompts({
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
}
