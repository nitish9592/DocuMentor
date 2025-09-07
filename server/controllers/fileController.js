import { existsSync, writeFileSync, readFileSync, readFile, unlink } from "fs";
import { join, dirname } from "path";
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

// ✅ Dynamic Import Helper
async function summarizePdf(buffer) {
  const { default: pdfParse } = await import("pdf-parse");
  return pdfParse(buffer);
}

// 🔹 Named Exports
export const uploadFile = async (req, res) => {
  if (!req.file) {
    return res.status(400).json({ message: "No file uploaded" });
  }

  const filePath = join(uploadFolder, req.file.filename);
  try {
    const buffer = readFileSync(filePath);
    const data = await summarizePdf(buffer);

    const sentences = data.text.replace(/\n/g, " ").match(/[^.!?]+[.!?]+/g);
    const summary = sentences
      ? sentences.slice(0, 3).join(" ").trim()
      : "No summary available.";

    const fileMeta = {
      originalName: req.file.originalname,
      serverName: req.file.filename,
      path: req.file.path,
      uploadedAt: new Date().toISOString(),
      summary,
    };

    const existing = JSON.parse(readFileSync(metadataPath));
    existing.push(fileMeta);
    writeFileSync(metadataPath, JSON.stringify(existing, null, 2));

    res
      .status(200)
      .json({ message: "Upload successful", file: req.file.filename, summary });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Failed to process PDF" });
  }
};

export const listFiles = (req, res) => {
  readFile(metadataPath, "utf8", (err, data) => {
    if (err)
      return res.status(500).json({ message: "Failed to load file metadata" });
    res.json(JSON.parse(data));
  });
};

export const downloadFile = (req, res) => {
  const { serverName } = req.params;
  const metadata = JSON.parse(readFileSync(metadataPath));
  const file = metadata.find((f) => f.serverName === serverName);
  if (!file) return res.status(404).send("File not found");
  res.download(join(uploadFolder, serverName), file.originalName);
};

export const previewFile = (req, res) => {
  const { serverName } = req.params;
  const filePath = join(uploadFolder, serverName);
  if (!existsSync(filePath)) return res.status(404).send("File not found");
  res.sendFile(filePath);
};

export const deleteFile = (req, res) => {
  const { filename } = req.params;
  const filePath = join(uploadFolder, filename);

  unlink(filePath, (err) => {
    if (err)
      return res.status(500).json({ message: "Failed to delete file" });

    let data = JSON.parse(readFileSync(metadataPath));
    data = data.filter((file) => file.serverName !== filename);
    writeFileSync(metadataPath, JSON.stringify(data, null, 2));

    res.json({ message: "File deleted successfully" });
  });
};
