export type File = {
    filePath: string,
    content: string
};
export type Folders = {
    type: "folder" | "file",
    name: string,
    children?: Folders[],
    content?: string
};
export type HeadersInit = [string, string][] | Record<string, string> | Headers;
export type ActionType = 'file' | 'shell';

interface BaseAction {
    id: number;
}
export interface FileAction extends BaseAction {
    type: 'file';
    filePath: string;
    content: string;
    state: "creating" | "created" | "updating" | "updated"
}
export interface ShellAction extends BaseAction {
    type: 'shell';
    command: string;
    state: "streaming" | "streamed" | "running" | "completed" | "error";
}
export interface ParsedMessage {
    initialContext: string;
    actions: (FileAction | ShellAction)[];
    endingContext: string;
}
export interface ContentFile {
    file: {
        contents: string;
    };
}
export interface Directory {
    directory: Record<string, ContentFile | Directory>;
}
export type Files = Record<string, ContentFile | Directory>;

export type ActionState = Omit<FileAction, 'id' | 'content'> | Omit<ShellAction, 'id'>;

export type ActionHistory = ActionState & {
    actionId: number;
    timestamp: number;
}

export type MessageHistory = {
    messageId: string;
    actions: ActionHistory[];
}
