import fs from "fs";
import path from "path";
import pdfParse from "pdf-parse";
import axios from "axios";
import { fileURLToPath } from "url";
import { readFiles, writeFiles } from "../utils/jsonStorage.js";
import dotenv from "dotenv";
dotenv.config();
// Helper for ES Modules (__dirname)
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const uploadsDir = path.join(__dirname, "../uploads");

// Hugging Face Summarization API (Ensure you set this in your .env)
const HF_API_KEY = process.env.HUGGINGFACE_API_KEY;
const HF_SUMMARIZATION_URL = "https://api-inference.huggingface.co/models/facebook/bart-large-cnn";

// ✅ Upload + Summarize PDF
export async function uploadFile(req, res) {
  if (!req.file) {
    return res.status(400).json({ message: "No file uploaded" });
  }

  const filePath = path.join(uploadsDir, req.file.filename);
  const pdfBuffer = fs.readFileSync(filePath);
  const pdfData = await pdfParse(pdfBuffer);
  const text = pdfData.text.slice(0, 2000); // Limit text size for summarization

  const aiSummary = await getAISummary(text);

  const fileInfo = {
    originalName: req.file.originalname,
    serverName: req.file.filename,
    uploadedAt: new Date().toISOString(),
    summary: aiSummary,
  };

  const files = readFiles();
  files.push(fileInfo);
  writeFiles(files);

  res.json(fileInfo);
}

// ✅ Summarize Text Using Hugging Face API
async function getAISummary(text) {
  try {
    console.log("Summarizing text...");
    const response = await axios.post(
      HF_SUMMARIZATION_URL,
      {inputs: text},
      {
        headers: {
          Authorization: `Bearer ${HF_API_KEY}`,
          "Content-Type": "application/json",
        },
      }
    );

    console.log("AI Summary Response:", response.data);
    return response.data[0]?.summary_text?.trim() || "Summary not available.";
  } catch (err) {
    console.error("AI Summary Error:", err.response?.data || err.message);
    return "Failed to generate summary.";
  }
}

// ✅ Fetch All Files
export function fetchFiles(req, res) {
  const files = readFiles();
  res.json(files);
}

// ✅ Delete File
export function deleteFile(req, res) {
  const files = readFiles();
  const index = files.findIndex((f) => f.serverName === req.params.file);
  if (index === -1) return res.status(404).json({ message: "File not found" });

  const filePath = path.join(uploadsDir, req.params.file);
  if (fs.existsSync(filePath)) {
    fs.unlinkSync(filePath);
  }

  files.splice(index, 1);
  writeFiles(files);
  res.json({ message: "Deleted" });
}

// ✅ Download File
export function downloadFile(req, res) {
  const filePath = path.join(uploadsDir, req.params.file);
  if (!fs.existsSync(filePath)) return res.status(404).json({ message: "File not found" });

  res.download(filePath);
}

// ✅ Preview File
export function previewFile(req, res) {
  const filePath = path.join(uploadsDir, req.params.file);
  if (!fs.existsSync(filePath)) return res.status(404).json({ message: "File not found" });

  res.sendFile(filePath);
}
