import { existsSync, writeFileSync, readFileSync, unlink } from "fs";
import { join, dirname, resolve } from "path";
import { fileURLToPath } from "url";
import multer, { diskStorage } from "multer";

// For __dirname in ESM
const __dirname = dirname(fileURLToPath(import.meta.url));

const uploadFolder = join(__dirname, "../uploads");
const metadataPath = join(uploadFolder, "fileData.json");

// Ensure metadata file exists
if (!existsSync(metadataPath)) {
  writeFileSync(metadataPath, JSON.stringify([]));
}

// Multer Setup
const storage = diskStorage({
  destination: (req, file, cb) => cb(null, uploadFolder),
  filename: (req, file, cb) => cb(null, `${Date.now()}_${file.originalname}`),
});
export const upload = multer({ storage });

// Dynamic PDF Summarizer
async function summarizePdf(buffer) {
  const { default: pdfParse } = await import("pdf-parse");
  return pdfParse(buffer);
}

// Upload File
export const uploadFile = async (req, res) => {
  if (!req.file) return res.status(400).json({ message: "No file uploaded" });

  const filePath = req.file.path;

  try {
    const buffer = readFileSync(filePath);
    const data = await summarizePdf(buffer);

    const sentences = data.text.replace(/\n/g, " ").match(/[^.!?]+[.!?]+/g);
    const summary = sentences ? sentences.slice(0, 3).join(" ").trim() : "No summary available.";

    const fileMeta = {
      originalName: req.file.originalname,
      serverName: req.file.filename,
      path: resolve(filePath), // store absolute path
      uploadedAt: new Date().toISOString(),
      summary,
    };

    const existing = JSON.parse(readFileSync(metadataPath));
    existing.push(fileMeta);
    writeFileSync(metadataPath, JSON.stringify(existing, null, 2));

    res.status(200).json(fileMeta);
  } catch (err) {
    console.error("Upload error:", err);
    res.status(500).json({ message: "Failed to process PDF" });
  }
};

// List Files
export const listFiles = (req, res) => {
  try {
    const data = JSON.parse(readFileSync(metadataPath, "utf8"));
    const files = data.map(f => ({
      originalName: f.originalName || "Unknown",
      serverName: f.serverName || "",
      uploadedAt: f.uploadedAt || new Date().toISOString(),
      summary: f.summary || "No summary available",
      path: f.path ? resolve(f.path) : "",
    }));
    res.json(files);
  } catch (err) {
    console.error("List files error:", err);
    res.status(500).json({ message: "Failed to load file metadata" });
  }
};

// Download File
export const downloadFile = (req, res) => {
  const { file } = req.params;
  const metadata = JSON.parse(readFileSync(metadataPath));
  const target = metadata.find(f => f.serverName === file);

  if (!target || !existsSync(target.path)) return res.status(404).send("File not found");

  res.download(target.path, target.originalName, err => {
    if (err) console.error("Download error:", err);
  });
};

// Preview File (FIXED)
export const previewFile = (req, res) => {
  const { file } = req.params;
  const metadata = JSON.parse(readFileSync(metadataPath));
  const target = metadata.find(f => f.serverName === file);

  if (!target || !existsSync(target.path)) return res.status(404).send("File not found");

  // Ensure absolute path
  const absolutePath = resolve(target.path);

  res.sendFile(absolutePath, err => {
    if (err) {
      console.error("Preview error:", err);
      res.status(500).send("Failed to preview file");
    }
  });
};

// Delete File
export const deleteFile = (req, res) => {
  const { file } = req.params;
  const metadata = JSON.parse(readFileSync(metadataPath));
  const target = metadata.find(f => f.serverName === file);

  if (!target || !existsSync(target.path)) return res.status(404).json({ message: "File not found" });

  unlink(target.path, err => {
    if (err) return res.status(500).json({ message: "Failed to delete file" });

    const updated = metadata.filter(f => f.serverName !== file);
    writeFileSync(metadataPath, JSON.stringify(updated, null, 2));

    res.json({ message: "File deleted successfully" });
  });
};
