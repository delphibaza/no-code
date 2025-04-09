import { webcontainer } from "@/config/webContainer";
import { API_URL } from "@/lib/constants";
import { projectFilesMsg, projectInstructionsMsg } from "@/lib/prompts";
import { getImportArtifact, mountFiles } from "@/lib/runtime";
import { customToast } from "@/lib/utils";
import { actionRunner } from "@/services/action-runner";
import { useFilesStore } from "@/stores/files";
import { useProjectStore } from "@/stores/project";
import { Artifact, ExistingProject, NewProject } from "@repo/common/types";
import type { WebContainer } from "@webcontainer/api";
import { Message } from "ai/react";
import { useState } from "react";
import { useShallow } from "zustand/react/shallow";
import useFetch from "./useFetch";

export function useInitProject(
  setMessages: (
    messages: Message[] | ((messages: Message[]) => Message[])
  ) => void,
  reload: () => Promise<string | null | undefined>
) {
  const [initializingProject, setInitializingProject] = useState(false);
  const { authenticatedFetch } = useFetch();
  const { setSelectedFile, updateProjectFiles } = useFilesStore(
    useShallow((state) => ({
      updateProjectFiles: state.updateProjectFiles,
      setSelectedFile: state.setSelectedFile,
    }))
  );
  const {
    refreshProjects,
    addAction,
    upsertMessage,
    setCurrentMessageId,
    setRefreshProjects,
  } = useProjectStore(
    useShallow((state) => ({
      refreshProjects: state.refreshProjects,
      setRefreshProjects: state.setRefreshProjects,
      addAction: state.addAction,
      upsertMessage: state.upsertMessage,
      setCurrentMessageId: state.setCurrentMessageId,
    }))
  );
  async function initializeProject(projectId: string) {
    const container = await webcontainer;
    try {
      setInitializingProject(true);
      if (!container) {
        throw new Error("WebContainer not initialized");
      }
      const result = await authenticatedFetch(
        `${API_URL}/api/project/${projectId}`
      );
      const { messages, projectFiles } = result as ExistingProject;
      messages.forEach((message) => {
        if (message.role === "user") {
          // For user messages, content is always { text: string }
          const userContent = message.content as { text: string };
          upsertMessage({
            id: message.id,
            role: message.role,
            content: userContent.text,
            timestamp: new Date(message.createdAt).getTime(),
          });
        } else if (message.role === "assistant") {
          // For assistant messages, content is always Artifact
          const assistantContent = message.content as { artifact: Artifact };
          upsertMessage({
            id: message.id,
            role: message.role,
            content: JSON.stringify(assistantContent),
            timestamp: new Date(message.createdAt).getTime(),
          });
          assistantContent.artifact.actions.forEach((action) => {
            if (action.type === "file") {
              addAction(message.id, { state: "created", ...action });
            } else if (action.type === "shell") {
              addAction(message.id, { state: "completed", ...action });
            }
          });
        }
      });
      const currentMessageId = "import-artifact";
      setCurrentMessageId(currentMessageId);
      const { artifact, currentActions } = getImportArtifact(messages);
      upsertMessage({
        id: currentMessageId,
        role: "data",
        timestamp: Date.now(),
        content: JSON.stringify({ artifact: artifact }),
      });
      await mountFiles(projectFiles, container);
      updateProjectFiles(projectFiles);
      setSelectedFile(projectFiles[0]?.filePath ?? "");
      currentActions.forEach((action) => {
        addAction(currentMessageId, {
          state: "queued",
          ...action,
        });
        actionRunner.addAction(currentMessageId, action);
      });
    } catch (error) {
      if (
        error instanceof Error &&
        error.message.includes("Project has not been initialized")
      ) {
        try {
          // Call the generate endpoint
          if (!container) throw new Error("WebContainer not initialized");
          await initializeNewProject(projectId, container);
        } catch (genError) {
          customToast(
            genError instanceof Error
              ? genError.message
              : "Something went wrong while generating project"
          );
        }
      } else {
        const errorMessage =
          error instanceof Error
            ? error.message
            : "Error while initializing project";
        customToast(errorMessage);
      }
    } finally {
      setInitializingProject(false);
      setRefreshProjects(!refreshProjects);
    }
  }

  async function initializeNewProject(
    projectId: string,
    container: WebContainer
  ) {
    const result = await authenticatedFetch(
      `${API_URL}/api/project/${projectId}/generate`,
      {
        method: "POST",
      }
    );

    const { enhancedPrompt, templateFiles, templatePrompt, ignorePatterns } =
      result as NewProject;
    const messages = [
      {
        id: "1",
        role: "user",
        content: projectFilesMsg(templateFiles, ignorePatterns),
      },
      ...(templatePrompt
        ? [
            { id: "2", role: "user", content: templatePrompt },
            {
              id: "3",
              role: "user",
              content: projectInstructionsMsg(enhancedPrompt),
            },
          ]
        : [
            {
              id: "2",
              role: "user",
              content: projectInstructionsMsg(enhancedPrompt),
            },
          ]),
    ];
    setMessages(messages as Message[]);
    upsertMessage({
      id: crypto.randomUUID(),
      role: "data",
      content: templatePrompt,
      timestamp: Date.now(),
    });
    // Add files to project store
    updateProjectFiles(templateFiles);
    await mountFiles(templateFiles, container);
    setCurrentMessageId(crypto.randomUUID());
    reload();
  }
  return { initializeProject, initializingProject };
}
