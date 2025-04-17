import { PromptInput } from "@/components/PromptInput";
import { TemplateShowcase } from "@/components/TemplateShowcase";
import { BackgroundDots } from "@/components/ui/background-dots";
import { Badge } from "@/components/ui/badge";
import useFetch from "@/hooks/useFetch";
import { API_URL } from "@/lib/constants";
import { customToast } from "@/lib/utils";
import { useProjectStore } from "@/stores/project";
import { PromptSchema } from "@repo/common/zod";
import { motion } from "framer-motion";
import { Sparkles } from "lucide-react";
import { useState } from "react";
import { useNavigate } from "react-router";
import { useShallow } from "zustand/react/shallow";

const fadeInUp = {
  initial: { opacity: 0, y: 20 },
  animate: { opacity: 1, y: 0 },
  transition: { duration: 0.5 },
};

const stagger = {
  animate: {
    transition: {
      staggerChildren: 0.2,
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
      upsertMessage({
        id: crypto.randomUUID(),
        role: "user",
        timestamp: Date.now(),
        content: input,
      });
      navigate(`/project/${data.projectId}`);
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : "Error while getting files";
      customToast(errorMessage);
    } finally {
      setIsLoading(false);
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
          <section className="py-16 md:py-24">
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
                    className="px-3.5 py-1.5 bg-primary-foreground"
                  >
                    <Sparkles className="h-3.5 w-3.5 mr-1" />
                    <span>AI-Powered Website Builder</span>
                  </Badge>
                </motion.div>

                <motion.h1
                  className="text-4xl font-semibold tracking-tighter sm:text-5xl md:text-6xl"
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
                  Transform Your Ideas into
                  <motion.span
                    className="text-transparent bg-clip-text bg-gradient-to-r from-blue-500 to-purple-600"
                    variants={{
                      initial: { opacity: 0 },
                      animate: {
                        opacity: 1,
                        transition: { delay: 0.5, duration: 0.8 },
                      },
                    }}
                  >
                    {" "}
                    Stunning Websites
                  </motion.span>
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
                  <PromptInput
                    handleSubmit={handleSubmit}
                    isLoading={isLoading}
                  />

                  {/* Template Showcase Component */}
                  <motion.div
                    className="w-full"
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
