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

// ✅ Summarize Text (Chunked) - Optimized for better performance
function splitText(text, chunkSize = 300) {
  
  const chunks = [];
  let start = 0;
  while (start < text.length) {
    chunks.push(text.slice(start, start + chunkSize));
    start += chunkSize;
  }
  return chunks;
}

// ✅ Retry function with exponential backoff
async function retryWithBackoff(fn, maxRetries = 3, baseDelay = 1000) {
  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      return await fn();
    } catch (error) {
      console.log(`Attempt ${attempt} failed:`, error.message);
      
      if (attempt === maxRetries) {
        throw error;
      }
      
      // Exponential backoff: 1s, 2s, 4s
      const delay = baseDelay * Math.pow(2, attempt - 1);
      console.log(`Retrying in ${delay}ms...`);
      await new Promise(resolve => setTimeout(resolve, delay));
    }
  }
}

// ✅ Improved AI Summary with retry logic and better error handling
async function getAISummary(text) {
  try {
    // Check if API key is available
    if (!HF_API_KEY) {
      console.error("HUGGINGFACE_API_KEY not found in environment variables");
      return "AI summary unavailable - API key not configured.";
    }

    // Limit text length to avoid timeouts
    const limitedText = text.slice(0, 1000); // Reduced from 2000 to 1000
    const chunks = splitText(limitedText, 300); // Reduced chunk size from 500 to 300
    const summaries = [];

    console.log(`Processing ${chunks.length} chunks for AI summary...`);

    for (let i = 0; i < chunks.length; i++) {
      const chunk = chunks[i];
      console.log(`Processing chunk ${i + 1}/${chunks.length}...`);

      try {
        const response = await retryWithBackoff(async () => {
          return await axios.post(
            HF_SUMMARIZATION_URL,
            { inputs: chunk },
            {
              headers: {
                Authorization: `Bearer ${HF_API_KEY}`,
                "Content-Type": "application/json",
              },
              timeout: 30000, // 30 second timeout
            }
          );
        }, 3, 2000); // 3 retries with 2s base delay

        const summary = response.data[0]?.summary_text?.trim();
        if (summary) {
          summaries.push(summary);
          console.log(`Chunk ${i + 1} summarized successfully`);
        }
      } catch (chunkError) {
        console.error(`Failed to summarize chunk ${i + 1}:`, chunkError.message);
        // Continue with other chunks even if one fails
        continue;
      }

      // Add small delay between requests to avoid rate limiting
      if (i < chunks.length - 1) {
        await new Promise(resolve => setTimeout(resolve, 500));
      }
    }

    if (summaries.length === 0) {
      return "AI summary unavailable - service temporarily unavailable.";
    }

    const finalSummary = summaries.join(" ");
    console.log("AI summary generated successfully");
    return finalSummary;
  } catch (err) {
    console.error("AI Summary Error:", err.response?.data || err.message);
    
    // Provide more specific error messages
    if (err.code === 'ECONNABORTED' || err.message.includes('timeout')) {
      return "AI summary unavailable - request timeout. Please try again later.";
    } else if (err.response?.status === 503) {
      return "AI summary unavailable - model is loading. Please try again in a few moments.";
    } else if (err.response?.status === 429) {
      return "AI summary unavailable - rate limit exceeded. Please try again later.";
    } else {
      return "AI summary unavailable - service temporarily unavailable.";
    }
  }
}

// ✅ Generate basic summary as fallback
function generateBasicSummary(text) {
  const sentences = text.split(/[.!?]+/).filter(s => s.trim().length > 10);
  const firstFewSentences = sentences.slice(0, 3).join('. ').trim();
  return firstFewSentences ? `${firstFewSentences}...` : "Document uploaded successfully.";
}

// ✅ Upload + Summarize + Save to DB
export async function uploadFile(req, res) {
  if (!req.file) {
    return res.status(400).json({ message: "No file uploaded" });
  }

  try {
    const filePath = path.join(uploadsDir, req.user.username, req.file.filename);
    const pdfBuffer = fs.readFileSync(filePath);
    const pdfData = await pdfParse(pdfBuffer);
    const text = pdfData.text.slice(0, 2000);

    console.log("Starting AI summary generation...");
    const aiSummary = await getAISummary(text);
    
    // If AI summary failed, use basic summary
    let finalSummary = aiSummary;
    if (aiSummary.includes("unavailable") || aiSummary.includes("Failed")) {
      console.log("AI summary failed, using basic summary as fallback");
      finalSummary = generateBasicSummary(text);
    }

    const username = req.user.username;

    const file = await File.create({
      username,
      originalName: req.file.originalname,
      serverName: req.file.filename,
      summary: finalSummary,
    });

    console.log("File uploaded and processed successfully");
    res.json(file);
  } catch (error) {
    console.error("Upload error:", error);
    res.status(500).json({ message: "Error processing file" });
  }
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
