import { API_URL } from "@/lib/constants";
import type { Template } from "@repo/common/types";
import { Loader2 } from "lucide-react";
import { useEffect, useState } from "react";
import toast, { Toaster } from "react-hot-toast";
import { useParams } from "react-router";

export default function ProjectInfo() {
  const [loading, setLoading] = useState(true);
  const [template, setTemplate] = useState<Template | null>(null);
  const { projectId } = useParams();

  useEffect(() => {
    async function fetchTemplate() {
      try {
        const response = await fetch(`${API_URL}/api/template/${projectId}`);
        const result = await response.json();
        if (!response.ok) {
          throw new Error(result.msg);
        }
        setTemplate(result.template);
        fetchCode();
      } catch (error) {
        setLoading(false);
        toast.error(
          error instanceof Error ? error.message : "Failed to fetch template"
        );
      }
    }
    if (projectId) fetchTemplate();
  }, [API_URL, projectId]);

  async function fetchCode() {
    try {
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : "Failed to fetch code"
      );
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen w-full flex justify-center items-center">
        <Loader2 className="w-5 h-5 animate-spin" />
      </div>
    );
  }
  return (
    <div>
      <Toaster />
    </div>
  );
}
