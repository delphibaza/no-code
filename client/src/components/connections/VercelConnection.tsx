import { useVercelStore } from "@/stores/vercel";
import { motion } from "framer-motion";
import {
  ArrowUpRightFromSquareIcon,
  CheckCircle,
  Loader2,
  LogOutIcon,
  Plug,
} from "lucide-react";
import React, { useState } from "react";
import { toast } from "react-hot-toast";
import { useShallow } from "zustand/react/shallow";
import { Button } from "../ui/button";
import { Input } from "../ui/input";
import { Label } from "../ui/label";

export default function VercelConnection() {
  const {
    validatedToken,
    isConnecting,
    setValidatedToken,
    setIsConnecting,
    removeToken,
  } = useVercelStore(
    useShallow((state) => ({
      validatedToken: state.validatedToken,
      isConnecting: state.isConnecting,
      setValidatedToken: state.setValidatedToken,
      setIsConnecting: state.setIsConnecting,
      removeToken: state.removeToken,
    })),
  );
  const [tokenInput, setTokenInput] = useState("");

  const handleConnect = async (event: React.FormEvent) => {
    event.preventDefault();
    setIsConnecting(true);
    try {
      const response = await fetch("https://api.vercel.com/v2/user", {
        headers: {
          Authorization: `Bearer ${tokenInput}`,
          "Content-Type": "application/json",
        },
      });
      if (!response.ok) {
        throw new Error("Invalid token or unauthorized");
      }
      setValidatedToken(tokenInput);
      toast.success("Successfully connected to Vercel");
    } catch (error) {
      console.error("Auth error:", error);
      toast.error("Failed to connect to Vercel");
      setValidatedToken("");
    } finally {
      setIsConnecting(false);
      setTokenInput("");
    }
  };

  const handleDisconnect = () => {
    // Update the store
    removeToken();
    toast.success("Disconnected from Vercel");
  };

  return (
    <motion.div
      className="bg-[#FFFFFF] dark:bg-[#0A0A0A] rounded-lg border border-[#E5E5E5] dark:border-[#1A1A1A]"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.3 }}
    >
      <div className="py-6 px-4 space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <img
              className="w-5 h-5 dark:invert"
              height="24"
              width="24"
              crossOrigin="anonymous"
              src={`https://cdn.simpleicons.org/vercel/black`}
            />
            <h3 className="text-sm font-medium">Vercel Connection</h3>
            {validatedToken && (
              <CheckCircle className="w-4 h-4 text-green-500" />
            )}
          </div>
        </div>

        {!validatedToken ? (
          <div className="space-y-4">
            <div>
              <Label className="text-sm">Personal Access Token</Label>
              <Input
                type="password"
                value={tokenInput}
                onChange={(e) => setTokenInput(e.target.value)}
                placeholder="Enter your Vercel personal access token"
                className="w-full mt-2"
              />
              <div className="mt-1 text-sm">
                <a
                  href="https://vercel.com/account/tokens"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1"
                >
                  Get your token
                  <ArrowUpRightFromSquareIcon className="w-3 h-3 ml-1" />
                </a>
              </div>
            </div>
            <Button
              onClick={handleConnect}
              disabled={isConnecting || !tokenInput}
            >
              {isConnecting ? (
                <div className="flex items-center gap-2">
                  <Loader2 className="animate-spin size-4" />
                  Connecting...
                </div>
              ) : (
                <div className="flex items-center gap-2">
                  <Plug className="size-5" />
                  Connect
                </div>
              )}
            </Button>
          </div>
        ) : (
          <div className="flex flex-col w-full gap-3 mt-4">
            <div className="flex items-center gap-3">
              <Button
                onClick={handleDisconnect}
                size="sm"
                variant={"destructive"}
              >
                <LogOutIcon className="w-4 h-4" />
                Disconnect
              </Button>
            </div>
            <div className="text-sm">
              <a
                href="https://vercel.com/dashboard"
                target="_blank"
                rel="noopener noreferrer"
                className="decoration-1 hover:underline flex items-center"
              >
                Vercel Dashboard
                <ArrowUpRightFromSquareIcon className="w-3 h-3 inline-block ml-1" />
              </a>
            </div>
          </div>
        )}
      </div>
    </motion.div>
  );
}
