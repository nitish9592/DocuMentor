const fs = require("fs");
const path = require("path");
const pdfParse = require("pdf-parse");
const multer = require("multer");

const uploadFolder = path.join(__dirname, "../uploads");
const metadataPath = path.join(uploadFolder, "fileData.json");

// Ensure metadata file exists
if (!fs.existsSync(metadataPath)) {
  fs.writeFileSync(metadataPath, JSON.stringify([]));
}

// Multer Setup
const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, uploadFolder),
  filename: (req, file, cb) => cb(null, `${Date.now()}_${file.originalname}`),
});
const upload = multer({ storage });

module.exports = {
  upload,

  uploadFile: async (req, res) => {
    if (!req.file) {
      return res.status(400).json({ message: "No file uploaded" });
    }

    const filePath = path.join(uploadFolder, req.file.filename);
    try {
      const buffer = fs.readFileSync(filePath);
      const data = await pdfParse(buffer);

      const sentences = data.text.replace(/\n/g, " ").match(/[^.!?]+[.!?]+/g);
      const summary = sentences ? sentences.slice(0, 3).join(" ").trim() : "No summary available.";

      const fileMeta = {
        originalName: req.file.originalname,
        serverName: req.file.filename,
        path: req.file.path,
        uploadedAt: new Date().toISOString(),
        summary
      };

      const existing = JSON.parse(fs.readFileSync(metadataPath));
      existing.push(fileMeta);
      fs.writeFileSync(metadataPath, JSON.stringify(existing, null, 2));

      res.status(200).json({ message: "Upload successful", file: req.file.filename, summary });
    } catch (err) {
      console.error(err);
      res.status(500).json({ message: "Failed to process PDF" });
    }
  },

  listFiles: (req, res) => {
    fs.readFile(metadataPath, 'utf8', (err, data) => {
      if (err) return res.status(500).json({ message: "Failed to load file metadata" });
      res.json(JSON.parse(data));
    });
  },

  downloadFile: (req, res) => {
    const { serverName } = req.params;
    const metadata = JSON.parse(fs.readFileSync(metadataPath));
    const file = metadata.find(f => f.serverName === serverName);
    if (!file) return res.status(404).send("File not found");
    res.download(path.join(uploadFolder, serverName), file.originalName);
  },

  previewFile: (req, res) => {
    const { serverName } = req.params;
    const filePath = path.join(uploadFolder, serverName);
    if (!fs.existsSync(filePath)) return res.status(404).send("File not found");
    res.sendFile(filePath);
  },

  deleteFile: (req, res) => {
    const { filename } = req.params;
    const filePath = path.join(uploadFolder, filename);

    fs.unlink(filePath, (err) => {
      if (err) return res.status(500).json({ message: "Failed to delete file" });

      let data = JSON.parse(fs.readFileSync(metadataPath));
      data = data.filter(file => file.serverName !== filename);
      fs.writeFileSync(metadataPath, JSON.stringify(data, null, 2));

      res.json({ message: "File deleted successfully" });
    });
  }
};
