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

export interface FileAction {
    type: 'file';
    filePath: string;
    content: string;
    state: "creating" | "created" | "updating" | "updated" | "mounted"
}
export interface ShellAction {
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