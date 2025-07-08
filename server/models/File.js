import mongoose from "mongoose";

const fileSchema = new mongoose.Schema({
  username: { type: String, required: true }, // Username from JWT (simple for now)
  originalName: { type: String, required: true },
  serverName: { type: String, required: true },
  summary: { type: String, default: "No summary available" },
  uploadedAt: { type: Date, default: Date.now },
});

const File = mongoose.model("File", fileSchema);
export default File;
