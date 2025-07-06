import dotenv from "dotenv";
dotenv.config();
console.log("DEBUG API KEY:", process.env.HUGGINGFACE_API_KEY);

import app from "./app.js";

const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
  console.log(`🚀 Server running at http://localhost:${PORT}`);
});