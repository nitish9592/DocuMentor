import fs from "fs";
import path from "path";
import pdfParse from "pdf-parse";
import OpenAI from "openai";
import { fileURLToPath } from "url";
import { readFiles, writeFiles } from "../utils/jsonStorage.js";

// Helper to get __dirname in ES modules
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const uploadsDir = path.join(__dirname, "../uploads");
const openai = new OpenAI({ apiKey: "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" });

// ✅ Upload + Summarize PDF
export async function uploadFile(req, res) {
  if (!req.file) {
    return res.status(400).json({ message: "No file uploaded" });
  }

  const filePath = path.join(uploadsDir, req.file.filename);
  const pdfBuffer = fs.readFileSync(filePath);
  const pdfData = await pdfParse(pdfBuffer);
  const text = pdfData.text.slice(0, 2000);  // Limit text size for AI

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

// ✅ Generate AI Summary
async function getAISummary(text) {
  try {
    const response = await openai.chat.completions.create({
      model: "gpt-3.5-turbo",
      messages: [
        { role: "system", content: "You are a helpful assistant that summarizes PDF content." },
        { role: "user", content: `Summarize this text:\n\n${text}` },
      ],
    });
    return response.choices[0].message.content.trim();
  } catch (err) {
    console.error("AI Summary Error:", err);
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
