import { useState } from "react";
import { loginUser, registerUser } from "../api/authApi.js";
import { toast } from "react-toastify";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { LogIn, UserPlus } from "lucide-react";

export default function Login() {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const navigate = useNavigate();

  const handleLogin = async (e) => {
    e.preventDefault();
    try {
      const token = await loginUser(username, password);
      localStorage.setItem("token", token);
      toast.success("Logged in successfully!");
      navigate("/upload");
    } catch (err) {
      toast.error(err.response?.data?.message || "Login failed");
    }
  };

  const handleRegister = async () => {
    try {
      const token = await registerUser(username, password);
      localStorage.setItem("token", token);
      toast.success("Registered successfully!");
      navigate("/upload");
    } catch (err) {
      toast.error(err.response?.data?.message || "Registration failed");
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 30 }}
      animate={{ opacity: 1, y: 0 }}
      className="flex flex-col items-center justify-center min-h-screen p-4"
    >
      <div className="bg-white p-8 rounded-lg shadow-md w-full max-w-sm space-y-4">
        <h2 className="text-2xl font-bold text-center text-blue-600">
          Welcome to DocuMentor
        </h2>
        <form onSubmit={handleLogin} className="space-y-4">
          <input
            type="text"
            placeholder="Username"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            className="border border-gray-300 rounded px-3 py-2 w-full"
            required
          />
          <input
            type="password"
            placeholder="Password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="border border-gray-300 rounded px-3 py-2 w-full"
            required
          />
          <button
            type="submit"
            className="w-full flex justify-center items-center gap-2 bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600"
          >
            <LogIn className="w-4 h-4" /> Login
          </button>
        </form>
        <button
          onClick={handleRegister}
          className="w-full flex justify-center items-center gap-2 bg-green-500 text-white px-4 py-2 rounded hover:bg-green-600"
        >
          <UserPlus className="w-4 h-4" /> Register
        </button>
      </div>
    </motion.div>
  );
}
