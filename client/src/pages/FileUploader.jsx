import { useEffect, useState } from "react";
import {
  fetchFiles,
  uploadFile,
  deleteFile,
  getDownloadLink,
  getPreviewLink,
} from "../api/fileApi.js";
import { toast } from "react-toastify";
import { motion } from "framer-motion";
import { Trash2, Eye, Download, FilePlus, Loader2 } from "lucide-react";

export default function FileUploader() {
  const [files, setFiles] = useState([]);
  const [search, setSearch] = useState("");
  const [expanded, setExpanded] = useState({});
  const [previewFile, setPreviewFile] = useState(null);
  const [isLoading, setIsLoading] = useState(false);  // ✅ Loading state added

  useEffect(() => {
    const loadFiles = async () => {
      try {
        const data = await fetchFiles();
        console.log("Fetched files:", data); 
        setFiles(data);
      } catch {
        toast.error("Failed to fetch files");
      }
    };
    loadFiles();
  }, []);

  const handleFileChange = async (e) => {
    const file = e.target.files[0];
    if (!file || file.type !== "application/pdf") {
      toast.error("Please upload a valid PDF file");
      return;
    }

    const formData = new FormData();
    formData.append("pdf", file);

    setIsLoading(true);  // ✅ Start loading
    try {
      const data = await uploadFile(formData);
      setFiles((prev) => [...prev, data]);
      toast.success("File uploaded successfully!");
    } catch {
      toast.error("Upload failed");
    } finally {
      setIsLoading(false);  // ✅ Stop loading
    }
  };

  const removeFile = async (serverName) => {
    try {
      await deleteFile(serverName);
      setFiles((prev) => prev.filter((file) => file.serverName !== serverName));
      toast.success("Deleted successfully");
    } catch {
      toast.error("Delete failed");
    }
  };

  return (
    <div className="p-4 max-w-3xl mx-auto">
      <div className="bg-white shadow-md rounded-lg p-6 space-y-4">
        <label
          className={`flex items-center justify-center border-2 border-dashed border-blue-400 rounded-lg p-6 cursor-pointer hover:bg-blue-50 ${
            isLoading ? "opacity-50 cursor-not-allowed" : ""
          }`}
        >
          <input
            type="file"
            accept="application/pdf"
            onChange={handleFileChange}
            className="hidden"
            disabled={isLoading}
          />
          <span className="flex items-center gap-2 text-blue-600">
            <FilePlus /> Upload PDF
          </span>
        </label>

        {isLoading && (
          <div className="flex items-center justify-center gap-2 text-blue-600">
            <Loader2 className="animate-spin" />
            <span>Generating summary...</span>
          </div>
        )}

        <input
          type="text"
          placeholder="Search by filename..."
          className="border p-2 w-full rounded"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          disabled={isLoading}
        />

        {files
          .filter((file) =>
            file.originalName.toLowerCase().includes(search.toLowerCase())
          )
          .sort((a, b) => new Date(b.uploadedAt) - new Date(a.uploadedAt))
          .map((file, index) => (
            <motion.div
              key={index}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="bg-gray-50 p-4 rounded-lg shadow flex flex-col space-y-2"
            >
              <div className="flex justify-between items-center">
                <h3 className="font-semibold text-gray-800">
                  {file.originalName}
                </h3>
                <div className="flex gap-2">
                  <button
                    onClick={() => removeFile(file.serverName)}
                    className="text-red-500"
                    disabled={isLoading}
                  >
                    <Trash2 />
                  </button>
                  <button
                    onClick={async () => {
                      try {
                        const blob = await getDownloadLink(file.serverName);
                        const url = URL.createObjectURL(blob);
                        const link = document.createElement("a");
                        link.href = url;
                        link.download = file.originalName;
                        link.click();
                        URL.revokeObjectURL(url);
                      } catch {
                        toast.error("Download failed");
                      }
                    }}
                    className="text-blue-500"
                    disabled={isLoading}
                  >
                    <Download />
                  </button>
                  <button
                    onClick={async () => {
                      try {
                        const blob = await getPreviewLink(file.serverName);
                        const url = URL.createObjectURL(blob);
                        setPreviewFile(url);
                      } catch {
                        toast.error("Preview failed");
                      }
                    }}
                    className="text-green-500"
                    disabled={isLoading}
                  >
                    <Eye />
                  </button>
                </div>
              </div>
              <div>
                <span className="text-xs text-gray-500">
                  {new Date(file.uploadedAt).toLocaleString()}
                </span>
              </div>
              <div className="text-sm text-gray-700">
                <strong>Summary:</strong>{" "}
                {expanded[index]
                  ? file.summary
                  : file.summary.length > 150
                  ? file.summary.slice(0, 150) + "..."
                  : file.summary}

                {file.summary.length > 150 && (
                  <button
                    onClick={() =>
                      setExpanded((prev) => ({
                        ...prev,
                        [index]: !prev[index],
                      }))
                    }
                    className="ml-2 text-blue-600 text-xs underline"
                  >
                    {expanded[index] ? "Show Less" : "Show More"}
                  </button>
                )}
              </div>
            </motion.div>
          ))}

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
                src={previewFile}
                title="PDF Preview"
                className="w-full h-[500px] border"
              />
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
