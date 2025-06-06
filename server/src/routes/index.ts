import { Router } from "express";
import chatRoutes from "./chat";
import fileRoutes from "./file";
import netlifyDeploy from "./netlifyDeploy";
import projectRoutes from "./project";
import vercelDeploy from "./vercelDeploy";

const router = Router();

router.use("/api", projectRoutes);
router.use("/api", fileRoutes);
router.use("/api", chatRoutes);
router.use("/api", netlifyDeploy);
router.use("/api", vercelDeploy);

// 404 handler
router.use((req, res) => {
  res.status(404).json({ message: "Not Found" });
});

export default router;
