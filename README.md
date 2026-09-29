# AI-Based Resume Screening and Candidate Shortlisting System

[![Node.js](https://img.shields.io/badge/Node.js-18%2B-green.svg)](https://nodejs.org/)
[![React](https://img.shields.io/badge/React-19-blue.svg)](https://react.dev/)
[![FastAPI](https://img.shields.io/badge/FastAPI-Python_3.10%2B-teal.svg)](https://fastapi.tiangolo.com/)
[![MongoDB](https://img.shields.io/badge/MongoDB-Local%2FAtlas-forestgreen.svg)](https://www.mongodb.com/)
[![Tailwind CSS](https://img.shields.io/badge/Tailwind_CSS-v4-38bdf8.svg)](https://tailwindcss.com/)

A modern, full-stack, enterprise-grade recruitment platform built for college project demonstration and viva evaluation. The system enables recruiters to create job postings, upload batches of candidate resumes (PDF/DOCX), parse resume text and entities, compute explainable AI match scores against job requirements using an independent NLP microservice, and manage candidate shortlisting pipelines with human-in-the-loop oversight.

---

## 1. System Architecture

The application is engineered with a strict 3-tier decoupled architecture:

```text
┌────────────────────────────────────────────────────────┐
│                   FRONTEND (Vite + React 19)           │
│   • Tailwind CSS v4  • Lucide React  • React Router    │
│   • Candidate Pipelines  • Score Visualizers  • CSV    │
└───────────────────────────┬────────────────────────────┘
                            │ HTTP / REST (/api/*)
                            ▼
┌────────────────────────────────────────────────────────┐
│               BACKEND (Node.js + Express)              │
│   • JWT Auth      • Multer Uploads • Mongoose / Mongo  │
│   • PDF / DOCX Text Extractors • Fallback AI Engine    │
└───────────────┬────────────────────────────┬───────────┘
                │                            │
   Internal API │ (JSON HTTP)                │ MongoDB Driver
   Port 8000    ▼                            ▼ Port 27017
┌───────────────────────────┐  ┌─────────────────────────┐
│     AI SERVICE (FastAPI)  │  │   DATABASE (MongoDB)    │
│  • TF-IDF Vectorization   │  │  • Users (Recruiters)   │
│  • Cosine Similarity      │  │  • Jobs                 │
│  • Skill Delta Analysis   │  │  • Candidates           │
│  • Natural Lang Reasoning │  │  • Applications (Scores)│
└───────────────────────────┘  └─────────────────────────┘
```

---

## 2. Key Features

- **Recruiter Authentication & Security**: Secure bcryptjs password hashing and 30-day cryptographically signed JSON Web Tokens (JWT).
- **Job Posting Management (CRUD)**: Create, view, update, and manage job openings with required skills, preferred skills, experience bounds, and departments.
- **Multi-File Resume Upload**: Upload up to 15 PDF and DOCX files simultaneously with automated type and size validation.
- **Automated Resume Text & Entity Parsing**: Extracts candidate name, email, phone number, technical skills taxonomy, years of experience, education credentials, and project highlights without hallucination.
- **Independent FastAPI AI Microservice**: Computes multi-factor weighted match scores (0–100%) using semantic TF-IDF cosine similarity and skill coverage analysis.
- **Explainable AI Reasoning**: Every candidate score includes a transparent natural-language justification, matched skills badges, missing skill gaps, and a recommendation tag (`Strong Match`, `Potential Match`, `Low Match`).
- **Resilient Fallback Engine**: If the Python FastAPI microservice is offline, the Node.js backend seamlessly executes an embedded fallback calculation, guaranteeing 100% uptime.
- **Candidate Pipeline & Ranking**: Rank candidates by match score descending, filter by status or minimum match score threshold (e.g. 70%+), and search by name/skill.
- **Recruiter Actions & Batch Workflows**: One-click "Shortlist Top 3" automated AI shortlisting, batch status updates, and single-click candidate status reviews.
- **CSV Pipeline Export**: Download recruiter candidate reports with names, contacts, match scores, review statuses, skills delta, and AI explanations.
- **Interactive KPI Dashboard**: Real-time recruiter metrics tracking total jobs, candidate volume, pipeline conversion rates, and recent activity.

---

## 3. Project Directory Structure

```text
AI-Resume-Screener/
│
├── frontend/                   # React 19 + Vite + Tailwind CSS v4 client
│   ├── src/
│   │   ├── components/         # Navbar, ProtectedRoute, UI components
│   │   ├── context/            # AuthContext (JWT session management)
│   │   ├── pages/
│   │   │   ├── Home.jsx             # Landing page with system overview
│   │   │   ├── Login.jsx            # Recruiter login page
│   │   │   ├── Register.jsx         # Recruiter account creation
│   │   │   ├── Dashboard.jsx        # Recruitment metrics & KPI stats
│   │   │   ├── JobsList.jsx         # Job management list & filters
│   │   │   ├── JobCreate.jsx        # Job posting creation wizard
│   │   │   ├── JobDetails.jsx       # Single job overview & inline edit
│   │   │   ├── ResumeUpload.jsx     # Multi-resume upload & test generator
│   │   │   ├── JobCandidates.jsx    # Candidate pipeline, batch actions, CSV
│   │   │   └── CandidateDetails.jsx # Explainable AI match breakdown
│   │   ├── App.jsx             # Client routing configuration
│   │   └── main.jsx
│   ├── vite.config.js          # Vite configuration with /api backend proxy
│   └── package.json
│
├── backend/                    # Node.js + Express REST API
│   ├── config/
│   │   └── db.js               # Mongoose MongoDB connection
│   ├── controllers/
│   │   ├── authController.js        # Recruiter registration & authentication
│   │   ├── jobController.js         # Job postings CRUD
│   │   ├── resumeController.js      # Upload, extraction, candidates, pipeline
│   │   └── dashboardController.js   # Recruitment KPI metrics
│   ├── models/
│   │   ├── User.js             # Recruiter schema with bcrypt pre-save hook
│   │   ├── Job.js              # Job posting schema
│   │   ├── Candidate.js        # Candidate extracted profile schema
│   │   └── Application.js      # Job application with AI score & explanation
│   ├── middleware/
│   │   ├── authMiddleware.js   # JWT protect middleware
│   │   └── uploadMiddleware.js # Multer multi-file upload validation
│   ├── routes/
│   │   ├── authRoutes.js       # /api/auth/*
│   │   ├── jobRoutes.js        # /api/jobs/*
│   │   ├── candidateRoutes.js  # /api/candidates/*
│   │   ├── applicationRoutes.js# /api/applications/* (status, batch, analyze)
│   │   ├── dashboardRoutes.js  # /api/dashboard/*
│   │   └── healthRoutes.js     # /api/health
│   ├── services/
│   │   ├── resumeParserService.js # PDF & DOCX text extraction
│   │   └── aiService.js           # FastAPI client with embedded fallback
│   ├── uploads/                # Statically served resume storage
│   ├── server.js               # Express application entrypoint
│   ├── test-auth.js            # Phase 3 automated test suite
│   ├── test-jobs.js            # Phase 4 & 5 automated test suite
│   ├── test-resumes.js         # Phase 6, 7 & 8 automated test suite
│   ├── test-ai-matching.js     # Phase 9 & 10 automated test suite
│   ├── test-e2e.js             # Phase 14 complete end-to-end integration test
│   └── package.json
│
├── ai-service/                 # Independent Python FastAPI microservice
│   ├── main.py                 # TF-IDF semantic engine & explainable analysis
│   └── requirements.txt        # FastAPI, Uvicorn, Scikit-learn, NumPy
│
└── README.md                   # Complete system documentation & Viva guide
```

---

## 4. Technology Stack & Packages

| Tier | Component | Technology / Library | Purpose |
|---|---|---|---|
| **Frontend** | Framework | React 19 + Vite | High-performance single page application |
| | Styling | Tailwind CSS v4 | Responsive modern dark-mode recruitment interface |
| | Icons | Lucide React | Visual indicator icons |
| | Routing | React Router v6 | Client-side protected route navigation |
| | HTTP Client | Axios | REST API communication with backend |
| **Backend** | Server | Node.js + Express | RESTful API server |
| | Database | MongoDB + Mongoose | Document storage with indexing and schema validation |
| | Security | JWT + bcryptjs | Salting/hashing and token verification |
| | File Upload | Multer | Multipart resume file handling |
| | Text Parsing | pdf-parse + mammoth | PDF and DOCX text extraction |
| **AI Service**| Framework | FastAPI + Uvicorn | Async Python microservice on port 8000 |
| | NLP / Matching | Scikit-learn (TF-IDF) | Semantic cosine similarity calculation |
| | Math | NumPy | Matrix computations and score normalization |

---

## 5. Getting Started & Setup Guide

### Prerequisites
- **Node.js**: v18.x or v20.x+
- **MongoDB**: Local MongoDB instance running on `localhost:27017` (or MongoDB Atlas URI)
- **Python**: v3.10, v3.11, 3.12, or 3.13

---

### Step 1: Start MongoDB
Ensure MongoDB is running locally:
```powershell
# Verify MongoDB service
Get-Service -Name MongoDB
```
Or start via command line / MongoDB Compass:
```powershell
mongod --dbpath "C:\data\db"
```

---

### Step 2: Configure & Start Backend (Port 5000)

1. Open a terminal and navigate to `backend`:
   ```powershell
   cd backend
   ```
2. Install dependencies:
   ```powershell
   npm install
   ```
3. Verify `.env` configuration (default provided):
   ```env
   PORT=5000
   NODE_ENV=development
   MONGO_URI=mongodb://localhost:27017/ai-resume-screener
   JWT_SECRET=supersecretjwtkey_ai_resume_screener_2026
   JWT_EXPIRE=30d
   AI_SERVICE_URL=http://127.0.0.1:8000
   ```
4. Start the backend development server:
   ```powershell
   npm run dev
   # or
   npm start
   ```
5. Verify health:
   ```powershell
   curl http://localhost:5000/api/health
   ```

---

### Step 3: Configure & Start Python FastAPI AI Service (Port 8000)

1. Open a second terminal and navigate to `ai-service`:
   ```powershell
   cd ai-service
   ```
2. Install Python requirements:
   ```powershell
   pip install -r requirements.txt
   ```
3. Start the FastAPI server using Uvicorn:
   ```powershell
   python -m uvicorn main:app --host 127.0.0.1 --port 8000 --reload
   ```
4. Verify AI Service health:
   - In browser: `http://127.0.0.1:8000/health`
   - Interactive Swagger API docs: `http://127.0.0.1:8000/docs`

---

### Step 4: Configure & Start Frontend (Port 5173)

1. Open a third terminal and navigate to `frontend`:
   ```powershell
   cd frontend
   ```
2. Install dependencies:
   ```powershell
   npm install
   ```
3. Start the Vite development server:
   ```powershell
   npm run dev
   ```
4. Open your browser and navigate to:
   ```
   http://localhost:5173
   ```

---

## 6. Automated Verification & Test Suites

The project contains 5 comprehensive automated test scripts:

| Command | Target Phase | Description |
|---|---|---|
| `npm run test:auth` | Phase 3 | Tests recruiter registration, duplicate rejection, login, and protected route access. |
| `npm run test:jobs` | Phases 4 & 5 | Tests job creation, listing, updating, cascading deletion, and dashboard metrics. |
| `npm run test:resumes` | Phases 6, 7 & 8 | Tests multi-PDF upload, text parsing, entity extraction, and status transitions. |
| `npm run test:ai` | Phases 9 & 10 | Tests FastAPI semantic scoring, skill delta matching, and explainable output. |
| `npm run test:e2e` | Phase 14 | **Complete 11-stage End-to-End System Test** verifying the entire user workflow. |

To run the complete End-to-End test suite:
```powershell
cd backend
npm run test:e2e
```

**Output of E2E Verification**:
```text
================================================================
🚀 AI RESUME SCREENER — COMPLETE END-TO-END SYSTEM INTEGRATION TEST
================================================================

[STAGE 1/11] System Health & Database Connectivity Check...
✅ Health Check Passed: System and MongoDB are fully operational.

[STAGE 2/11] Recruiter Account Registration (POST /api/auth/register)...
✅ Recruiter registered: "Dr. Jane Foster"
✅ JWT Token issued: eyJhbGciOiJIUzI1NiIsInR5...

[STAGE 3/11] Recruiter Login & Protected Profile Retrieval...
✅ Login verified with bcrypt password matching.
✅ Protected route /api/auth/me confirmed.

[STAGE 4/11] Creating New Job Posting (POST /api/jobs)...
✅ Job created successfully: "Full Stack AI Developer"

[STAGE 5/11] Synthesizing & Uploading Multi-Candidate Resumes...
✅ Multi-resume upload processed: 2 resumes.
   Candidate 1: Aarav Sharma -> Match Score: 96%, Recommendation: "Strong Match"
   Candidate 2: Vikram Roy   -> Match Score: 23%, Recommendation: "Low Match"

[STAGE 6/11] Inspecting AI Scoring & Pipeline Ordering...
✅ Candidate ranking verified: Highest match score sorted first.

[STAGE 7/11] Testing Threshold Filtering (minScore=70)...
✅ Filtered applications (minScore >= 70%): 1 candidates returned.

[STAGE 8/11] Human-in-the-Loop Recruiter Shortlisting...
✅ Candidate "Aarav Sharma" status updated to: Shortlisted

[STAGE 9/11] Batch Candidate Status Update (PUT /api/applications/batch-status)...
✅ Batch update completed: Updated status to Under Review.

[STAGE 10/11] Candidate Profile Inspection & Re-Analysis...
✅ AI Re-Analysis Succeeded: Score 96%, Source: fastapi-ai-microservice

[STAGE 11/11] Recruiter Dashboard Metrics...
✅ Dashboard Analytics: Total Jobs: 1, Candidates: 2, Shortlisted: 1

================================================================
🎉 ALL 11 END-TO-END INTEGRATION TEST STAGES COMPLETED SUCCESSFULLY!
================================================================
```

---

## 7. AI Scoring Methodology & Mathematical Formulation

The matching engine computes a deterministic, explainable composite suitability score from 0 to 100 based on 5 weighted pillars:

$$\text{Final Match Score} = (W_{\text{skills}} \cdot S_{\text{skills}}) + (W_{\text{sem}} \cdot S_{\text{sem}}) + (W_{\text{exp}} \cdot S_{\text{exp}}) + (W_{\text{edu}} \cdot S_{\text{edu}}) + (W_{\text{pref}} \cdot S_{\text{pref}})$$

### Weights Distribution
- **$W_{\text{skills}} = 0.40$ (40%) — Required Skills Coverage**:
  $$\frac{|\text{Extracted Skills} \cap \text{Required Skills}|}{|\text{Required Skills}|} \times 100$$
- **$W_{\text{sem}} = 0.30$ (30%) — Semantic Resume-Job Similarity**:
  $$\text{Cosine Similarity}(\vec{V}_{\text{resume}}, \vec{V}_{\text{job}}) \times 100$$
  where $\vec{V}$ represents TF-IDF n-gram vectors with sublinear term-frequency scaling.
- **$W_{\text{exp}} = 0.15$ (15%) — Years of Relevant Experience**:
  $$\min\left(1.0, \frac{\text{Candidate Experience Years}}{\text{Job Required Minimum Years}}\right) \times 100$$
- **$W_{\text{edu}} = 0.10$ (10%) — Education Tier Alignment**:
  Determined by level alignment (Doctorate/Master's = 100%, Bachelor's/B.Tech = 85%, Diploma = 65%).
- **$W_{\text{pref}} = 0.05$ (5%) — Preferred / Bonus Skills Coverage**:
  Bonus points for optional complementary skills (e.g. Docker, AWS, Kubernetes).

### Ethical AI & Demographic Fairness
- The scoring engine strictly evaluates **skills, experience, and education credentials**.
- Personal attributes (name, gender, age, nationality, photos, postal address) are **excluded from scoring algorithms** to prevent demographic and unconscious bias.
- **Human-in-the-Loop Oversight**: The AI score is strictly a recommendation tool; recruiters retain final authority to shortlist, review, or reject candidates.

---

## 8. Complete API Reference

### Authentication Routes (`/api/auth`)
| Method | Route | Description | Auth Required |
|---|---|---|---|
| `POST` | `/api/auth/register` | Register new recruiter account | Public |
| `POST` | `/api/auth/login` | Authenticate recruiter & return JWT | Public |
| `GET` | `/api/auth/me` | Fetch authenticated recruiter profile | Bearer Token |

### Job Management Routes (`/api/jobs`)
| Method | Route | Description | Auth Required |
|---|---|---|---|
| `POST` | `/api/jobs` | Create a new job posting | Bearer Token |
| `GET` | `/api/jobs` | List recruiter's jobs with applicant counts | Bearer Token |
| `GET` | `/api/jobs/:id` | Fetch single job with full details & metrics | Bearer Token |
| `PUT` | `/api/jobs/:id` | Update existing job posting | Bearer Token |
| `DELETE` | `/api/jobs/:id` | Delete job posting & associated applications | Bearer Token |

### Resume Upload & Candidate Pipeline (`/api/jobs/:jobId/*` & `/api/applications/*`)
| Method | Route | Description | Auth Required |
|---|---|---|---|
| `POST` | `/api/jobs/:jobId/resumes` | Upload multiple PDF/DOCX resumes (Multer) | Bearer Token |
| `GET` | `/api/jobs/:jobId/candidates` | Get ranked candidates with search, sort & minScore | Bearer Token |
| `GET` | `/api/candidates/:id` | Get detailed candidate extracted profile & file URL | Bearer Token |
| `PUT` | `/api/applications/:id/status` | Update candidate review status | Bearer Token |
| `PUT` | `/api/applications/batch-status` | Batch update multiple candidate statuses | Bearer Token |
| `POST` | `/api/applications/:id/analyze` | Re-run AI analysis on an application | Bearer Token |

### Analytics & System Health
| Method | Route | Description | Auth Required |
|---|---|---|---|
| `GET` | `/api/dashboard/stats` | Recruiter statistics & pipeline conversion | Bearer Token |
| `GET` | `/api/health` | System health & MongoDB connection status | Public |
| `POST` | `http://127.0.0.1:8000/analyze` | FastAPI direct resume analysis microservice | Public |

---

## 9. Viva Voce & College Examination Questions (with Model Answers)

### Q1: What is the benefit of an independent FastAPI microservice over putting everything in Node.js?
> **Answer**: Python provides the premier ecosystem for natural language processing and machine learning (scikit-learn, PyTorch, NumPy, spaCy). Keeping the AI service decoupled allows it to scale independently, run compute-heavy matrix operations without blocking the Node.js event loop, and be replaced or upgraded (e.g. to a transformer model or self-hosted LLM) without touching the core recruitment backend.

### Q2: How does the system ensure zero downtime if the Python service crashes?
> **Answer**: In `backend/services/aiService.js`, the Node.js backend calls the FastAPI service over HTTP. If the service is unreachable (network timeout or connection refused), the system catches the error and immediately routes the request to an internal embedded deterministic scoring algorithm. This ensures recruiters can still upload and rank resumes even during microservice maintenance.

### Q3: How do you extract text and entities from uploaded resumes without relying on third-party paid APIs?
> **Answer**: We use open-source parsing engines: `pdf-parse` for PDF stream extraction and `mammoth` for DOCX XML document conversion. For entity recognition, we employ regular expressions for emails and phone numbers, and a taxonomy dictionary matcher for technical skills across software development, data science, DevOps, and cloud categories.

### Q4: How is candidate privacy and AI bias addressed?
> **Answer**: The AI service processes only technical credentials—specifically extracted skills, education, and years of experience. Demographic indicators (name, gender, age, profile pictures, address) are completely excluded from the mathematical scoring formula. Furthermore, the system is strictly "Human-in-the-Loop", providing recommendations rather than automated hiring decisions.

### Q5: How does the semantic similarity engine work mathematically?
> **Answer**: Resumes and job descriptions are transformed into term-frequency inverse-document-frequency (TF-IDF) vectors with sublinear term-frequency scaling and bigram analysis. The angle between the two vectors in high-dimensional feature space is measured using cosine similarity:
$$\cos(\theta) = \frac{\vec{A} \cdot \vec{B}}{\|\vec{A}\| \|\vec{B}\|}$$
A score of 1.0 represents perfect semantic alignment, whereas 0.0 indicates orthogonal (unrelated) terminology.

---

## 10. Conclusion & Project Deliverable Status

All 15 project phases have been completed and verified:
- [x] **Phase 1: Project Setup (Frontend + Backend + Health Endpoint)**
- [x] **Phase 2: MongoDB Connection & Mongoose Database Models**
- [x] **Phase 3: Recruiter Authentication & JWT Security**
- [x] **Phase 4: Recruiter Dashboard UI & Stats**
- [x] **Phase 5: Job Creation & Management (CRUD)**
- [x] **Phase 6: Multi-file Resume Upload (Multer, PDF & DOCX)**
- [x] **Phase 7: Resume Text Extraction Pipeline**
- [x] **Phase 8: Candidate & Application Management**
- [x] **Phase 9: Python FastAPI AI Microservice Setup**
- [x] **Phase 10: Resume-Job Semantic & Skill Matching Engine**
- [x] **Phase 11: Candidate Ranking, Scoring & Filtering**
- [x] **Phase 12: Explainable AI Match Reasoning & Visual Breakdown**
- [x] **Phase 13: UI/UX Polishing & Modern Recruiter Views**
- [x] **Phase 14: End-to-End System Testing & Validation**
- [x] **Phase 15: Deployment & College Viva Presentation Preparation**
