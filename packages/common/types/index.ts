export type Template = {
    title: string,
    files: {
        path: string,
        content: string[]
    }[]
}