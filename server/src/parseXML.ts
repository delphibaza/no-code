type Result = {
    projectId: string,
    title: string,
    files: { [key: string]: string }
}
export function parseXML(content: string) {
    const result: Result = {
        projectId: "",
        title: "",
        files: {}
    }
    const projectId = content.match(/<boltArtifact id="(.+?)" title=".+?">/)?.[1];
    result.projectId = projectId || "";
    const title = content.match(/<boltArtifact id=".+?" title="(.+?)">/)?.[1];
    result.title = title || "";
    const files = content.match(/<boltAction type="file" filePath="(.+?)">([\s\S]+?)<\/boltAction>/g);
    if (files) {
        for (const file of files) {
            const filePath = file.match(/<boltAction type="file" filePath="(.+?)">/)?.[1];
            const fileContent = file.match(/<boltAction type="file" filePath=".+?">([\s\S]+?)<\/boltAction>/)?.[1];
            if (filePath && fileContent) {
                result.files[filePath] = fileContent;
            }
        }
    }    
    return result;
}