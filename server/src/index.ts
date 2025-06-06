import { clerkMiddleware } from "@clerk/express";
import cors from "cors";
import dotenv from "dotenv";
import express from "express";
import { MAX_REQUEST_SIZE } from "./constants";
import router from "./routes/index";
dotenv.config();

const app = express();
app.use(cors());

app.use(
  express.json({
    limit: `${MAX_REQUEST_SIZE}MB`,
  })
);
app.use(
  clerkMiddleware({
    clockSkewInMs: 10000,
  })
);
// Routes
app.use(router);

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
