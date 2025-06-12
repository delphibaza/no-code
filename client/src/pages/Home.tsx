import { ExamplePrompts } from "@/components/ExamplePrompts";
import { PromptInput } from "@/components/PromptInput";
import { TemplateShowcase } from "@/components/TemplateShowcase";
import { BackgroundDots } from "@/components/ui/background-dots";
import { Badge } from "@/components/ui/badge";
import useFetch from "@/hooks/useFetch";
import { API_URL } from "@/lib/constants";
import { customToast } from "@/lib/utils";
import { useProjectStore } from "@/stores/project";
import type { PromptSchema } from "@repo/common/zod";
import { motion } from "framer-motion";
import { Sparkles } from "lucide-react";
import { useState } from "react";
import { useNavigate } from "react-router";
import { useShallow } from "zustand/react/shallow";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { ImportGithubForm } from "@/components/ImportGithubForm";

const fadeInUp = {
  initial: { opacity: 0, y: 20 },
  animate: { opacity: 1, y: 0 },
  transition: { duration: 0.25 },
};

const stagger = {
  animate: {
    transition: {
      staggerChildren: 0.1,
    },
  },
};

export default function HomePage() {
  const [isLoading, setIsLoading] = useState(false);
  const { authenticatedFetch } = useFetch();
  const navigate = useNavigate();
  const { upsertMessage } = useProjectStore(
    useShallow((state) => ({
      upsertMessage: state.upsertMessage,
    }))
  );
  const [githubUrl, setGithubUrl] = useState("");
  const [isImporting, setIsImporting] = useState(false);

  async function handleSubmit(input: string, templateName?: string) {
    try {
      setIsLoading(true);
      const data = await authenticatedFetch(`${API_URL}/api/new`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          prompt: input,
          templateName: templateName,
        } as PromptSchema),
      });
      // Don't add user message if template is selected
      // to reduce the number of messages
      if (!templateName) {
        upsertMessage({
          id: crypto.randomUUID(),
          role: "user",
          timestamp: Date.now(),
          content: input,
        });
      }
      navigate(`/project/${data.projectId}`);
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : "Error while getting files";
      customToast(errorMessage);
    } finally {
      setIsLoading(false);
    }
  }

  async function handleImportGithub(e: React.FormEvent) {
    e.preventDefault();
    if (!githubUrl) return;
    setIsImporting(true);
    try {
      const data = await authenticatedFetch(`${API_URL}/api/import-github`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ repoUrl: githubUrl }),
      });
      navigate(`/project/${data.projectId}`);
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : "Error importing from GitHub";
      customToast(errorMessage);
    } finally {
      setIsImporting(false);
    }
  }

  return (
    <BackgroundDots>
      <div className="flex flex-col h-full w-full">
        <motion.main
          className="flex-1"
          initial="initial"
          animate="animate"
          variants={stagger}
        >
          <section className="py-16">
            <div className="container px-4 md:px-6">
              <motion.div
                className="flex flex-col items-center gap-4 text-center"
                variants={stagger}
              >
                <motion.div
                  variants={{
                    initial: { opacity: 0, scale: 0.8 },
                    animate: {
                      opacity: 1,
                      scale: 1,
                      transition: {
                        type: "spring",
                        stiffness: 400,
                        damping: 20,
                      },
                    },
                  }}
                >
                  <Badge
                    variant="outline"
                    className="px-3.5 py-1.5 bg-background/80 backdrop-blur-sm"
                  >
                    <Sparkles className="h-3.5 w-3.5 mr-1" />
                    <span>AI-Powered Website Builder</span>
                  </Badge>
                </motion.div>

                <motion.h1
                  className="text-4xl font-semibold tracking-tighter sm:text-5xl md:text-6xl text-transparent bg-clip-text bg-gradient-to-r from-blue-600 to-purple-700"
                  variants={{
                    initial: { opacity: 0, y: 30 },
                    animate: {
                      opacity: 1,
                      y: 0,
                      transition: {
                        type: "spring",
                        stiffness: 100,
                        damping: 20,
                      },
                    },
                  }}
                >
                  What can I help you ship?
                </motion.h1>

                <motion.p
                  className="max-w-[700px] text-muted-foreground"
                  variants={fadeInUp}
                >
                  Turn your ideas into beautiful, production-ready websites with
                  a simple prompt. No coding required.
                </motion.p>

                <motion.div
                  className="mt-8 w-full max-w-3xl space-y-6"
                  variants={{
                    initial: { opacity: 0, y: 20 },
                    animate: {
                      opacity: 1,
                      y: 0,
                      transition: {
                        delay: 0.6,
                        duration: 0.8,
                        type: "spring",
                        stiffness: 100,
                      },
                    },
                  }}
                >
                  {/* Импорт из GitHub - улучшенная форма */}
                  <ImportGithubForm authenticatedFetch={authenticatedFetch} />
                  <div className="w-full mx-auto">
                    <PromptInput
                      handleSubmit={handleSubmit}
                      isLoading={isLoading}
                    />
                  </div>

                  {/* Example Prompts UI */}
                  <div className="mt-4">
                    <ExamplePrompts onPromptClick={handleSubmit} />
                  </div>

                  {/* Template Showcase Component */}
                  <motion.div
                    className="w-full mt-8"
                    variants={{
                      initial: { opacity: 0, y: 10 },
                      animate: {
                        opacity: 1,
                        y: 0,
                        transition: { delay: 0.8, duration: 0.5 },
                      },
                    }}
                  >
                    <TemplateShowcase onPromptSelect={handleSubmit} />
                  </motion.div>
                </motion.div>
              </motion.div>
            </div>
          </section>
        </motion.main>
      </div>
    </BackgroundDots>
  );
}
