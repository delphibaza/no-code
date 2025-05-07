import { Button } from "@/components/ui/button";
import { useNetlifyStore } from "@/stores/netlify";
import {
  ArrowUpRightFromSquareIcon,
  CheckCircleIcon,
  Loader2,
  LogOutIcon,
  PlugIcon,
} from "lucide-react";
import { useState } from "react";
import { toast } from "react-hot-toast";
import { useShallow } from "zustand/react/shallow";
import { Input } from "../ui/input";
import { Label } from "../ui/label";

// Add the Netlify logo SVG component at the top of the file
const NetlifyLogo = () => (
  <svg viewBox="0 0 40 40" className="w-5 h-5">
    <path
      fill="currentColor"
      d="M28.589 14.135l-.014-.006c-.008-.003-.016-.006-.023-.013a.11.11 0 0 1-.028-.093l.773-4.726 3.625 3.626-3.77 1.604a.083.083 0 0 1-.033.006h-.015c-.005-.003-.01-.007-.02-.017a1.716 1.716 0 0 0-.495-.381zm5.258-.288l3.876 3.876c.805.806 1.208 1.208 1.674 1.355a2 2 0 0 1 1.206 0c.466-.148.869-.55 1.674-1.356L8.73 28.73l2.349-3.643c.011-.018.022-.034.04-.047.025-.018.061-.01.091 0a2.434 2.434 0 0 0 1.638-.083c.027-.01.054-.017.075.002a.19.19 0 0 1 .028.032L21.95 38.05zM7.863 27.863L5.8 25.8l4.074-1.738a.084.084 0 0 1 .033-.007c.034 0 .054.034.072.065a2.91 2.91 0 0 0 .13.184l.013.016c.012.017.004.034-.008.05l-2.25 3.493zm-2.976-2.976l-2.61-2.61c-.444-.444-.766-.766-.99-1.043l7.936 1.646a.84.84 0 0 0 .03.005c.049.008.103.017.103.063 0 .05-.059.073-.109.092l-.023.01-4.337 1.837zM.831 19.892a2 2 0 0 1 .09-.495c.148-.466.55-.868 1.356-1.674l3.34-3.34a2175.525 2175.525 0 0 0 4.626 6.687c.027.036.057.076.026.106-.146.161-.292.337-.395.528a.16.16 0 0 1-.05.062c-.013.008-.027.005-.042.002H9.78L.831 19.892zm5.68-6.403l4.491-4.491c.422.185 1.958.834 3.332 1.414 1.04.44 1.988.84 2.286.97.03.012.057.024.07.054.008.018.004.041 0 .06a2.003 2.003 0 0 0 .523 1.828c.03.03 0 .073-.026.11l-.014.021-4.56 7.063c-.012.02-.023.037-.043.05-.024.015-.058.008-.086.001a2.274 2.274 0 0 0-.543-.074c-.164 0-.342.03-.522.063h-.001c-.02.003-.038.007-.054-.005a.21.21 0 0 1-.045-.051l-4.808-7.013zm5.398-5.398l5.814-5.814c.805-.805 1.208-1.208 1.674-1.355a2 2 0 0 1 1.206 0c.466.147.869.55 1.674 1.355l1.26 1.26-4.135 6.404a.155.155 0 0 1-.041.048c-.025.017-.06.01-.09 0a2.097 2.097 0 0 0-1.92.37c-.027.028-.067.012-.101-.003-.54-.235-4.74-2.01-5.341-2.265zm12.506-3.676l3.818 3.818-.92 5.698v.015a.135.135 0 0 1-.008.038c-.01.02-.03.024-.05.03a1.83 1.83 0 0 0-.548.273.154.154 0 0 0-.02.017c-.011.012-.022.023-.04.025a.114.114 0 0 1-.043-.007l-5.818-2.472-.011-.005c-.037-.015-.081-.033-.081-.071a2.198 2.198 0 0 0-.31-.915c-.028-.046-.059-.094-.035-.141l4.066-6.303zm-3.932 8.606l5.454 2.31c.03.014.063.027.076.058a.106.106 0 0 1 0 .057c-.016.08-.03.171-.03.263v.153c0 .038-.039.054-.075.069l-.011.004c-.864.369-12.13 5.173-12.147 5.173-.017 0-.035 0-.052-.017-.03-.03 0-.072.027-.11a.76.76 0 0 0 .014-.02l4.482-6.94.008-.012c.026-.042.056-.089.104-.089l.045.007c.102.014.192.027.283.027.68 0 1.31-.331 1.69-.897a.16.16 0 0 1 .034-.04c.027-.02.067-.01.098.004zm-6.246 9.185l12.28-5.237s.018 0 .035.017c.067.067.124.112.179.154l.027.017c.025.014.05.03.052.056 0 .01 0 .016-.002.025L25.756 23.7l-.004.026c-.007.05-.014.107-.061.107a1.729 1.729 0 0 0-1.373.847l-.005.008c-.014.023-.027.045-.05.057-.021.01-.048.006-.07.001l-9.793-2.02c-.01-.002-.152-.519-.163-.52z"
    />
  </svg>
);

export default function NetlifyConnection() {
  const {
    validatedToken,
    isConnecting,
    setValidatedToken,
    setIsConnecting,
    removeToken,
  } = useNetlifyStore(
    useShallow((state) => ({
      validatedToken: state.validatedToken,
      isConnecting: state.isConnecting,
      setValidatedToken: state.setValidatedToken,
      setIsConnecting: state.setIsConnecting,
      removeToken: state.removeToken,
    }))
  );
  // const [isActionLoading ,setIsActionLoading] = useState(false);
  const [tokenInput, setTokenInput] = useState("");

  const handleConnect = async () => {
    if (!tokenInput) {
      toast.error("Please enter a Netlify API token");
      return;
    }
    setIsConnecting(true);
    try {
      const response = await fetch("https://api.netlify.com/api/v1/user", {
        headers: {
          Authorization: `Bearer ${tokenInput}`,
        },
      });
      if (!response.ok) {
        throw new Error(`HTTP error! Status: ${response.status}`);
      }
      // Store the token in the local storage only if user is found
      setValidatedToken(tokenInput);
      toast.success("Connected to Netlify successfully");
    } catch (error) {
      console.error("Error connecting to Netlify:", error);
      toast.error(
        `Failed to connect to Netlify: ${
          error instanceof Error ? error.message : "Unknown error"
        }`
      );
    } finally {
      setIsConnecting(false);
      setTokenInput("");
    }
  };

  const handleDisconnect = () => {
    // Update the store
    removeToken();
    toast.success("Disconnected from Netlify");
  };

  return (
    <div className="space-y-6 border shadow-sm rounded-lg">
      <div className="py-6 px-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="text-[#00AD9F]">
              <NetlifyLogo />
            </div>
            <h2 className="font-medium text-sm">Netlify Connection</h2>
            {validatedToken && (
              <CheckCircleIcon className="h-4 w-4 text-green-500" />
            )}
          </div>
        </div>

        {!validatedToken ? (
          <div className="mt-4">
            <Label className="text-sm">API Token</Label>
            <Input
              type="password"
              value={tokenInput}
              onChange={(e) => setTokenInput(e.target.value)}
              placeholder="Enter your Netlify API token"
              className="w-full mt-2"
            />
            <div className="text-sm mt-1">
              <a
                href="https://app.netlify.com/user/applications#personal-access-tokens"
                target="_blank"
                rel="noopener noreferrer"
                className="decoration-1 hover:underline flex items-center"
              >
                Get your token
                <ArrowUpRightFromSquareIcon className="w-3 h-3 inline-block ml-1" />
              </a>
            </div>
            <div className="flex items-center justify-between mt-4">
              <Button
                onClick={handleConnect}
                disabled={isConnecting || !tokenInput}
                variant="default"
                className="flex items-center gap-2"
              >
                {isConnecting ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    Connecting...
                  </>
                ) : (
                  <>
                    <PlugIcon className="w-4 h-4" />
                    Connect
                  </>
                )}
              </Button>
            </div>
          </div>
        ) : (
          <div className="flex flex-col w-full gap-3 mt-4">
            <div className="flex items-center gap-3">
              <Button
                onClick={handleDisconnect}
                variant="destructive"
                size="sm"
              >
                <LogOutIcon className="w-4 h-4" />
                Disconnect
              </Button>
            </div>
            <div className="text-sm">
              <a
                href="https://app.netlify.com"
                target="_blank"
                rel="noopener noreferrer"
                className="decoration-1 hover:underline flex items-center"
              >
                Netlify Dashboard
                <ArrowUpRightFromSquareIcon className="w-3 h-3 inline-block ml-1" />
              </a>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
