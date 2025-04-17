export interface Template {
  id: string;
  name: string;
  description: string;
  icon: string;
}

export interface ExamplePrompt {
  id: string;
  shortText: string;
  fullPrompt: string;
}

export const templates: Template[] = [
  {
    id: "portfolio",
    name: "Portfolio",
    description: "Personal portfolio websites to showcase your work",
    icon: "Briefcase"
  },
  {
    id: "ecommerce",
    name: "E-commerce",
    description: "Online stores with product listings and checkout",
    icon: "ShoppingCart"
  },
  {
    id: "blog",
    name: "Blog",
    description: "Content-focused websites for articles and posts",
    icon: "BookOpen"
  },
  {
    id: "landing",
    name: "Landing Page",
    description: "Conversion-focused pages for products or services",
    icon: "Rocket"
  },
];

export const examplePrompts: ExamplePrompt[] = [
  {
    id: "portfolio-prompt",
    shortText: "Photographer Portfolio",
    fullPrompt: "A portfolio site for a photographer with a dark theme and image gallery"
  },
  {
    id: "blog-prompt",
    shortText: "Tech Blog",
    fullPrompt: "A modern tech blog with categories, featured posts, and newsletter signup"
  },
  {
    id: "ecommerce-prompt",
    shortText: "Jewelry Store",
    fullPrompt: "An elegant jewelry store with product filtering and secure checkout"
  },
  {
    id: "landing-prompt",
    shortText: "SaaS Landing",
    fullPrompt: "A SaaS landing page with features section, pricing table, and testimonials"
  },
  {
    id: "restaurant-prompt",
    shortText: "Restaurant Site",
    fullPrompt: "A restaurant website with menu, reservation form, and location map"
  },
  {
    id: "fitness-prompt",
    shortText: "Fitness App",
    fullPrompt: "A fitness app with workout tracking, progress charts, and membership plans"
  },
];