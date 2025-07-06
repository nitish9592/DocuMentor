import { Outlet, useNavigate } from "react-router-dom";
import Navbar from "./components/Navbar.jsx";
import { ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";

export default function App() {
  return (
    <div className="min-h-screen bg-gray-100">
      <Navbar />
      <Outlet />
      <ToastContainer />
    </div>
  );
}
