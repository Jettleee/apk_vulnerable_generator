# VulnLab — Vulnerable Training App Generator

> **Purpose:** Dockerized platform for generating intentionally vulnerable Android APKs, training labs, and CTF-style challenges for authorized mobile security education. All examples use dummy data and toy apps only. Never use these techniques against real systems without written authorization.

---

## Table of Contents

1. [What This Project Does](#1-what-this-project-does)
2. [Architecture Overview](#2-architecture-overview)
3. [File Structure](#3-file-structure)
4. [Feature Reference](#4-feature-reference)
5. [Vulnerability Modules](#5-vulnerability-modules)
6. [APK Build Pipeline](#6-apk-build-pipeline)
7. [Challenge Platform](#7-challenge-platform)
8. [API Reference](#8-api-reference)
9. [Deployment Requirements](#9-deployment-requirements)
10. [Deployment — Step by Step](#10-deployment--step-by-step)
11. [Extending the Project](#11-extending-the-project)
12. [Safety Constraints](#12-safety-constraints)

---

## 1. What This Project Does

VulnLab has two connected features:

### Lab Generator
- Select vulnerability modules, difficulty level, and app type
- Generates a structured training lab with: vulnerable code, fixed code, student tasks, teacher corrections, checklists, QCM questions
- Exports as Markdown report, JSON, or **real signed Android APK**
- APK is a compilable, installable Android app (com.training.vulnapp) with the selected vulnerabilities baked in

### Challenge Platform
- **Admin** generates a CTF-style challenge from any vulnerability module
- Admin controls: quiz question count (5–30), patched version visibility, difficulty
- **Student** receives a challenge URL and gets:
  - Vulnerable APK download (real APK to reverse-engineer)
  - Patched APK download (for comparison after solving)
  - 8-level progressive hints (reveal one at a time)
  - 8-level written student guide
  - Interactive quiz (up to 30 questions, 5 question types)
  - Writeup submission form
  - Instant score + per-question result breakdown
- **Admin** reviews submissions, rates writeups with stars + written feedback, views teacher solution

---

## 2. Architecture Overview

```
┌─────────────────────────────────────────────────────────┐
│                    Docker Compose                        │
│                                                         │
│  ┌──────────────────────┐    ┌───────────────────────┐  │
│  │   frontend           │    │   backend             │  │
│  │   React 18 + Vite    │───▶│   Node.js + Express   │  │
│  │   TailwindCSS        │    │   port 3001           │  │
│  │   port 3000          │    │                       │  │
│  └──────────────────────┘    │  Android SDK 34.0.0   │  │
│                              │  JDK 17 (Temurin)     │  │
│                              │  aapt2 / d8 / sign    │  │
│                              │                       │  │
│                              │  JSON file storage    │  │
│                              │  (no database)        │  │
│                              └───────────────────────┘  │
└─────────────────────────────────────────────────────────┘
```

- **No database.** All data stored in `backend/data/*.json`
- **No authentication.** Admin dashboard is open — add auth if deploying to a network
- **APK build runs inside the backend container** which has the full Android SDK pre-installed
- Frontend proxies all `/api/*` requests to backend via Vite config

---

## 3. File Structure

```
vulnerable-training-app-generator/
├── docker-compose.yml
│
├── backend/
│   ├── Dockerfile                          # JDK 17 + Node 20 + Android SDK 34
│   ├── server.js                           # Express app entry point
│   ├── package.json
│   │
│   ├── routes/
│   │   ├── modules.js                      # GET /api/modules
│   │   ├── generate.js                     # POST /api/generate
│   │   ├── export.js                       # POST /api/export/markdown
│   │   ├── apk.js                          # POST /api/apk/build
│   │   └── challenges.js                   # /api/challenges/* (full CRUD + APK)
│   │
│   ├── services/
│   │   ├── generatorService.js             # Lab object construction
│   │   ├── markdownService.js              # Lab → Markdown export
│   │   ├── apkBuilderService.js            # Full APK build pipeline
│   │   ├── apkTemplates.js                 # Java/XML source generators
│   │   ├── challengeGeneratorService.js    # Challenge CRUD, hints, writeups
│   │   └── quizGeneratorService.js         # Question banks, scoring
│   │
│   └── data/
│       ├── modules.json                    # 8 vulnerability module definitions
│       └── challenges.json                 # Generated challenges + submissions (runtime)
│
└── frontend/
    ├── Dockerfile
    ├── vite.config.js                      # /api proxy to backend:3001
    ├── tailwind.config.js
    │
    └── src/
        ├── App.jsx                         # Router: 6 routes
        ├── main.jsx
        │
        ├── components/
        │   ├── Navbar.jsx                  # Navigation links
        │   ├── ModuleCard.jsx              # Module info card
        │   ├── LabPreview.jsx              # Generated lab display
        │   ├── ExportPanel.jsx             # Export + APK download
        │   ├── HintsPanel.jsx              # Progressive hints (reveal one-by-one)
        │   ├── QuizWidget.jsx              # Interactive quiz (5 question types, paginated)
        │   └── WriteupForm.jsx             # Student writeup submission
        │
        └── pages/
            ├── Home.jsx
            ├── Generator.jsx               # Lab builder UI
            ├── Modules.jsx                 # Module browser
            ├── Export.jsx                  # Export page
            ├── AdminDashboard.jsx          # Admin: generate/manage challenges, rate submissions
            └── ChallengeView.jsx           # Student: solve challenge, download APKs, submit
```

---

## 4. Feature Reference

### Routes (Frontend)

| Path | Component | Description |
|------|-----------|-------------|
| `/` | Home | Landing page |
| `/generator` | Generator | Build training lab |
| `/modules` | Modules | Browse all 8 vulnerability modules |
| `/export` | Export | Download lab as Markdown / JSON / APK |
| `/admin` | AdminDashboard | Generate & manage challenges, rate submissions |
| `/challenge/:id` | ChallengeView | Student-facing CTF challenge |

### Lab Generator Workflow
1. Go to `/generator`
2. Enter title, description, select level (beginner/intermediate/advanced)
3. Choose app type (android/web) and fix mode (show fixes or not)
4. Select one or more vulnerability modules
5. Click Generate → preview lab
6. Go to `/export` → download Markdown, JSON, or build APK

### Challenge Platform Workflow
1. Admin goes to `/admin` → Generate Challenge tab
2. Select module, difficulty, quiz count (5–30 slider), patched visibility
3. Click Generate → challenge created with ID
4. Copy student link (e.g. `http://your-host:3000/challenge/challenge-17XXXXXXXXX`)
5. Share link with students
6. Students work through: Overview → Download APKs → Hints → Guide → Quiz → Submit
7. Admin reviews submissions in Submissions tab, rates with 1–5 stars + feedback

---

## 5. Vulnerability Modules

Eight modules defined in `backend/data/modules.json`. Each module contains:

| Field | Description |
|-------|-------------|
| `id` | Unique identifier |
| `name` | Display name |
| `category` | `android`, `web`, `native` |
| `difficulty` | `beginner`, `intermediate`, `advanced` |
| `description` | What the vulnerability is |
| `risk` | Real-world impact |
| `learningObjective` | What student learns |
| `vulnerableExample` | Vulnerable code/config snippet |
| `fixedExample` | Corrected code/config snippet |
| `studentTask` | Step-by-step instructions |
| `teacherCorrection` | Detailed correct explanation |
| `testCheck` | How to verify correct/incorrect |
| `checklist[]` | Verification checklist items |
| `qcm[]` | Multiple choice questions (5–6 per module) |

### Module List

| ID | Name | Difficulty |
|----|------|-----------|
| `exported-component` | Exported Component | Beginner |
| `secret-dummy` | Hardcoded Secret | Beginner |
| `cleartext-config` | Cleartext Network Config | Beginner |
| `sensitive-logs` | Sensitive Data in Logs | Beginner |
| `insecure-file-permission` | Insecure File Permission | Intermediate |
| `weak-input-validation` | Weak Input Validation | Intermediate |
| `insecure-debug-mode` | Insecure Debug Mode | Intermediate |
| `vulnerable-jni-native-check` | Vulnerable JNI Native Check | Advanced |

---

## 6. APK Build Pipeline

The backend container has the full Android toolchain pre-installed. Every APK is built from generated Java source at request time.

### Toolchain (inside Docker)
```
eclipse-temurin:17-jdk-jammy
  └── JDK 17 (javac, jar, keytool)

Android SDK /opt/android-sdk/
  ├── cmdline-tools/latest/         (sdkmanager)
  ├── platforms/android-33/         (android.jar — compile classpath)
  └── build-tools/34.0.0/
        ├── aapt2                   (resource compiler + linker)
        ├── d8                      (DEX compiler, replaces dx)
        ├── zipalign                (APK alignment)
        └── apksigner               (V2/V3 signature)
```

### Build Steps (`apkBuilderService.js`)
```
1. generateManifest()      →  AndroidManifest.xml (fixMode controls exported/debuggable flags)
2. generateMainActivity()  →  MainActivity.java   (vulnerability chosen based on modules[])
3. generateAdminActivity() →  AdminActivity.java  (if exported-component module selected)
4. generateNetworkConfig() →  network_security_config.xml (if cleartext-config selected)
5. generateNativeLibCpp()  →  native-lib.cpp (JNI educational reference — not compiled without NDK)
6. generateFridaHook()     →  frida-hook-jni-demo.js (if jni module, vuln mode)

Build pipeline:
  aapt2 compile --dir res/ → compiled_res/*.flat
  aapt2 link flat_files -I android.jar --manifest → linked.apk + R.java
  javac -classpath android.jar src/**/*.java gen/**/*.java → classes/
  jar cf classes.jar classes/
  d8 --release classes.jar → classes.dex
  zip -j linked.apk classes.dex
  zipalign -f 4 linked.apk aligned.apk
  apksigner sign --ks debug.jks aligned.apk → <name>-debug.apk
```

### APK Package
- Package: `com.training.vulnapp`
- Min SDK: 21 (Android 5.0)
- Target SDK: 33 (Android 13)
- Signed with: generated RSA-2048 debug keystore (`debug.jks`)
- Java source base class: `android.app.Activity` (no AndroidX — avoids dependency complexity)

### Note on JNI Module
The `vulnerable-jni-native-check` module includes `native-lib.cpp` as an **educational reference file** inside the APK (not compiled — NDK not installed). The Java layer simulates the native check using `DUMMY_TOKEN.equals(input)`. Students use Frida to hook the Java wrapper method. The C++ file is included to teach native code analysis concepts.

---

## 7. Challenge Platform

### Data Model (`challenges.json` entry)

```json
{
  "id": "challenge-<timestamp>",
  "moduleId": "exported-component",
  "title": "Challenge: Exported Component",
  "difficulty": "beginner",
  "appType": "android",
  "quizCount": 15,
  "showPatched": false,
  "generatedAt": "2026-01-01T00:00:00.000Z",
  "module": { "id", "name", "category", "description", "risk", "learningObjective" },
  "vulnerableApp": { "description": "...", "code": "...", "language": "java" },
  "patchedApp":    { "description": "...", "code": "...", "language": "java" },
  "hints": ["Hint 1: ...", ..., "Hint 8: exact fix code"],
  "studentWriteup": "## Level 1 — Understand...\n\n...\n\n## Level 8 — Verify",
  "teacherSolution": "# Teacher Solution...",
  "quiz": [ { quiz question objects } ],
  "submissions": [ { submission objects } ]
}
```

### Quiz Question Schema

```json
{
  "id": "ec-mc-1",
  "type": "multiple-choice",
  "difficulty": "beginner",
  "question": "What does android:exported=\"true\" allow?",
  "choices": ["A. ...", "B. ...", "C. ...", "D. ..."],
  "correctAnswer": "B",
  "explanation": "android:exported=\"true\" allows...",
  "relatedFile": "AndroidManifest.xml",
  "relatedFunction": "<activity>",
  "relatedConcept": "Component visibility"
}
```

### Question Types
| Type | Format | Scoring |
|------|--------|---------|
| `multiple-choice` | Radio A/B/C/D | Exact match |
| `true-false` | Radio true/false | Exact match |
| `short-answer` | Textarea | Fuzzy keyword match (≥40% key terms) |
| `code-reading` | Textarea | Fuzzy keyword match |
| `fix-identification` | Radio A/B/C/D | Exact match |

Quiz generation ensures at least one question of each type is included when count ≥ 5. Questions are randomly drawn from the module's question bank (35–40 questions per module).

### Submission Schema

```json
{
  "id": "sub-<timestamp>",
  "studentName": "Alice",
  "quizAnswers": ["B", "true", "apktool d app.apk", ...],
  "quizResult": {
    "score": 87,
    "correct": 7,
    "total": 8,
    "results": [{ "questionId", "userAnswer", "isCorrect", "correctAnswer", "explanation" }]
  },
  "writeup": "## Vulnerability Found\n...",
  "score": 87,
  "feedback": "Good analysis but missed the DataSyncService issue.",
  "rating": 4,
  "submittedAt": "2026-01-01T00:00:00.000Z",
  "ratedAt": "2026-01-01T01:00:00.000Z"
}
```

---

## 8. API Reference

### Lab Generation
| Method | Path | Body | Response |
|--------|------|------|----------|
| GET | `/api/modules` | — | Array of all 8 modules |
| POST | `/api/generate` | `{title, description, level, labType, selectedModules[], fixMode}` | Lab object |
| POST | `/api/export/markdown` | `{lab}` | `{markdown: "..."}` |
| POST | `/api/apk/build` | `{lab}` | Binary APK stream |
| GET | `/api/health` | — | `{status: "ok"}` |

### Challenges
| Method | Path | Body / Query | Response |
|--------|------|------|----------|
| POST | `/api/challenges/generate` | `{moduleId, difficulty, appType, quizCount, showPatched}` | Challenge object |
| GET | `/api/challenges` | — | Array of challenge summaries |
| GET | `/api/challenges/:id` | `?admin=true` (opt) | Challenge (student: no teacher solution, no patched if hidden) |
| POST | `/api/challenges/:id/submit` | `{studentName, quizAnswers[], writeup}` | `{submission, quizResult}` |
| POST | `/api/challenges/:id/submissions/:subId/rate` | `{rating, feedback}` | Updated submission |
| GET | `/api/challenges/:id/apk/vuln` | — | Binary signed vulnerable APK |
| GET | `/api/challenges/:id/apk/patched` | — | Binary signed patched APK |
| DELETE | `/api/challenges/:id` | — | `{ok: true}` |

---

## 9. Deployment Requirements

### Hardware
- RAM: minimum 2 GB free (Android SDK build uses ~800 MB during APK compilation)
- Disk: minimum 4 GB free (Android SDK layers ~2.5 GB in Docker image)
- CPU: any x86-64 — APK build takes ~3–5 seconds on modern hardware

### Software
| Requirement | Version | Notes |
|-------------|---------|-------|
| Docker Engine | 20.10+ | OR Podman 4.0+ with Docker CLI compatibility |
| Docker Compose | v2 (plugin) | `docker compose` (not `docker-compose`) |
| Git | any | To clone the repo |

> **No Node.js, Java, or Android SDK needed on the host.** Everything runs inside Docker.

### Ports
| Port | Service |
|------|---------|
| 3000 | Frontend (React/Vite) |
| 3001 | Backend API (Express) |

Both ports must be free on the host. Change in `docker-compose.yml` if needed.

### OS Compatibility
| OS | Status | Notes |
|----|--------|-------|
| Kali Linux / Debian / Ubuntu | Confirmed working | Use Podman or Docker |
| Other Linux distros | Should work | Standard Docker/Compose |
| macOS (Intel) | Should work | Docker Desktop |
| macOS (Apple Silicon M1/M2/M3) | Likely works | Android SDK has ARM64 Linux binaries; test build |
| Windows | Via WSL2 + Docker Desktop | Not tested |

---

## 10. Deployment — Step by Step

### Linux (Docker)

```bash
# 1. Install Docker and Docker Compose (Debian/Ubuntu/Kali)
sudo apt-get update
sudo apt-get install -y docker.io docker-compose-plugin
sudo systemctl enable --now docker
sudo usermod -aG docker $USER   # log out and back in after this

# 2. Clone the project
git clone <your-repo-url> vulnerable-training-app-generator
cd vulnerable-training-app-generator

# 3. Build and start (first build downloads Android SDK — takes 5–15 min)
docker compose up --build

# 4. Open browser
# Frontend:  http://localhost:3000
# Backend:   http://localhost:3001/api/health
```

### Linux (Podman — e.g. Kali)

```bash
# 1. Install Podman and Docker Compose plugin
sudo apt-get install -y podman podman-docker docker-compose-plugin

# 2. Start Podman socket (required for Docker Compose compatibility)
systemctl --user start podman.socket
systemctl --user enable podman.socket   # persist across reboots

# 3. Clone project
git clone <your-repo-url> vulnerable-training-app-generator
cd vulnerable-training-app-generator

# 4. Build and start
docker compose up --build

# 5. Open browser
# Frontend:  http://localhost:3000
# Backend:   http://localhost:3001/api/health
```

### Run in background (detached)
```bash
docker compose up --build -d

# View logs
docker compose logs -f backend
docker compose logs -f frontend

# Stop
docker compose down
```

### Rebuild after code changes
```bash
# Rebuild changed service only (faster)
docker compose up --build backend -d

# Or rebuild everything
docker compose up --build -d
```

### Verify APK build works
```bash
# Create a test challenge via API
curl -s -X POST http://localhost:3001/api/challenges/generate \
  -H 'Content-Type: application/json' \
  -d '{"moduleId":"exported-component","difficulty":"beginner","quizCount":5}' \
  | python3 -c "import sys,json; d=json.load(sys.stdin); print('ID:', d['id'])"

# Download vulnerable APK (replace <id> with output above)
curl -o test.apk http://localhost:3001/api/challenges/<id>/apk/vuln
file test.apk
# Expected: Android package (APK), with AndroidManifest.xml, with APK Signing Block
```

---

## 11. Extending the Project

### Add a New Vulnerability Module

1. **Add entry to `backend/data/modules.json`** — follow existing schema exactly (all fields required):
   ```json
   {
     "id": "your-new-module",
     "name": "Module Display Name",
     "category": "android",
     "difficulty": "intermediate",
     "description": "...",
     "risk": "...",
     "learningObjective": "...",
     "vulnerableExample": "code or config snippet",
     "fixedExample": "fixed version",
     "studentTask": "numbered steps...",
     "teacherCorrection": "detailed explanation",
     "testCheck": "how to verify...",
     "checklist": ["item 1", "item 2"],
     "qcm": [{ "question": "...", "choices": ["A...","B...","C...","D..."], "correct": "A", "explanation": "..." }]
   }
   ```

2. **Add APK code generation in `backend/services/apkTemplates.js`** — add `ids.has('your-new-module')` branches in `generateManifest()` and `generateMainActivity()` (or new activity/config file)

3. **Add quiz question bank in `backend/services/quizGeneratorService.js`** — add entry to `QUESTION_BANKS` object with at least 10 questions covering all 5 types

4. **Add progressive hints in `backend/services/challengeGeneratorService.js`** — add entry to `HINTS` object with exactly 8 strings (level 1 = vague, level 8 = exact fix)

5. **Add module to the dropdown in `frontend/src/pages/AdminDashboard.jsx`** — add entry to the `MODULES` array at the top of the file

### Add a New Quiz Question Type

1. Add new type string to a question in `quizGeneratorService.js`
2. Add rendering case in `QuizWidget.jsx` `QuestionCard` component
3. Add scoring logic in `scoreQuiz()` in `quizGeneratorService.js`

### Add Authentication (Admin)

The `/admin` route is currently open. To protect it:
1. Add a session middleware to Express (e.g. `express-session`)
2. Add `POST /api/auth/login` route that checks a password from environment variable
3. Add auth middleware to all `/api/challenges` write routes (generate, rate, delete)
4. Add a login page and redirect unauthenticated users from `/admin`

### Add Database (Replace JSON Files)

Currently `challenges.json` and `modules.json` are flat JSON files. To add a real DB:
1. Install `better-sqlite3` or `mongoose` in backend
2. Replace `fs.readFileSync`/`fs.writeFileSync` calls in `challengeGeneratorService.js` with DB queries
3. Create migration to seed modules from `modules.json` on first run

### Change Ports

Edit `docker-compose.yml`:
```yaml
services:
  backend:
    ports:
      - "8080:3001"   # host:container
  frontend:
    ports:
      - "8000:3000"
```

Then update frontend's API proxy in `frontend/vite.config.js` if backend port changes.

### Deploy to a Server (Production)

```bash
# On the server — same as local setup
git clone <repo> && cd vulnerable-training-app-generator
docker compose up --build -d

# Expose via nginx reverse proxy (recommended)
# /etc/nginx/sites-available/vulnlab:
server {
    listen 80;
    server_name your-domain.com;

    location / {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
    }

    location /api/ {
        proxy_pass http://localhost:3001;
    }
}
```

### Persist Data Across Container Restarts

By default `challenges.json` is inside the container and resets on rebuild. Add a volume mount in `docker-compose.yml`:
```yaml
services:
  backend:
    volumes:
      - ./backend/data:/app/data
```
Now `challenges.json` persists on the host filesystem.

---

## 12. Safety Constraints

These constraints are baked into the generated code and must be preserved when extending:

| Rule | Where Enforced |
|------|---------------|
| All APKs use package `com.training.vulnapp` only | `apkBuilderService.js` constant `PKG_PATH` |
| All secrets use dummy values (TRAINING-DUMMY-TOKEN-2024-FAKE, etc.) | `apkTemplates.js` all string constants |
| Frida hook examples target only `com.training.vulnapp` | `apkTemplates.js` `generateFridaHook()` |
| No NDK compilation — JNI .cpp is reference only | `apkBuilderService.js` — NDK not installed |
| Safety disclaimer on all Markdown exports | `generatorService.js` `safetyDisclaimer` field |
| Student-facing safety notice on all challenge pages | `ChallengeView.jsx` header |
| No real targets, no real credentials | All templates hardcode dummy values |
| No malware patterns (no persistence, no evasion, no C2) | Not implemented by design |

**Do not add:**
- Real API keys or credentials anywhere in the codebase
- Techniques targeting real banking, DRM, or payment apps
- Anti-detection or anti-analysis techniques
- Network-level attacks (MitM tools, packet injection)
- Anything that could be repurposed without the training context

---

## Key Concepts Reference

| Concept | Where Used | Learn More |
|---------|-----------|------------|
| `android:exported` | exported-component module | Android developer docs — component security |
| `AndroidManifest.xml` | All Android modules | Android manifest reference |
| `aapt2` | APK build pipeline | Android build tools guide |
| `d8` / DEX bytecode | APK build pipeline | Android DEX format docs |
| `apksigner` / V2 signing | APK build pipeline | Android APK signing guide |
| JNI (Java Native Interface) | vulnerable-jni-native-check module | Android NDK JNI tips |
| Frida instrumentation | JNI module hints | frida.re documentation |
| `apktool` (analysis) | Challenge student guide | https://apktool.org |
| `jadx` (analysis) | Challenge student guide | https://github.com/skylot/jadx |
| `adb` shell commands | Multiple module student tasks | Android ADB reference |
| Logcat / `adb logcat` | sensitive-logs module | Android logging guide |
| Network Security Config XML | cleartext-config module | Android network security config |
| `BuildConfig.DEBUG` | sensitive-logs fix pattern | Android build variants |
| ProGuard / R8 | sensitive-logs advanced fix | Android shrink guide |
| `MODE_PRIVATE` vs `MODE_WORLD_READABLE` | insecure-file-permission module | Android storage guide |
| Parameterized SQL queries | weak-input-validation module | SQLiteDatabase reference |
| `android:debuggable` / JDWP | insecure-debug-mode module | Android debugging guide |
