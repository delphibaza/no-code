import { HeadersInit } from "@repo/common/types";

export const getGitHubRepoContent = async (
    repoName: string,
    filePath: string = ''
): Promise<{ name: string; filePath: string; content: string }[]> => {
    const baseUrl = 'https://api.github.com';
    const token = process.env.GITHUB_ACCESS_TOKEN;

    const headers: HeadersInit = {
        Accept: 'application/vnd.github.v3+json',
    };

    if (token) {
        headers.Authorization = 'token ' + token;
    }
    try {
        const response = await fetch(`${baseUrl}/repos/${repoName}/contents/${filePath}`, {
            headers: headers,
        });

        if (!response.ok) {
            throw new Error(`Unable to fetch repository contents: ${response.statusText}`);
        }
        const data: any = await response.json();

        // Return content if it's a file(not an array)
        if (!Array.isArray(data)) {
            if (data.type === "file") {
                // If it's a file, get its content and we need to only get content if the data.content is available
                if (!data.content) {
                    return [];
                }
                const content = Buffer.from(data.content, 'base64').toString("utf-8");
                return [
                    {
                        name: data.name,
                        filePath: data.path,
                        content,
                    },
                ];
            }
        }
        // Process directory contents recursively
        const contents = await Promise.all(
            data.map(async (item: any) => {
                if (item.type === "dir") {
                    // Recursively get contents of subdirectories
                    return await getGitHubRepoContent(repoName, item.path);
                } else if (item.type === 'file') {
                    // Fetch file content
                    const fileResponse = await fetch(item.url, {
                        headers: headers,
                    });
                    const fileData: any = await fileResponse.json();
                    if (!fileData.content) {
                        return [];
                    }
                    const content = Buffer.from(fileData.content, "base64").toString("utf-8"); // Decode base64 content

                    return [
                        {
                            name: item.name,
                            filePath: item.path,
                            content,
                        },
                    ];
                }

                return [];
            }),
        );
        // Flatten the array of contents
        return contents.flat();
    } catch (error) {
        throw error;
    }
}