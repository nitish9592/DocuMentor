const express = require("express");
const router = express.Router();
const fileController = require("../controllers/fileController");

// Upload route with multer middleware
router.post("/upload", fileController.upload.single("pdf"), fileController.uploadFile);

// Other routes
router.get("/", fileController.listFiles);
router.get("/download/:serverName", fileController.downloadFile);
router.get("/preview/:serverName", fileController.previewFile);
router.delete("/upload/:filename", fileController.deleteFile);

module.exports = router;
