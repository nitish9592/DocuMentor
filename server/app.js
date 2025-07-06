import express from "express";
import cors from "cors";
import authRoutes from "./routes/authRoutes.js";
import fileRoutes from "./routes/fileRoutes.js";

const app = express();
app.use(cors());
app.use(express.json());
app.use("/uploads", express.static("uploads")); // Serve files

app.use("/api/auth", authRoutes);
app.use("/api/files", fileRoutes);

export default app;
