import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

// Helper to get __dirname in ES Modules
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Paths for your JSON files
const uploadsDir = path.join(__dirname, "../uploads");
const usersFile = path.join(uploadsDir, "users.json");
const filesFile = path.join(uploadsDir, "files.json");

// Ensure uploads directory exists
if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir, { recursive: true });
}

// Ensure JSON files exist
if (!fs.existsSync(usersFile)) {
  fs.writeFileSync(usersFile, "[]");
}
if (!fs.existsSync(filesFile)) {
  fs.writeFileSync(filesFile, "[]");
}

// Utility functions:
export function readUsers() {
  const data = fs.readFileSync(usersFile, "utf-8");
  return JSON.parse(data);
}

export function writeUsers(users) {
  fs.writeFileSync(usersFile, JSON.stringify(users, null, 2));
}

export function readFiles() {
  const data = fs.readFileSync(filesFile, "utf-8");
  return JSON.parse(data);
}

export function writeFiles(files) {
  fs.writeFileSync(filesFile, JSON.stringify(files, null, 2));
}
