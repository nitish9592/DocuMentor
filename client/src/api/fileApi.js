// src/api/fileApi.js
const BASE_URL = "http://localhost:5000/api/files";

// Fetch all uploaded files
export async function fetchFiles() {
  const res = await fetch(`${BASE_URL}/`);
  if (!res.ok) throw new Error("Failed to fetch files");
  return res.json();
}

// Upload a new file
export async function uploadFile(formData) {
  const res = await fetch(`${BASE_URL}/upload`, {
    method: "POST",
    body: formData,
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.message || "Failed to upload file");
  return data;
}

// Delete a file by server name
export async function deleteFile(serverName) {
  const res = await fetch(`${BASE_URL}/upload/${encodeURIComponent(serverName)}`, {
    method: "DELETE",
  });
  if (!res.ok) throw new Error("Failed to delete file");
  return true;
}

// Get Download Link
export function getDownloadLink(serverName) {
  return `${BASE_URL}/download/${serverName}`;
}

// Get Preview Link
export function getPreviewLink(serverName) {
  return `${BASE_URL}/preview/${serverName}`;
}
