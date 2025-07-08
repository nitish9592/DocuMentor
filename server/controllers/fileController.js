import fs from "fs";
import path from "path";
import pdfParse from "pdf-parse";
import axios from "axios";
import { fileURLToPath } from "url";
import dotenv from "dotenv";
import File from "../models/File.js";  // ✅ File model

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const uploadsDir = path.join(__dirname, "../uploads");

const HF_API_KEY = process.env.HUGGINGFACE_API_KEY;
const HF_SUMMARIZATION_URL = "https://api-inference.huggingface.co/models/google/pegasus-xsum";

// ✅ Summarize Text (Chunked)
function splitText(text, chunkSize = 500) {
  const chunks = [];
  let start = 0;
  while (start < text.length) {
    chunks.push(text.slice(start, start + chunkSize));
    start += chunkSize;
  }
  return chunks;
}


async function getAISummary(text) {
  try {
    const chunks = splitText(text, 500);
    const summaries = [];

    for (const chunk of chunks) {
      const response = await axios.post(
        HF_SUMMARIZATION_URL,
        { inputs: chunk },
        {
          headers: {
            Authorization: `Bearer ${HF_API_KEY}`,
            "Content-Type": "application/json",
          },
        }
      );
      const summary = response.data[0]?.summary_text?.trim();
      if (summary) summaries.push(summary);
    }

    const finalSummary = summaries.join(" ");
    return finalSummary || "Summary not available.";
  } catch (err) {
    console.error("AI Summary Error:", err.response?.data || err.message);
    return "Failed to generate summary.";
  }
}

// ✅ Upload + Summarize + Save to DB
export async function uploadFile(req, res) {
  if (!req.file) {
    return res.status(400).json({ message: "No file uploaded" });
  }

  const filePath = path.join(uploadsDir, req.user.username, req.file.filename);
  const pdfBuffer = fs.readFileSync(filePath);
  const pdfData = await pdfParse(pdfBuffer);
  const text = pdfData.text.slice(0, 2000);

  const aiSummary = await getAISummary(text);
  const username = req.user.username;

  const file = await File.create({
    username,
    originalName: req.file.originalname,
    serverName: req.file.filename,
    summary: aiSummary,
  });

  res.json(file);
}

// ✅ Fetch Files (Per-user)
export async function fetchFiles(req, res) {
  const username = req.user.username;
  const files = await File.find({ username }).sort({ uploadedAt: -1 });
  res.json(files);
}

// ✅ Delete File (Per-user)
export async function deleteFile(req, res) {
  const username = req.user.username;
  const file = await File.findOne({ serverName: req.params.file, username });

  if (!file) {
    return res.status(404).json({ message: "File not found or unauthorized" });
  }

  const filePath = path.join(uploadsDir, username, req.params.file);
  if (fs.existsSync(filePath)) {
    fs.unlinkSync(filePath);
  }

  await File.deleteOne({ _id: file._id });
  res.json({ message: "Deleted" });
}

// ✅ Download File (Per-user)
export async function downloadFile(req, res) {
  const username = req.user.username;
  const file = await File.findOne({ serverName: req.params.file, username });

  if (!file) {
    return res.status(404).json({ message: "File not found or unauthorized" });
  }

  const filePath = path.join(uploadsDir, username, req.params.file);
  if (!fs.existsSync(filePath)) {
    return res.status(404).json({ message: "File missing from server" });
  }

  res.download(filePath);
}

// ✅ Preview File (Per-user)
export async function previewFile(req, res) {
  const username = req.user.username;
  const file = await File.findOne({ serverName: req.params.file, username });

  if (!file) {
    return res.status(404).json({ message: "File not found or unauthorized" });
  }

  const filePath = path.join(uploadsDir, username, req.params.file);
  if (!fs.existsSync(filePath)) {
    return res.status(404).json({ message: "File missing from server" });
  }

  res.sendFile(filePath);
}
