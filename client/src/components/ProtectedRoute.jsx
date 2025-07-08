// src/components/ProtectedRoute.jsx
import { Navigate } from "react-router-dom";
import { isLoggedIn } from "../utils/auth";  // Reuse your global auth helper

export default function ProtectedRoute({ children }) {
  return isLoggedIn() ? children : <Navigate to="/login" replace />;
}
