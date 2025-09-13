import axios from "axios";
import { logout } from "../utils/auth";  

const BASE_URL = import.meta.env.VITE_API_URL + "/api/files";

//  Helper
function getAuthHeader() {
  const token = localStorage.getItem("token");
  return token ? { Authorization: `Bearer ${token}` } : {};
}

//(Auto Logout on 401)
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


export async function fetchFiles() {
  return handleResponse(
    axios.get(BASE_URL, { headers: getAuthHeader() })
  );
}


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


export async function deleteFile(serverName) {
  return handleResponse(
    axios.delete(`${BASE_URL}/${serverName}`, {
      headers: getAuthHeader(),
    })
  );
}


export async function getDownloadLink(serverName) {
  return handleResponse(
    axios.get(`${BASE_URL}/download/${serverName}`, {
      headers: getAuthHeader(),
      responseType: "blob",
    })
  );
}

// Preview 
export async function getPreviewLink(serverName) {
  return handleResponse(
    axios.get(`${BASE_URL}/preview/${serverName}`, {
      headers: getAuthHeader(),
      responseType: "blob",
    })
  );
}
