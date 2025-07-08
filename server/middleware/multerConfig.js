import multer from "multer";
import path from "path";
import fs from "fs";

// ✅ Storage Config (Per User Folder)
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const username = req.user?.username || "unknown_user";  // Fallback
    const userDir = path.join("uploads", username);
    fs.mkdirSync(userDir, { recursive: true });  // Ensure folder exists
    cb(null, userDir);
  },
  filename: (req, file, cb) => {
    const sanitizedFilename = file.originalname.replace(/[^a-z0-9.\-]/gi, "_");
    const uniqueName = `${Date.now()}-${sanitizedFilename}`;
    cb(null, uniqueName);
  },
});

// ✅ File Filter (PDF Only)
const fileFilter = (req, file, cb) => {
  if (file.mimetype === "application/pdf") {
    cb(null, true);
  } else {
    cb(new Error("Only PDF files allowed"), false);
  }
};

// ✅ Multer Config Export
const multerConfig = multer({ storage, fileFilter });
export default multerConfig;
