import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import { readUsers, writeUsers } from "../utils/jsonStorage.js";

// Register a new user
export async function register(req, res) {
  const { username, password } = req.body;

  const users = readUsers();
  const userExists = users.find(u => u.username === username);
  if (userExists) {
    return res.status(400).json({ message: "User already exists" });
  }

  const hashedPassword = await bcrypt.hash(password, 10);
  const newUser = { username, passwordHash: hashedPassword };

  users.push(newUser);
  writeUsers(users);

  const token = jwt.sign({ username }, process.env.JWT_SECRET, { expiresIn: "7d" });
  res.json({ token });
}

// Login user
export async function login(req, res) {
  const { username, password } = req.body;

  const users = readUsers();
  const user = users.find(u => u.username === username);
  if (!user) {
    return res.status(400).json({ message: "Invalid credentials" });
  }

  const isMatch = await bcrypt.compare(password, user.passwordHash);
  if (!isMatch) {
    return res.status(400).json({ message: "Invalid credentials" });
  }

  const token = jwt.sign({ username }, process.env.JWT_SECRET, { expiresIn: "7d" });
  res.json({ token });
}
