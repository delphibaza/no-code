import { Template } from "@repo/common/types";

export function parseXML(content: string) {
    const result: Template = {
        title: "",
        files: []
    }
    const title = content.match(/<boltArtifact id=".+?" title="(.+?)">/)?.[1];
    result.title = title || "";
    const files = content.match(/<boltAction type="file" filePath="(.+?)">([\s\S]+?)<\/boltAction>/g);
    if (files) {
        for (const file of files) {
            const filePath = file.match(/<boltAction type="file" filePath="(.+?)">/)?.[1];
            const fileContent = file.match(/<boltAction type="file" filePath=".+?">([\s\S]+?)<\/boltAction>/)?.[1];
            if (filePath && fileContent) {
                result.files.push({
                    path: filePath,
                    content: fileContent.split("\n")
                })
            }
        }
    }
    return result;
}