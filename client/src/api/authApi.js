import axios from "axios";

const BASE_URL = import.meta.env.VITE_API_URL + "/auth";

export async function loginUser(username, password) {
  const res = await axios.post(`${BASE_URL}/login`, { username, password });
  return res.data.token;
}

export async function registerUser(username, password) {
  const res = await axios.post(`${BASE_URL}/register`, { username, password });
  return res.data.token;
}
