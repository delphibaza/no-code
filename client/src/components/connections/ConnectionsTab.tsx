import { motion } from "framer-motion";
import { Loader2, PlugZapIcon } from "lucide-react";
import React, { Suspense } from "react";

// Use React.lazy for dynamic imports
const NetlifyConnection = React.lazy(() => import("./NetlifyConnection"));
const VercelConnection = React.lazy(() => import("./VercelConnection"));

export default function ConnectionsTab() {
  return (
    <div className="space-y-3">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
      >
        <div className="flex items-center gap-2">
          <PlugZapIcon className="size-5" />
          <h2 className="font-medium">Connection Settings</h2>
        </div>
      </motion.div>
      <p className="text-sm">
        Manage your external service connections and integrations
      </p>

      <div className="grid grid-cols-2 gap-6">
        <Suspense fallback={<Loader2 className="animate-spin size-4" />}>
          <NetlifyConnection />
        </Suspense>
        <Suspense fallback={<Loader2 className="animate-spin size-4" />}>
          <VercelConnection />
        </Suspense>
      </div>
    </div>
  );
}
