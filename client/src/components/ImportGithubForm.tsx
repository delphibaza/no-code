import { useState, useRef, useEffect } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { customToast } from "@/lib/utils";
import { API_URL } from "@/lib/constants";
import { Github, Loader2, Eye, Trash2 } from "lucide-react";
import { useNavigate } from "react-router";

const GITHUB_URL_REGEX = /^https:\/\/github\.com\/[^\/]+\/[^\/]+(\/tree\/[^\/]+\/.*)?$/;

function getHistory() {
  try {
    return JSON.parse(localStorage.getItem("githubImportHistory") || "[]");
  } catch {
    return [];
  }
}
function setHistory(history) {
  localStorage.setItem("githubImportHistory", JSON.stringify(history.slice(0, 5)));
}

export function ImportGithubForm({ authenticatedFetch }: { authenticatedFetch: any }) {
  const [githubUrl, setGithubUrl] = useState("");
  const [projectName, setProjectName] = useState("");
  const [branch, setBranch] = useState("");
  const [isImporting, setIsImporting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [history, setHistoryState] = useState<string[]>(getHistory());
  const inputRef = useRef<HTMLInputElement>(null);
  const navigate = useNavigate();
  const [userToken, setUserToken] = useState("");
  const [preview, setPreview] = useState<any>(null);
  const [isPreviewLoading, setIsPreviewLoading] = useState(false);
  const [showPreview, setShowPreview] = useState(false);
  const [filteredPatterns, setFilteredPatterns] = useState<string[]>([]);

  useEffect(() => {
    inputRef.current?.focus();
  }, []);

  function validateUrl(url: string) {
    return GITHUB_URL_REGEX.test(url.trim());
  }

  function parseUrl(url: string) {
    // https://github.com/user/repo[(/tree/branch/path)]
    const match = url.match(
      /^https:\/\/github\.com\/([^\/]+)\/([^\/]+)(?:\/tree\/([^\/]+)(?:\/(.*))?)?/
    );
    if (!match) return null;
    return {
      owner: match[1],
      repo: match[2],
      branch: match[3] || "main",
      folder: match[4] || "",
    };
  }

  async function handlePreview(e: React.MouseEvent) {
    e.preventDefault();
    setError(null);
    setIsPreviewLoading(true);
    setShowPreview(true);
    try {
      const body: any = { repoUrl: githubUrl };
      if (branch) body.branch = branch;
      if (userToken) body.userToken = userToken;
      const data = await authenticatedFetch(`${API_URL}/api/import-github?preview=true`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      setPreview(data.projectFiles || []);
      setFilteredPatterns(data.filteredPatterns || []);
    } catch (error: any) {
      setPreview(null);
      setError(error?.message || "Ошибка при получении структуры репозитория");
    } finally {
      setIsPreviewLoading(false);
    }
  }

  async function handleImportGithub(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    if (!validateUrl(githubUrl)) {
      setError("Введите корректную ссылку на GitHub-репозиторий");
      inputRef.current?.focus();
      return;
    }
    setIsImporting(true);
    try {
      const body: any = { repoUrl: githubUrl };
      if (projectName) body.projectName = projectName;
      if (branch) body.branch = branch;
      if (userToken) body.userToken = userToken;
      const data = await authenticatedFetch(`${API_URL}/api/import-github`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      // Обновить историю
      const newHistory = [githubUrl, ...history.filter((h) => h !== githubUrl)];
      setHistory(newHistory);
      setHistoryState(newHistory);
      customToast("Импорт успешно завершён!", "success");
      setGithubUrl("");
      setProjectName("");
      setBranch("");
      setUserToken("");
      setPreview(null);
      setShowPreview(false);
      navigate(`/project/${data.projectId}`);
    } catch (error: any) {
      const errorMessage = error?.message || "Ошибка при импорте из GitHub";
      setError(errorMessage);
      customToast(errorMessage, "error");
    } finally {
      setIsImporting(false);
    }
  }

  function handleDeleteHistoryItem(url: string) {
    const newHistory = history.filter((h) => h !== url);
    setHistory(newHistory);
    setHistoryState(newHistory);
  }

  function renderPreviewTree(files: any[], level = 0) {
    // files: [{filePath, name}]
    const tree: Record<string, any> = {};
    files.forEach(f => {
      const parts = f.filePath.split("/");
      let node = tree;
      for (let i = 0; i < parts.length; i++) {
        if (!node[parts[i]]) node[parts[i]] = i === parts.length - 1 ? null : {};
        node = node[parts[i]];
      }
    });
    function renderNode(node: any, name: string, lvl: number) {
      if (node === null) return <div key={name} style={{ marginLeft: lvl * 16 }}>{name}</div>;
      return (
        <div key={name} style={{ marginLeft: lvl * 16 }}>
          <b>{name}</b>
          {Object.entries(node).map(([k, v]) => renderNode(v, k, lvl + 1))}
        </div>
      );
    }
    return Object.entries(tree).map(([k, v]) => renderNode(v, k, level));
  }

  return (
    <div className="w-full mb-6">
      <form onSubmit={handleImportGithub} className="flex flex-col gap-2 bg-muted/40 p-4 rounded-lg border">
        <label className="font-medium flex items-center gap-2">
          <Github className="w-5 h-5 text-gray-700" />
          Импорт из GitHub
        </label>
        <Input
          ref={inputRef}
          type="url"
          placeholder="https://github.com/user/repo или .../tree/main/subfolder"
          value={githubUrl}
          onChange={e => setGithubUrl(e.target.value)}
          disabled={isImporting}
          required
          className={error ? "border-red-500" : ""}
        />
        <div className="flex gap-2">
          <Input
            type="text"
            placeholder="Имя проекта (опционально)"
            value={projectName}
            onChange={e => setProjectName(e.target.value)}
            disabled={isImporting}
          />
          <Input
            type="text"
            placeholder="Ветка (по умолчанию main)"
            value={branch}
            onChange={e => setBranch(e.target.value)}
            disabled={isImporting}
          />
        </div>
        <Input
          type="password"
          placeholder="GitHub Personal Access Token (опционально, для приватных репозиториев или обхода лимитов)"
          value={userToken}
          onChange={e => setUserToken(e.target.value)}
          disabled={isImporting}
        />
        <div className="flex gap-2 mt-2">
          <Button type="button" variant="outline" onClick={handlePreview} disabled={isPreviewLoading || !githubUrl}>
            <Eye className="w-4 h-4" />
            {isPreviewLoading ? <Loader2 className="animate-spin w-4 h-4" /> : "Preview"}
          </Button>
          <Button type="submit" disabled={isImporting || !githubUrl} className="flex items-center gap-2">
            <Github className="w-4 h-4" />
            {isImporting ? <Loader2 className="animate-spin w-4 h-4" /> : "Импортировать из GitHub"}
          </Button>
        </div>
        {error && <div className="text-red-600 text-sm mt-1">{error}</div>}
        <div className="text-xs text-muted-foreground mt-2">
          Поддерживаются только публичные репозитории. Пример: <span className="font-mono">https://github.com/user/repo</span> или <span className="font-mono">https://github.com/user/repo/tree/main/subfolder</span>.<br/>
          <b>FAQ:</b> Импортируются все файлы выбранной ветки и папки. Если возникла ошибка — проверьте ссылку или попробуйте позже.<br/>
          Для приватных репозиториев или обхода лимитов GitHub API используйте персональный токен (scope: repo, read-only).
        </div>
      </form>
      {showPreview && (
        <div className="mt-3 bg-white border rounded p-2">
          <div className="font-semibold mb-1 flex items-center gap-2">
            <Eye className="w-4 h-4" /> Preview структуры репозитория
          </div>
          {isPreviewLoading ? <Loader2 className="animate-spin w-4 h-4" /> : preview ? renderPreviewTree(preview) : <div className="text-xs text-muted-foreground">Нет данных для предпросмотра</div>}
          {filteredPatterns.length > 0 && (
            <div className="text-xs text-muted-foreground mt-2">Файлы, которые будут проигнорированы: <span className="font-mono">{filteredPatterns.join(", ")}</span></div>
          )}
        </div>
      )}
      {history.length > 0 && (
        <div className="mt-3">
          <div className="text-xs text-muted-foreground mb-1">Недавние импорты:</div>
          <ul className="list-disc pl-5">
            {history.map((h) => (
              <li key={h} className="flex items-center gap-2">
                <button
                  className="underline text-blue-700 hover:text-blue-900 text-xs"
                  type="button"
                  onClick={() => setGithubUrl(h)}
                  disabled={isImporting}
                >
                  {h}
                </button>
                <button type="button" onClick={() => handleDeleteHistoryItem(h)} className="text-red-400 hover:text-red-700" title="Удалить">
                  <Trash2 className="w-3 h-3" />
                </button>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
} 