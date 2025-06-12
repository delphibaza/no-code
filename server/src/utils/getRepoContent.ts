import { HeadersInit } from "@repo/common/types";

// Максимальные лимиты
const MAX_FILES = 1000;
const MAX_FILE_SIZE = 1024 * 1024; // 1MB
// Фильтруем опасные/ненужные файлы
export const DANGEROUS_PATTERNS = [
  /^\.git\//,
  /^\.env/,
  /node_modules\//,
  /package-lock\.json$/,
  /yarn\.lock$/,
  /pnpm-lock\.yaml$/,
  /\.DS_Store$/,
  /\.idea\//,
  /\.vscode\//,
  /\.github\//,
  /\.gitignore$/,
  /\.gitattributes$/,
  /\.npmrc$/,
  /\.lock-wscript$/,
  /\.swp$/,
  /\.swo$/,
  /\.log$/,
  /\.exe$/,
  /\.dll$/,
  /\.bin$/,
  /\.so$/,
  /\.pyc$/,
  /\.pyo$/,
  /\.class$/,
  /\.jar$/,
  /\.zip$/,
  /\.tar$/,
  /\.gz$/,
  /\.7z$/,
  /\.rar$/,
];

function isDangerous(filePath) {
  return DANGEROUS_PATTERNS.some((re) => re.test(filePath));
}

export const getGitHubRepoContent = async (
  repoName,
  filePath = '',
  branch = 'main',
  userToken = undefined,
  fileCountObj = { count: 0 }
) => {
  const baseUrl = 'https://api.github.com';
  const token = userToken || process.env.GITHUB_ACCESS_TOKEN;
  const headers = {
    Accept: 'application/vnd.github.v3+json',
  };
  if (token) {
    headers.Authorization = 'token ' + token;
  }
  try {
    // Добавляем branch в запрос
    const url = `${baseUrl}/repos/${repoName}/contents/${filePath}?ref=${encodeURIComponent(branch)}`;
    const response = await fetch(url, { headers });
    if (response.status === 404) {
      throw new Error('Репозиторий, путь или ветка не найдены');
    }
    if (response.status === 403) {
      throw new Error('Доступ запрещён или превышен лимит GitHub API');
    }
    if (!response.ok) {
      throw new Error(`Ошибка GitHub API: ${response.statusText}`);
    }
    const data = await response.json();
    // Если это файл
    if (!Array.isArray(data)) {
      if (data.type === 'file') {
        if (!data.content) return [];
        if (isDangerous(data.path)) return [];
        const content = Buffer.from(data.content, 'base64').toString('utf-8');
        if (content.length > MAX_FILE_SIZE) {
          throw new Error(`Файл ${data.path} превышает лимит размера 1MB`);
        }
        fileCountObj.count++;
        if (fileCountObj.count > MAX_FILES) {
          throw new Error(`Превышен лимит файлов (${MAX_FILES})`);
        }
        return [{ name: data.name, filePath: data.path, content }];
      }
      return [];
    }
    // Если это папка
    const contents = await Promise.all(
      data.map(async (item) => {
        if (isDangerous(item.path)) return [];
        if (item.type === 'dir') {
          return await getGitHubRepoContent(repoName, item.path, branch, userToken, fileCountObj);
        } else if (item.type === 'file') {
          const fileResponse = await fetch(item.url + `?ref=${encodeURIComponent(branch)}`, { headers });
          const fileData = await fileResponse.json();
          if (!fileData.content) return [];
          const content = Buffer.from(fileData.content, 'base64').toString('utf-8');
          if (content.length > MAX_FILE_SIZE) {
            throw new Error(`Файл ${item.path} превышает лимит размера 1MB`);
          }
          fileCountObj.count++;
          if (fileCountObj.count > MAX_FILES) {
            throw new Error(`Превышен лимит файлов (${MAX_FILES})`);
          }
          return [{ name: item.name, filePath: item.path, content }];
        }
        return [];
      })
    );
    return contents.flat();
  } catch (error) {
    throw error;
  }
};