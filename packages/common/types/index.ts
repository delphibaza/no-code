export type File = {
  filePath: string;
  content: string;
};
export type Folders = {
  type: "folder" | "file";
  name: string;
  filePath?: string;
  children?: Folders[];
  content?: string;
};
export type HeadersInit = [string, string][] | Record<string, string> | Headers;
export type ActionType = "file" | "shell";
export type Role = "user" | "assistant" | "data";
export type MessageHistory = {
  id: string;
  timestamp: number;
  role: Role;
  reasoning?: string;
  rawContent?: string;
  content: string;
};
export type FileAction = {
  id: number;
  type: "file";
  filePath: string;
  content: string;
};
export type ShellAction = {
  id: number;
  type: "shell";
  command: string;
  abort?: () => void;
  abortSignal?: AbortSignal;
};
export type FileState = "creating" | "created" | "updating" | "updated";
export type ShellState =
  | "queued"
  | "running"
  | "completed"
  | "error"
  | "aborted";
export type FileActionState = {
  id: number;
  type: "file";
  filePath: string;
  state: FileState;
};
export type ShellActionState = {
  id: number;
  type: "shell";
  command: string;
  state: ShellState;
};
export type ActionState = FileActionState | ShellActionState;
// This is the type of the actions array in the project store
export type Actions = (FileAction | ShellAction)[];
export interface Template {
  templateFiles: (File & { name: string })[];
  ignorePatterns: string[];
  templatePrompt: string;
}
export interface Artifact {
  title: string;
  initialContext: string;
  actions: (FileAction | ShellAction)[];
  endingContext: string;
}
export type ExistingProject = {
  state: "existing";
  projectFiles: File[];
  messages: {
    id: string;
    role: Exclude<Role, "data">;
    content: { text: string } | { artifact: Artifact };
    createdAt: string;
    tokensUsed: number;
  }[];
};
export type BlankTemplateProject = Template & {
  state: "blankTemplate";
};
export type NewProject = Template & {
  state: "inProgress";
  enhancedPrompt: string;
};
export interface ContentFile {
  file: {
    contents: string;
  };
}
export interface Directory {
  directory: Record<string, ContentFile | Directory>;
}
export interface Preview {
  port: number;
  ready: boolean;
  baseUrl: string;
}
export type Project = {
  id: string;
  name: string;
  createdAt: string;
};
export type PlanInfo = {
  subscriptionId: string;
  planType: string;
  dailyTokenLimit: number;
  monthlyTokenLimit: number;
  dailyTokensUsed: number;
  monthlyTokensUsed: number;
  dailyTokensReset: Date;
  monthlyTokensReset: Date;
  endDate: Date;
  startDate: Date;
};
export type SubscriptionUsage = {
  plan: "free" | "pro" | "enterprise";
  startDate: string;
  endDate: string;
  tokenUsage: {
    daily: {
      used: number;
      limit: number;
      percentage: number;
    };
    monthly: {
      used: number;
      limit: number;
      percentage: number;
    };
  };
  peakUsage: number;
  dailyAverage: number;
};
export interface ITerminal {
  readonly cols?: number;
  readonly rows?: number;

  reset: () => void;
  write: (data: string) => void;
  onData: (cb: (data: string) => void) => void;
  input: (data: string) => void;
}
export type Files = Record<string, ContentFile | Directory>;
export interface TemplateResult {
  templateFiles: Array<{ name: string; filePath: string; content: string }>;
  ignorePatterns: string[];
  templatePrompt: string;
}
