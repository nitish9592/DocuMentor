import express from "express";
import cors from "cors";
import path from "path";
import { fileURLToPath } from "url";
import authRoutes from "./routes/authRoutes.js";
import fileRoutes from "./routes/fileRoutes.js";

const app = express();
// ✅ Middlewares
app.use(cors());
app.use(express.json());
app.use("/uploads", express.static("uploads"));  // Serve uploaded PDFs

// ✅ API Routes
app.use("/api/auth", authRoutes);
app.use("/api/files", fileRoutes);

// ✅ Serve Frontend (client/dist) - Vite Build
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

app.use(express.static(path.join(__dirname, "../client/dist")));

app.get("*", (req, res) => {
  res.sendFile(path.join(__dirname, "../client/dist/index.html"));
});

export default app;
