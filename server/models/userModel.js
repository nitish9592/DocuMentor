import fs from "fs";
import path from "path";
import bcrypt from "bcryptjs";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const usersFile = path.join(__dirname, "../uploads/users.json");

if (!fs.existsSync(usersFile)) {
  fs.writeFileSync(usersFile, JSON.stringify([]));
}

export function getAllUsers() {
  const data = fs.readFileSync(usersFile);
  return JSON.parse(data);
}

export function saveUsers(users) {
  fs.writeFileSync(usersFile, JSON.stringify(users, null, 2));
}

export function findUserByUsername(username) {
  const users = getAllUsers();
  return users.find((user) => user.username === username);
}

export function addUser({ username, password, role = "user" }) {
  const users = getAllUsers();
  const hashedPassword = bcrypt.hashSync(password, 10);
  const newUser = { id: Date.now(), username, password: hashedPassword, role };
  users.push(newUser);
  saveUsers(users);
  return newUser;
}
