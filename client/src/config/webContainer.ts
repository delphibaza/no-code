import { cleanStackTrace } from "@/lib/utils";
import { cwd } from "@repo/common/constants";
import { WebContainer } from "@webcontainer/api";

let webContainerInstance: WebContainer | null = null;

export const getWebContainer = async (): Promise<WebContainer> => {
  if (!webContainerInstance) {
    webContainerInstance = await WebContainer.boot({
      coep: "credentialless",
      workdirName: cwd,
      forwardPreviewErrors: true, // Enable error forwarding from iframes
    });
  }
  return webContainerInstance;
};

interface WebContainerContext {
  loaded: boolean;
}

export const webcontainerContext: WebContainerContext = import.meta.hot?.data
  .webcontainerContext ?? {
  loaded: false,
};

if (import.meta.hot) {
  import.meta.hot.data.webcontainerContext = webcontainerContext;
}

export let webcontainer: Promise<WebContainer> = new Promise(() => {
  // noop for ssr
});

if (!import.meta.env.SSR) {
  webcontainer =
    import.meta.hot?.data.webcontainer ??
    Promise.resolve()
      .then(() => {
        return WebContainer.boot({
          coep: "credentialless",
          workdirName: cwd,
          forwardPreviewErrors: true, // Enable error forwarding from iframes
        });
      })
      .then(async (webcontainer) => {
        webcontainerContext.loaded = true;

        const { useGeneralStore } = await import("@/stores/general");
        const { usePreviewStore } = await import("@/stores/previews");

        // Listen for preview errors
        webcontainer.on("preview-message", (message) => {
          console.log("WebContainer preview message:", message);
          const { setActionAlert } = useGeneralStore.getState();
          // Handle both uncaught exceptions and unhandled promise rejections
          if (
            message.type === "PREVIEW_UNCAUGHT_EXCEPTION" ||
            message.type === "PREVIEW_UNHANDLED_REJECTION"
          ) {
            const isPromise = message.type === "PREVIEW_UNHANDLED_REJECTION";
            setActionAlert({
              type: "preview",
              title: isPromise
                ? "Unhandled Promise Rejection"
                : "Uncaught Exception",
              description: message.message,
              content: `Error occurred at ${message.pathname}${message.search}${message.hash}\nPort: ${message.port}\n\nStack trace:\n${cleanStackTrace(message.stack || "")}`,
              source: "preview",
            });
          }
        });

        webcontainer.on("server-ready", (port, url) => {
          const { addPreview } = usePreviewStore.getState();
          addPreview({ port, ready: true, baseUrl: url });
        });

        webcontainer.on("port", (port, type) => {
          const { removePreview } = usePreviewStore.getState();
          if (type === "close") {
            removePreview(port);
          }
        });

        return webcontainer;
      });

  if (import.meta.hot) {
    import.meta.hot.data.webcontainer = webcontainer;
  }
}
