import React, { useEffect, useState } from "react";
import { toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';

function FileUploader() {
  const [files, setFiles] = useState([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [expanded, setExpanded] = useState({});
  const [previewFile, setPreviewFile] = useState(null);




  useEffect(() => {
    const fetchFiles = async () => {
      try {
        const res = await fetch("http://localhost:5000/files");
        const data = await res.json();
        setFiles(data); // ⬅ populate files with stored metadata from backend
      } 
      catch (err) {
        console.error("Error fetching files:", err);
      }
    };
    fetchFiles();
  }, []);

  const handleFileChange = async (e) => {
    const selected = e.target.files[0];
    
    if (!selected || selected.type !== "application/pdf") {
      toast.error("Please upload a valid PDF file.");
      return;
    }
    
    const formData = new FormData();
    formData.append("pdf", selected);
    
    try {
      const res = await fetch("http://localhost:5000/upload", {
        method: "POST",
        body: formData,
      });
      const isJson = res.headers.get("content-type")?.includes("application/json");
      const data = isJson ? await res.json() : null;
      if (res.ok && data) {
        setFiles((prev) => [
          ...prev, {
            originalName: selected.name,
            serverName: data.file,
            uploadedAt: new Date().toISOString(),
            summary: data.summary || "No summary available"
          }
        ]);
        
        console.log("Upload success:", data);
        toast.success("File uploaded successfully!");
      } else {
        console.error("Upload failed:", data);
        toast.error("Upload failed: " + (data?.message || "Unknown error"));
      }
    } catch (err) {
      console.error("Upload error:", err);
      toast.error("Upload failed: " + err.message);
    }
  };

  const removeFile = async (serverName) => {
    try {
      const res = await fetch(`http://localhost:5000/upload/${encodeURIComponent(serverName)}`, {
        method: "DELETE",
      });
      if (res.ok) {
        setFiles((prev) => prev.filter((file) => file.serverName !== serverName));
        toast.success("File deleted successfully");
      } else {
        const msg = await res.text();
        toast.error("Failed to delete file: " + msg);
      }
    } 
    catch (err) {
      toast.error("Error deleting file: " + err.message);
    }
  };

  const toggleSummary = (index) => {
  setExpanded(prev => ({ ...prev, [index]: !prev[index] }));
  };



  return (
      <div className="max-w-md mx-auto mt-10 p-6 border-2 border-dashed border-blue-400 rounded-lg text-center bg-white shadow-md">
        <label className="cursor-pointer">
          <input
            type="file"
            accept="application/pdf"
            className="hidden"
            onChange={handleFileChange}
          />
          <div className="py-10">
            <p className="text-lg font-semibold text-gray-700">
              📄 Drag and drop your PDF here <br /> or click to select
            </p>
          </div>
        </label>

        {files.length > 0 && (
          <div className="mt-4 space-y-2 text-left">
            <input
              type="text"
              placeholder="Search by original filename..."
              className="border px-3 py-1 rounded w-full mb-4"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />

            {files
              .filter(file =>
                file.originalName.toLowerCase().includes(searchQuery.toLowerCase())
              )
              .sort((a, b) => new Date(b.uploadedAt) - new Date(a.uploadedAt)) // sort by latest
              .map((file, index) => (
                <div
                  key={index}
                  className="flex flex-col bg-gray-100 px-3 py-2 rounded mb-2"
                >
                  
                  <div className="flex gap-4 mt-1">
                    <span className="text-sm text-gray-800 font-medium">
                      <h3><strong>{file.originalName}</strong></h3>
                    </span>
                    <span className="text-xs text-gray-500">
                      Uploaded: {new Date(file.uploadedAt).toLocaleString()}
                    </span>
                    <button
                      onClick={() => removeFile(file.serverName)}
                      className="text-red-500 hover:underline text-sm"
                    >
                      Remove
                    </button>
                  

                    <a
                      href={`http://localhost:5000/download/${file.serverName}`}
                      className="text-blue-500 hover:underline text-sm"
                    >
                      ⬇️ Download
                    </a>
                    <a
                        href="#"
                        onClick={(e) => {
                          e.preventDefault();
                          setPreviewFile(file.serverName);
                        }}
                        className="text-purple-600 hover:underline text-xs ml-3"
                      >
                        👁️ Preview
                      </a>
                  </div>

                  {file.summary && (
                    <div className="text-sm text-gray-700 mt-1">
                      <strong>Summary:</strong>{" "}
                      {expanded[index]
                        ? file.summary
                        : file.summary.length > 150
                          ? file.summary.slice(0, 150) + "..."
                          : file.summary}

                      {file.summary.length > 150 && (
                        <button
                          onClick={() => toggleSummary(index)}
                          className="ml-2 text-blue-600 text-xs underline"
                        >
                          {expanded[index] ? "Show Less" : "Show More"}
                        </button>
                      )}
                    </div>
                  )}

                </div>
              ))}
          </div>
        )}
        {previewFile && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white p-4 rounded-lg shadow-lg max-w-3xl w-full relative">
              <button
              
                onClick={() => setPreviewFile(null)}
                className="absolute top-2 right-3 text-red-600 font-bold text-lg"
              >
              &times;
              </button>
              <iframe
                src={`http://localhost:5000/preview/${previewFile}`}
                title="PDF Preview"
                className="w-full h-[500px] border"
              />
            </div>
          </div>
        )}

      </div>
  );
}

export default FileUploader;
