import axios from "axios";
import { logout } from "../utils/auth";  // ✅ Import logout

const BASE_URL = import.meta.env.VITE_API_URL + "/files";

// ✅ Auth Header Helper
function getAuthHeader() {
  const token = localStorage.getItem("token");
  return token ? { Authorization: `Bearer ${token}` } : {};
}

// ✅ Global Response Handler (Auto Logout on 401)
async function handleResponse(promise) {
  try {
    const res = await promise;
    return res.data;
  } catch (err) {
    if (err.response && err.response.status === 401) {
      logout();  // Auto-logout on token expiry
    }
    throw new Error(err.response?.data?.message || "Request failed");
  }
}

// ✅ Fetch Files
export async function fetchFiles() {
  return handleResponse(
    axios.get(BASE_URL, { headers: getAuthHeader() })
  );
}

// ✅ Upload File
export async function uploadFile(formData) {
  return handleResponse(
    axios.post(`${BASE_URL}/upload`, formData, {
      headers: {
        ...getAuthHeader(),
        "Content-Type": "multipart/form-data",
      },
    })
  );
}

// ✅ Delete File
export async function deleteFile(serverName) {
  return handleResponse(
    axios.delete(`${BASE_URL}/${serverName}`, {
      headers: getAuthHeader(),
    })
  );
}

// ✅ Download File
export async function getDownloadLink(serverName) {
  return handleResponse(
    axios.get(`${BASE_URL}/download/${serverName}`, {
      headers: getAuthHeader(),
      responseType: "blob",
    })
  );
}

// ✅ Preview File
export async function getPreviewLink(serverName) {
  return handleResponse(
    axios.get(`${BASE_URL}/preview/${serverName}`, {
      headers: getAuthHeader(),
      responseType: "blob",
    })
  );
}
