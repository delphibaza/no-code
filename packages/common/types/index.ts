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
export interface BaseAction {
    content: string;
}
export interface FileAction extends BaseAction {
    type: 'file';
    filePath: string;
}
export interface ShellAction extends BaseAction {
    type: 'shell';
}
export interface Artifact {
    id: string;
    title: string;
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