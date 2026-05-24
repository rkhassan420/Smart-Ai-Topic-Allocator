# 🎓 Smart Topic Allocator (AI-Powered)

> An advanced AI-powered academic platform that automatically generates, assigns, manages, and exports student assignment topics using Google Gemini AI and modern frontend engineering.

---

## 🚀 Live Demo

🔗 **Frontend Demo:** https://random-allocator.netlify.app/  

---

## 📸 Screenshots

### 🖥️ Upload File
![Upload Screenshot](./screenshots/upload.png)

### 📱 Select-Options
![select-options Screenshot](./screenshots/select-options.png)

### 🤖 Generating topics
![Generating-Topics Screenshot](./screenshots/generating-topics.png)

### 📤 Topics Generate
![Topics-Generate Screenshot](./screenshots/topics-generate.png)

### 📤 Dashboard
![Main Screenshot](./screenshots/1.png)

### 📤 Allocated Topics
![Main Screenshot](./screenshots/2.png)

### 📤 Export Modal
![Main Screenshot](./screenshots/3.png)

### 📤 Exported File
![Main Screenshot](./screenshots/4.png)

### 📤 Dark Mode
![Main Screenshot](./screenshots/dark.png)

---

## ✨ Key Features

### 🤖 AI-Powered Topic Generation
- Powered by **Google Gemini API**
- Generates structured academic topics from documents
- Includes:
  - Title
  - Description
  - Difficulty level
  - Estimated hours
  - Tags
- Multi-language support (English, Urdu, Arabic, etc.)
- Custom academic levels (High School → Graduate)

---

### 🎓 Smart Assignment System
- Automatically assigns topics to students
- Fair distribution logic
- Re-roll individual student assignment
- Conflict detection (students > topics warning system)

---

### 📂 Bulk Import System
- Paste or upload multiple entries instantly
- Supports:
  - `.txt`
  - `.csv`
  - `.md`
  - `.pdf`
- Instant preview before importing
- Drag & drop support

---

### 🧠 AI Document Understanding
- Upload syllabus, notes, or research papers
- AI extracts meaningful topics automatically
- Intelligent content summarization

---

### 📤 Advanced Export System
Export assignments in multiple formats:

#### 📄 PDF Export
- Styled academic reports
- Tables with formatting
- Header/Footer customization
- Page numbering

#### 📊 Excel Export
- Multi-sheet workbook
- Metadata sheet included
- Freeze header support
- Structured dataset export

#### 🖼️ PNG Export
- Canvas-based rendering
- Theme-based design
- High-resolution output
- Shareable visual reports

---

### 📊 Session Management
- Save multiple assignment sessions
- Load previous sessions anytime
- Delete or manage history
- Persistent local storage

---

### 🎨 Modern UI/UX
- Framer Motion animations
- Drag & Drop (dnd-kit)
- Dark/Light theme system
- Glassmorphism UI design
- Fully responsive layout

---

## 🛠️ Tech Stack

### Frontend
- React.js (Vite)
- Framer Motion
- Axios
- dnd-kit
- React Hot Toast

### AI Integration
- Google Gemini API

### Export Libraries
- jsPDF
- jspdf-autotable
- xlsx (SheetJS)

### Styling
- Custom CSS (Modern UI system)

---

## ⚙️ Installation

```bash
# Clone repository
git clone https://github.com/your-username/smart-topic-allocator.git

# Navigate to project
cd smart-topic-allocator

# Install dependencies
npm install

# Start development server
npm run dev
