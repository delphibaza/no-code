export interface StarterTemplate {
  name: string;
  label: string;
  description: string;
  githubRepo: string;
  tags: string[];
  folder?: string;
  icon: string;
}
export const STARTER_TEMPLATES: StarterTemplate[] = [
  {
    name: "bolt-vite-react",
    label: "React + Vite + TypeScript",
    description:
      "React starter template powered by Vite for fast development experience",
    githubRepo: "thecodacus/bolt-vite-react-ts-template",
    tags: ["react", "vite", "typescript", "frontend"],
    icon: "SiReact",
  },
  {
    name: "bolt-nextjs-shadcn",
    label: "Next.js with shadcn/ui",
    description:
      "Next.js starter fullstack template integrated with shadcn/ui components and styling system",
    githubRepo: "thecodacus/bolt-nextjs-shadcn-template",
    tags: ["nextjs", "next", "next.js", "typescript", "shadcn", "tailwind"],
    icon: "SiNextdotjs",
  },
  {
    name: "bolt-express-simple",
    label: "Express.js",
    description: "Express.js starter template in JavaScript",
    githubRepo: "stackblitz/starters",
    folder: "express-simple",
    tags: ["express", "backend", "javascript", "server", "node", "http server"],
    icon: "SiExpress",
  },
  {
    name: "bolt-node",
    label: "Node.js",
    description: "Node.js starter template with JavaScript",
    githubRepo: "stackblitz/starters",
    folder: "node",
    tags: ["node", "node.js", "javascript", "simple script"],
    icon: "SiNodedotjs",
  },
  {
    name: "bolt-angular",
    label: "Angular Starter",
    description:
      "A modern Angular starter template with TypeScript support and best practices configuration",
    githubRepo: "thecodacus/bolt-angular-template",
    tags: ["angular", "typescript", "frontend", "spa"],
    icon: "SiAngular",
  },
  {
    name: "bolt-vue",
    label: "Vue.js",
    description:
      "Vue.js starter template with modern tooling and best practices",
    githubRepo: "thecodacus/bolt-vue-template",
    tags: ["vue", "typescript", "frontend"],
    icon: "SiVuedotjs",
  },
  {
    name: "bolt-remix-ts",
    label: "Remix TypeScript",
    description:
      "Remix framework starter with TypeScript for full-stack web applications",
    githubRepo: "thecodacus/bolt-remix-ts-template",
    tags: ["remix", "typescript", "fullstack", "react"],
    icon: "SiRemix",
  },
  {
    name: "bolt-astro-basic",
    label: "Astro Basic",
    description:
      "Lightweight Astro starter template for building fast static websites",
    githubRepo: "thecodacus/bolt-astro-basic-template",
    tags: ["astro", "blog", "performance"],
    icon: "SiAstro",
  },
  {
    name: "bolt-sveltekit",
    label: "SvelteKit",
    description:
      "SvelteKit starter template for building fast, efficient web applications",
    githubRepo: "bolt-sveltekit-template",
    tags: ["svelte", "sveltekit", "typescript"],
    icon: "SiSvelte",
  },
  {
    name: "bolt-qwik-ts",
    label: "Qwik TypeScript",
    description:
      "Qwik framework starter with TypeScript for building resumable applications",
    githubRepo: "thecodacus/bolt-qwik-ts-template",
    tags: ["qwik", "typescript", "performance", "resumable"],
    icon: "SiQwik",
  },
  {
    name: "vanilla-vite",
    label: "Vanilla + Vite",
    description:
      "Minimal Vite starter template for vanilla JavaScript projects",
    githubRepo: "thecodacus/vanilla-vite-template",
    tags: ["vite", "vanilla-js", "minimal"],
    icon: "SiVite",
  },
  {
    name: "bolt-slidev",
    label: "Slidev Presentation",
    description:
      "Slidev starter template for creating developer-friendly presentations using Markdown",
    githubRepo: "thecodacus/bolt-slidev-template",
    tags: ["slidev", "presentation", "markdown"],
    icon: "SiSlides",
  },
];

export const cwd = "project";
export const WORK_DIR = `/home/${cwd}`;

export function stripIndents(
  arg0: string | TemplateStringsArray,
  ...values: any[]
) {
  if (typeof arg0 !== "string") {
    const processedString = arg0.reduce((acc, curr, i) => {
      acc += curr + (values[i] ?? "");
      return acc;
    }, "");

    return _stripIndents(processedString);
  }

  return _stripIndents(arg0);
}

function _stripIndents(value: string) {
  return value
    .split("\n")
    .map((line) => line.trim())
    .join("\n")
    .trimStart()
    .replace(/[\r\n]$/, "");
}
