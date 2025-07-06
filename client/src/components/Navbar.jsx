import { Link, useNavigate } from "react-router-dom";
import { LogOut, Upload } from "lucide-react";

export default function Navbar() {
  const navigate = useNavigate();
  const token = localStorage.getItem("token");

  const handleLogout = () => {
    localStorage.removeItem("token");
    navigate("/login");
  };

  if (!token) return null;

  return (
    <nav className="bg-white shadow-md p-4 flex justify-between items-center">
      <h1 className="text-xl font-bold text-blue-600">DocuMentor</h1>
      <div className="flex space-x-4 items-center">
        <Link to="/upload" className="flex items-center text-blue-500 hover:underline">
          <Upload className="w-5 h-5 mr-1" />
          Uploads
        </Link>
        <button
          onClick={handleLogout}
          className="flex items-center text-red-500 hover:underline"
        >
          <LogOut className="w-5 h-5 mr-1" />
          Logout
        </button>
      </div>
    </nav>
  );
}
