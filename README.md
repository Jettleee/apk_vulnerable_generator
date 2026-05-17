# Vulnerable-by-Design Training Lab Generator

> **SAFETY DISCLAIMER:** This tool generates controlled, fake-data cybersecurity labs for
> educational and defensive security training only. All code examples use dummy credentials
> and toy applications. **Never apply generated techniques to real systems without explicit
> written authorization.** Frida/JNI examples are limited to the generated local toy APK
> (`com.training.vulnapp`) only.

---

## Description

A Dockerized web application for cybersecurity educators to generate small
vulnerable-by-design training labs. Teachers select vulnerability modules, configure
difficulty and lab type, toggle Fix Mode, and export fully structured labs as Markdown or JSON.

## Features

- 8 vulnerability modules (Android, Secure Coding, Native JNI)
- Vulnerable + fixed code examples per module
- Student tasks, teacher corrections, QCM, checklists, evaluation rubrics
- Fix Mode toggle (show/hide fixes)
- Markdown and JSON export
- Module browser with category/difficulty filters
- Fully Dockerized — one command to run

## Tech Stack

- **Frontend:** React 18, Vite, TailwindCSS, React Router
- **Backend:** Node.js, Express
- **Storage:** JSON files (no database)
- **Deployment:** Docker, Docker Compose

---

## Setup with Docker (recommended)

```bash
git clone <repo-url>
cd vulnerable-training-app-generator
docker compose up --build
```

Then open: http://localhost:3000

## Setup without Docker

### Backend

```bash
cd backend
npm install
node server.js       # runs on port 3001
```

### Frontend

```bash
cd frontend
npm install
npm run dev          # runs on port 3000
```

Make sure backend is running before starting frontend.

---

## Folder Structure

```
vulnerable-training-app-generator/
├── backend/
│   ├── Dockerfile
│   ├── package.json
│   ├── server.js
│   ├── routes/
│   │   ├── modules.js       # GET /api/modules
│   │   ├── generate.js      # POST /api/generate
│   │   └── export.js        # POST /api/export/markdown
│   ├── services/
│   │   ├── generatorService.js
│   │   └── markdownService.js
│   └── data/
│       └── modules.json     # All vulnerability modules
├── frontend/
│   ├── Dockerfile
│   ├── package.json
│   ├── vite.config.js
│   ├── tailwind.config.js
│   ├── postcss.config.js
│   ├── index.html
│   └── src/
│       ├── main.jsx
│       ├── App.jsx
│       ├── pages/
│       │   ├── Home.jsx
│       │   ├── Generator.jsx
│       │   ├── Modules.jsx
│       │   └── Export.jsx
│       ├── components/
│       │   ├── Navbar.jsx
│       │   ├── ModuleCard.jsx
│       │   ├── LabPreview.jsx
│       │   └── ExportPanel.jsx
│       └── styles/
│           └── index.css
├── docker-compose.yml
└── README.md
```

---

## Available Modules

| Module | Category | Difficulty |
|--------|----------|------------|
| Exported Component | android | beginner |
| Secret Dummy | android | beginner |
| Cleartext Config | android | beginner |
| Sensitive Logs | android | beginner |
| Insecure File Permission | android | intermediate |
| Weak Input Validation | secure-coding | intermediate |
| Insecure Debug Mode | android | beginner |
| Vulnerable JNI Native Check | native | advanced |

---

## How to Add a New Vulnerability Module

Edit `backend/data/modules.json` and add a new object following this schema:

```json
{
  "id": "unique-module-id",
  "name": "Module Display Name",
  "category": "android | web | native | secure-coding",
  "difficulty": "beginner | intermediate | advanced",
  "description": "What vulnerability this simulates",
  "risk": "What an attacker can do",
  "learningObjective": "What the student will learn",
  "vulnerableExample": "Code example with \\n for newlines",
  "fixedExample": "Fixed code example",
  "studentTask": "Step-by-step task instructions",
  "teacherCorrection": "Expected correct answer and explanation",
  "testCheck": "Verification checklist for grading",
  "checklist": ["item 1", "item 2"],
  "qcm": [
    {
      "question": "Question text?",
      "choices": ["A. ...", "B. ...", "C. ...", "D. ..."],
      "correct": "A",
      "explanation": "Why A is correct"
    }
  ],
  "rubric": [
    { "criterion": "Criterion name", "weight": "25%" }
  ]
}
```

No backend code changes required — modules are loaded dynamically from the JSON file.

---

## Example Lab Generation Flow

1. Open http://localhost:3000
2. Click **Create Training Lab**
3. Fill in title, description, level, lab type
4. Check modules to include (e.g., "Exported Component", "Vulnerable JNI Native Check")
5. Toggle **Fix Mode** on to show solutions, or off for student-only view
6. Click **Generate Lab**
7. Review the lab in the preview panel
8. Click **Export →** and download Markdown or JSON

---

## Android APK Examples Note

All Android APK source code examples in this project are written in **Java only**.
No Kotlin files are generated. Examples use:
- `MainActivity.java`
- `AndroidManifest.xml`
- `network_security_config.xml`
- `native-lib.cpp` (for JNI module)

---

## JNI / Frida Examples Note

The Frida hook script (`frida-hook-jni-demo.js`) and JNI examples are **exclusively for
the generated local toy APK** with package name `com.training.vulnapp`.

- Do not use against real applications
- Do not use against banking, DRM, or payment apps
- The script does not include anti-detection, persistence, or obfuscation bypass
- It demonstrates a teaching concept only: why client-side native checks are insufficient

---

## API Reference

```
GET  /api/modules                  — list all modules (query: category, difficulty)
GET  /api/modules/:id              — get single module
POST /api/generate                 — generate a lab
POST /api/export/markdown          — convert lab JSON to Markdown
GET  /api/health                   — health check
```

### POST /api/generate body

```json
{
  "title": "Lab Title",
  "description": "Optional description",
  "level": "beginner | intermediate | advanced",
  "labType": "android | web | general",
  "selectedModules": ["exported-component", "secret-dummy"],
  "fixMode": true
}
```

---

*For authorized educational use only. All examples use fake data.*
