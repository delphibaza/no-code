import cors from "cors";
import dotenv from "dotenv";
import express from "express";
import chatRoutes from "./routes/chatRoutes";
import projectRoutes from "./routes/projectRoutes";
dotenv.config();

const app = express();
app.use(cors());
app.use(express.json({
  limit: '10MB'
}));
app.use('/api', projectRoutes);
app.use('/api', chatRoutes);

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
