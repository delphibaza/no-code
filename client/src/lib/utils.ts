import { getSystemTheme, Theme } from "@/components/ui/theme-provider";
import { FileAction } from "@repo/common/types";
import { clsx, type ClassValue } from "clsx";
import toast from "react-hot-toast";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function removeTrailingNewlines(str: string): string {
  return str.replace(/(\n|\r|\r\n|```)+$/, '');
};

export function findFileContent(files: Omit<FileAction, 'id' | 'type'>[], selectedFileName: string): string | undefined {
  for (const file of files) {
    if (file.filePath === selectedFileName) {
      return file.content
    }
  }
  return undefined; // Return undefined if not found
};

export const installCommands = ['npm install', 'yarn install', 'pnpm install', 'npm i'];

export const devCommands = ['npm run dev', 'npm run start', 'npm start', 'yarn dev', 'yarn start', 'pnpm dev', 'pnpm start', 'pnpm run dev', 'pnpm run start'];

export function isInstallCommand(command: string) {
  return installCommands.some(cmd => cmd === command)
}

export function isDevCommand(command: string) {
  return devCommands.some(cmd => cmd === command)
}
export const planDetails = {
  free: {
    name: "Free",
    color: "bg-gray-100 text-gray-900 hover:bg-gray-200",
    features: ["150K tokens per day", "1Million tokens per month", "Basic features"],
  },
  pro: {
    name: "Pro",
    color: "bg-blue-100 text-blue-900 hover:bg-blue-200",
    features: ["250K tokens per day", "10Million tokens per month", "Advanced features"],
  }
}

export function customToast(msg: string) {
  return toast.error(msg, {
    style: {
      borderRadius: '25px',
      background: '#333',
      color: '#fff',
      paddingTop: '3px',
      paddingBottom: '3px',
    },
  })
};

export function getLightOrDarkTheme(theme: Theme) {
  let darkOrLight = theme;
  if (darkOrLight === 'system') {
    darkOrLight = getSystemTheme();
  }
  return darkOrLight;
}

export function getTerminalTheme(theme: Theme) {
  const lightTheme = {
    foreground: '#000000',
    background: '#ffffff',
    cursor: '#000000',
    cursorAccent: '#000000',
    selectionBackground: '#edebeb',
    selectionInactiveBackground: '#ffffff',
  };
  const darkTheme = {
    foreground: '#ffffff',
    background: '#000000',
    cursor: '#ffffff',
    cursorAccent: '#ffffff',
    selectionBackground: '#666666',
    selectionInactiveBackground: '#000000',
  };
  const darkOrLight = getLightOrDarkTheme(theme);
  switch (darkOrLight) {
    case 'dark':
      return darkTheme;
    case 'light':
      return lightTheme;
    default:
      return darkTheme;
  }
}
