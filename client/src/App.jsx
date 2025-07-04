import FileUploader from "./components/FileUploader/FileUploader";
import { ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import "./styles/index.css";
 // or './App.css'




function App() {
  return (
    <div className="min-h-screen bg-gray-100 flex items-center justify-center">
      <FileUploader />
      <ToastContainer position="top-right" autoClose={2000} />
     

    </div>
    
  );
}

export default App;
