import axios from "axios";

const BASE_URL = "http://localhost:5000/api/files";

function getAuthHeader() {
  const token = localStorage.getItem("token");
  return token ? { Authorization: `Bearer ${token}` } : {};
}

export async function fetchFiles() {
  const res = await axios.get(BASE_URL, { headers: getAuthHeader() });
  return res.data;
}

export async function uploadFile(formData) {
  const res = await axios.post(`${BASE_URL}/upload`, formData, {
    headers: {
      ...getAuthHeader(),
      "Content-Type": "multipart/form-data",
    },
  });
  return res.data;
}

export async function deleteFile(serverName) {
  await axios.delete(`${BASE_URL}/${serverName}`, {
    headers: getAuthHeader(),
  });
}

export async function getDownloadLink(serverName) {
  const res = await axios.get(`${BASE_URL}/download/${serverName}`, {
    headers: getAuthHeader(),
    responseType: "blob",
  });
  return res.data;
}

export async function getPreviewLink(serverName) {
  const res = await axios.get(`${BASE_URL}/preview/${serverName}`, {
    headers: getAuthHeader(),
    responseType: "blob",
  });
  return res.data;
}
