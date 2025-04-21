import { webcontainer } from "@/config/webContainer";
import { API_URL, IMPORT_ARTIFACT_ID } from "@/lib/constants";
import { projectFilesMsg, projectInstructionsMsg } from "@/lib/prompts";
import { getImportArtifact, mountFiles } from "@/lib/runtime";
import { customToast } from "@/lib/utils";
import { actionRunner } from "@/services/action-runner";
import { useFilesStore } from "@/stores/files";
import { useProjectStore } from "@/stores/project";
import {
  Artifact,
  BlankTemplateProject,
  ExistingProject,
  File,
  NewProject,
} from "@repo/common/types";
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
  const { customFetch } = useFetch();
  const { setSelectedFile, updateProjectFiles, setIgnorePatterns } =
    useFilesStore(
      useShallow((state) => ({
        updateProjectFiles: state.updateProjectFiles,
        setIgnorePatterns: state.setIgnorePatterns,
        setSelectedFile: state.setSelectedFile,
      }))
    );
  const {
    refreshProjects,
    addAction,
    upsertMessage,
    setCurrentMessageId,
    setRefreshProjects,
    setCurrentProjectState,
  } = useProjectStore(
    useShallow((state) => ({
      refreshProjects: state.refreshProjects,
      setCurrentProjectState: state.setCurrentProjectState,
      setRefreshProjects: state.setRefreshProjects,
      addAction: state.addAction,
      upsertMessage: state.upsertMessage,
      setCurrentMessageId: state.setCurrentMessageId,
    }))
  );

  async function setupImportArtifact(
    projectFiles: File[],
    container: WebContainer
  ) {
    const currentMessageId = IMPORT_ARTIFACT_ID;
    setCurrentMessageId(currentMessageId);
    const { artifact, currentActions } = getImportArtifact(projectFiles);
    upsertMessage({
      id: currentMessageId,
      role: "assistant", // Role is assistant because workbench component ignores data role messages
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
  }

  async function initializeProject(projectId: string) {
    const container = await webcontainer;
    try {
      setInitializingProject(true);
      if (!container) {
        throw new Error("WebContainer not initialized");
      }
      const response = await customFetch(
        `${API_URL}/api/project/${projectId}`,
        { method: "POST" }
      );
      const data = await response.json();
      if (!response.ok) {
        throw new Error(data?.message ?? "Failed to initialize project");
      }
      switch (data.state) {
        case "existing":
          setCurrentProjectState("existing");
          await initializeExistingProject(data, container);
          break;
        case "new":
          setCurrentProjectState("new");
          await initializeNewProject(data, container);
          break;
        case "blankTemplate":
          setCurrentProjectState("blankTemplate");
          await initializeBlankTemplate(data, container);
          break;
        default:
          throw new Error("Invalid project state");
      }
    } catch (error) {
      customToast(
        error instanceof Error
          ? error.message
          : "Error while initializing project"
      );
    } finally {
      setInitializingProject(false);
      setRefreshProjects(!refreshProjects);
    }
  }

  async function initializeExistingProject(
    data: ExistingProject,
    container: WebContainer
  ) {
    const { messages, projectFiles, ignorePatterns } = data;
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
    setIgnorePatterns(ignorePatterns);
    await setupImportArtifact(projectFiles, container);
  }

  async function initializeNewProject(
    data: NewProject,
    container: WebContainer
  ) {
    const { enhancedPrompt, templateFiles, templatePrompt, ignorePatterns } =
      data;
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
    // Store ignore patterns for further use
    setIgnorePatterns(ignorePatterns);
    setMessages(messages as Message[]);
    // Store template prompt for further use, if available
    if (templatePrompt) {
      upsertMessage({
        id: crypto.randomUUID(),
        role: "data",
        content: templatePrompt,
        timestamp: Date.now(),
      });
    }
    // Add files to project store
    updateProjectFiles(templateFiles);
    await mountFiles(templateFiles, container);
    setCurrentMessageId(crypto.randomUUID());
    reload();
  }

  // We don't setMessages and reload here because we are not using chat as of now
  // When the user sends a message, we will use /api/chat
  async function initializeBlankTemplate(
    data: BlankTemplateProject,
    container: WebContainer
  ) {
    const { templateFiles, templatePrompt, ignorePatterns } = data;
    // Store ignore patterns for further use
    setIgnorePatterns(ignorePatterns);
    // Store template prompt for further use, if available
    if (templatePrompt) {
      upsertMessage({
        id: crypto.randomUUID(),
        role: "data",
        content: templatePrompt,
        timestamp: Date.now(),
      });
    }
    await setupImportArtifact(templateFiles, container);
  }

  return { initializeProject, initializingProject };
}
