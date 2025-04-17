import { clerkMiddleware } from "@clerk/express";
import cors from "cors";
import dotenv from "dotenv";
import express from "express";
import chatRoutes from "./routes/chat";
import fileRoutes from "./routes/file";
import netlifyDeploy from "./routes/netlifyDeploy";
import projectRoutes from "./routes/project";
import vercelDeploy from "./routes/vercelDeploy";
dotenv.config();

const app = express();
app.use(cors());
app.use(express.json({
  limit: '10MB'
}));
app.use(clerkMiddleware({
  clockSkewInMs: 10000,
}));

app.use('/api', projectRoutes);
app.use('/api', fileRoutes);
app.use('/api', chatRoutes);
app.use('/api', netlifyDeploy);
app.use('/api', vercelDeploy);

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
