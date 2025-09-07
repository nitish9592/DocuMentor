import express from "express";
import { protect } from "../middleware/authMiddleware.js";
import multerConfig from "../middleware/multerConfig.js";
import {
  uploadFile,
  listFiles,
  deleteFile,
  downloadFile,
  previewFile,
} from "../controllers/fileController.js";

const router = express.Router();

// ✅ Protect all routes under /api/files
router.use(protect);

// ✅ File Routes
router.get("/", listFiles);
router.post("/upload", multerConfig.single("pdf"), uploadFile);
router.delete("/:file", deleteFile);
router.get("/download/:file", downloadFile);
router.get("/preview/:file", previewFile);

export default router;
