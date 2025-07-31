# DocuMentor

DocuMentor is a web application that allows users to upload, manage, and summarize PDF documents using AI. The platform ensures secure access using JWT-based authentication and is built with a scalable structure to support features like admin panel, document preview, and file management.

---

##  📽️ Live Demo

👉 [Watch the Demo Video](https://youtu.be/wFTPJlzmIjg)


---

🚀 Features

* ✅ **User Authentication** (JWT protected)
* 📄 **PDF Upload and AI Summary Generation**
* 📥 **Download Uploaded Files**
* 🗑️ **Delete Uploaded Files**
* 👁️ **Document Preview (Text-based PDFs only)**
* ⚙️ Scalable backend structure with separate controllers, routes, middleware, and models
* 🌐 Frontend built with React + TailwindCSS + Vite


---

## 🧠 Tech Stack

### Frontend

* React.js (Vite)
* Tailwind CSS
* React Toastify

### Backend

* Node.js (ES Modules)
* Express.js
* Multer (file upload)
* pdf-parse (PDF text extraction)
* JSON Web Token (JWT)
* bcrypt.js (password hashing)

---

## 📁 Folder Structure

```
DocuMentor/
├── client/                  # Frontend
│   ├── src/
│   │   ├── api/             # API calls
│   │   ├── components/      # Reusable components
│   │   ├── pages/           # Page components
│   │   ├── styles/          # CSS files
│   │   └── config.js        # Base URL config
│   └── index.html
│
├── server/                 # Backend
│   ├── controllers/
│   ├── middleware/
│   ├── models/
│   ├── routes/
│   └── uploads/            # Uploaded PDFs + file metadata
│
└── README.md
```

---

## 🔐 Authentication

* JWT-based login and registration
* Passwords are hashed using `bcrypt`
* Middleware used to protect routes (upload, delete, etc.)
* Future-proof setup to integrate an **admin panel** later

---

## 🛠️ Setup Instructions

### Prerequisites:

* Node.js v18+ (ESM-compatible)
* npm

### Clone and Install

```bash
git clone https://github.com/nitish9592/DocuMentor.git
cd DocuMentor

# Backend
cd server
npm install
npm start

# Frontend
cd ../client
npm install
npm run dev
```

---

## ⚒️ Upcoming Features

* [ ] Admin Panel with dashboard
* [ ] User profile and history
* [ ] AI-powered multi-page summaries
* [ ] OCR for scanned PDFs

---

## 🤝 Contributing

Pull requests and feedback are welcome. For major changes, please open an issue first.

---

## 📜 License

This project is licensed under the MIT License.

---

## 🙋‍♂️ Author

**Nitish Bhagat**
[GitHub Profile](https://github.com/nitish9592)

---

> Built with ❤️ to simplify legal and document workflows.
