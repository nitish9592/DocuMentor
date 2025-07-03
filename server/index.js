// server/index.js
const express = require("express");
const multer = require("multer");
const cors = require("cors");
const fs = require("fs");
const path = require("path");
const pdfParse = require("pdf-parse");


const app = express();
const PORT = 5000;

app.use(cors());

app.use(express.json());

const uploadFolder = path.join(__dirname, "uploads");
const metadataPath = path.join(__dirname, "uploads", "fileData.json");

// Initialize metadata file if not exists
if (!fs.existsSync(metadataPath)) {
  fs.writeFileSync(metadataPath, JSON.stringify([]));
}
//route for storing
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, uploadFolder);
  },
  filename: function (req, file, cb) {
    const uniqueName = `${Date.now()}_${file.originalname}`;
    cb(null, uniqueName);
  },
});

const upload = multer({ storage: storage });
//route for uploading
app.post("/upload", upload.single("pdf"), async (req, res) => {
  if (!req.file) {
    return res.status(400).json({ message: "No file uploaded" });
  }

  const filePath = path.join(uploadFolder, req.file.filename);

  try {
    console.log("Reading PDF buffer...");
    const buffer = fs.readFileSync(filePath);

    console.log("Parsing PDF...");
    const data = await pdfParse(buffer);
    console.log("Extracted text length:", data.text.length);

    const fullText = data.text;
    
    const sentences = fullText
    .replace(/\n/g, " ")                // replace line breaks
    .match(/[^.!?]+[.!?]+/g);           // split by sentence endings

    const summary = sentences ? sentences.slice(0, 3).join(" ").trim() : "No summary available.";

    

    const fileMeta = {
      originalName: req.file.originalname,
      serverName: req.file.filename,
      path: req.file.path,
      uploadedAt: new Date().toISOString(),
      summary: summary.trim()
    };

    console.log("Saving metadata with summary:", summary);

    const existing = JSON.parse(fs.readFileSync(metadataPath));
    existing.push(fileMeta);
    fs.writeFileSync(metadataPath, JSON.stringify(existing, null, 2));

    res.status(200).json({ 
      message: "Upload successful", 
      file: req.file.filename,
      summary: summary.trim()
    });
  } 
  catch (err) {
    console.error("Error parsing PDF:", err);
    res.status(500).json({ message: "Failed to process PDF" });
  }

});


// Endpoint to get list of files with original names
//route for storing orignal names in fileData.json
app.get("/files", (req, res) => {
  fs.readFile(metadataPath, 'utf8', (err, data) => {
    if (err) {
      console.error("Error reading file metadata:", err);
      return res.status(500).json({ message: "Failed to load file metadata" });
    }
    try {
      const files = JSON.parse(data);
      res.json(files); // send list of files to frontend
    } 
    catch (e) {
      res.status(500).json({ message: "Invalid JSON format in metadata file" });
    }
  });
});
//route for downloading
app.get("/download/:serverName", (req, res) => {
  const serverName = req.params.serverName;

  // Read metadata to get original name
  const metadata = JSON.parse(fs.readFileSync(metadataPath));
  const file = metadata.find(f => f.serverName === serverName);

  if (!file) return res.status(404).send("File not found");

  const filePath = path.join(uploadFolder, serverName);

  // Force download with original name
  res.download(filePath, file.originalName);
});

// Delete file and its metadata
app.delete("/upload/:filename", (req, res) => {
  const filename = req.params.filename;
  const fullPath = path.join(uploadFolder, filename);

  fs.unlink(fullPath, (err) => {
    if (err) {
      return res.status(500).json({ message: "Failed to delete file" });
    }

    let data = JSON.parse(fs.readFileSync(metadataPath));
    data = data.filter((file) => file.serverName !== filename);
    fs.writeFileSync(metadataPath, JSON.stringify(data, null, 2));

    res.json({ message: "File deleted successfully" });
  });
});



app.listen(PORT, () => {
  console.log(`Server started on http://localhost:${PORT}`);
});
