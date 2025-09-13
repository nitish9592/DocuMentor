import { existsSync, writeFileSync, readFileSync, unlink, readFileSync as fsReadFile } from "fs";
import { join, dirname, resolve } from "path";
import { fileURLToPath } from "url";
import multer, { diskStorage } from "multer";
import fetch from "node-fetch"; // for Hugging Face API


const __dirname = dirname(fileURLToPath(import.meta.url));

const uploadFolder = join(__dirname, "../uploads");
const metadataPath = join(uploadFolder, "fileData.json");


if (!existsSync(uploadFolder)) fs.mkdirSync(uploadFolder, { recursive: true });
if (!existsSync(metadataPath)) writeFileSync(metadataPath, JSON.stringify([]));

// Multer Setup
const storage = diskStorage({
  destination: (req, file, cb) => cb(null, uploadFolder),
  filename: (req, file, cb) => cb(null, `${Date.now()}_${file.originalname}`),
});
export const upload = multer({ storage });

//  text extraction
async function summarizePdf(buffer) {
  const { default: pdfParse } = await import("pdf-parse");
  return pdfParse(buffer);
}

// Helper to split text for Hugging Face
function chunkText(text, maxChars = 1000) {
  return text.match(new RegExp(`.{1,${maxChars}}`, "g")) || [];
}


async function getAISummary(text) {
  const API_URL = "https://api-inference.huggingface.co/models/facebook/bart-large-cnn";
  const API_TOKEN = process.env.HF_API_KEY;

  const chunks = chunkText(text, 1000);
  const summaries = [];

  for (const chunk of chunks) {
    const response = await fetch(API_URL, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${API_TOKEN}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        inputs: chunk, // Send raw text only
        parameters: {
          max_length: 120, // max length for each chunk 
          min_length: 60,
          do_sample: false,
        },
      }),
    });

    if (!response.ok) {
      throw new Error(`HF API error: ${response.status}`);
    }

    const data = await response.json();
    summaries.push(data[0]?.summary_text || chunk.slice(0, 150));
  }

  // Merge summaries and limit total length
  let finalSummary = summaries.join(" ");
  if (finalSummary.length > 400) finalSummary = finalSummary.slice(0, 400) + "...";

  return finalSummary;
}

// Upload file with ai Summary
export const uploadFile = async (req, res) => {
  if (!req.file) return res.status(400).json({ message: "No file uploaded" });

  const filePath = req.file.path;

  try {
    const buffer = fsReadFile(filePath);
    const pdfData = await summarizePdf(buffer);
    const text = pdfData.text.replace(/\n/g, " ").trim();

    let summary;
    try {
      summary = await getAISummary(text);
    } catch (err) {
      console.error("HF summarization failed, falling back:", err);
      const sentences = text.match(/[^.!?]+[.!?]+/g);
      summary = sentences ? sentences.slice(0, 3).join(" ").trim() : text.slice(0, 150) + "...";
    }

    const fileMeta = {
      originalName: req.file.originalname,
      serverName: req.file.filename,
      path: resolve(filePath),
      uploadedAt: new Date().toISOString(),
      summary,
    };

    const existing = JSON.parse(readFileSync(metadataPath));
    existing.push(fileMeta);
    writeFileSync(metadataPath, JSON.stringify(existing, null, 2));

    res.status(200).json(fileMeta);
  } catch (err) {
    console.error("Upload/Summarization error:", err);
    res.status(500).json({ message: "Failed to process PDF or generate summary" });
  }
};


export const listFiles = (req, res) => {
  try {
    const data = JSON.parse(readFileSync(metadataPath));
    const files = data.map(f => ({
      originalName: f.originalName || "Unknown",
      serverName: f.serverName || "",
      uploadedAt: f.uploadedAt || new Date().toISOString(),
      summary: f.summary || "No summary available",
      path: f.path || "",
    }));
    res.json(files);
  } catch (err) {
    console.error("List files error:", err);
    res.status(500).json({ message: "Failed to load files" });
  }
};


export const downloadFile = (req, res) => {
  const { file } = req.params;
  try {
    const metadata = JSON.parse(readFileSync(metadataPath));
    const target = metadata.find(f => f.serverName === file);
    if (!target || !existsSync(target.path)) return res.status(404).send("File not found");
    res.download(target.path, target.originalName);
  } catch (err) {
    console.error("Download error:", err);
    res.status(500).send("Download failed");
  }
};


export const previewFile = (req, res) => {
  const { file } = req.params;
  try {
    const metadata = JSON.parse(readFileSync(metadataPath));
    const target = metadata.find(f => f.serverName === file);
    if (!target || !existsSync(target.path)) return res.status(404).send("File not found");
    res.sendFile(target.path);
  } catch (err) {
    console.error("Preview error:", err);
    res.status(500).send("Preview failed");
  }
};


export const deleteFile = (req, res) => {
  const { file } = req.params;
  try {
    const metadata = JSON.parse(readFileSync(metadataPath));
    const target = metadata.find(f => f.serverName === file);
    if (!target || !existsSync(target.path)) return res.status(404).json({ message: "File not found" });

    unlink(target.path, err => {
      if (err) return res.status(500).json({ message: "Failed to delete file" });

      const updated = metadata.filter(f => f.serverName !== file);
      writeFileSync(metadataPath, JSON.stringify(updated, null, 2));

      res.json({ message: "File deleted successfully" });
    });
  } catch (err) {
    console.error("Delete error:", err);
    res.status(500).json({ message: "Failed to delete file" });
  }
};
