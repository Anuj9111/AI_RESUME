# Production Deployment Guide: AI Resume Screening System

This guide outlines the complete, step-by-step procedure to deploy the **AI-Based Resume Screening and Candidate Shortlisting System** to the cloud using **MongoDB Atlas**, **Render** (or **Railway**), and **GitHub**.

---

## Architecture Overview

In this unified full-stack deployment:
1. **Full-Stack Web Service (`web`)**: Node.js + Express backend serving both the REST API (`/api/*`) and the compiled React (Vite + Tailwind CSS v4) frontend as static single-page application assets.
2. **AI Microservice (`ai-service`)**: Python FastAPI microservice providing TF-IDF semantic resume-job similarity and explainable matching.
3. **Database**: MongoDB Atlas M0 (Free Forever Cloud Cluster).

```
                      ┌──────────────────────────────────────┐
                      │            User / Browser            │
                      └──────────────────┬───────────────────┘
                                         │ HTTPS
                      ┌──────────────────▼───────────────────┐
                      │   ai-resume-screener-web (Render)    │
                      │   • Express REST API                 │
                      │   • Serves compiled React Frontend   │
                      └──────────┬───────────────────┬───────┘
                                 │                   │
                        Mongoose │                   │ HTTP POST /analyze
                                 │                   │
         ┌───────────────────────▼──────┐    ┌───────▼──────────────────────┐
         │     MongoDB Atlas (Cloud)    │    │ ai-resume-screener-ai (Render)│
         │     Cluster M0 Free Tier     │    │ FastAPI NLP Semantic Engine  │
         └──────────────────────────────┘    └──────────────────────────────┘
```

---

## Step 1: Set Up Free MongoDB Atlas Database (3 Minutes)

1. Go to [MongoDB Atlas](https://www.mongodb.com/cloud/atlas) and Sign In / Register.
2. Click **Create a Deployment** -> Select **M0 (Free)**.
3. Choose your preferred cloud provider (AWS / Google Cloud) and region closest to your users.
4. Set up authentication:
   - **Username**: e.g., `resume_admin`
   - **Password**: (Generate a strong password and save it)
5. **Network Access**:
   - Go to **Network Access** in the left sidebar.
   - Click **Add IP Address** -> Select **Allow Access From Anywhere** (`0.0.0.0/0`).
   - Click **Confirm**. (Required so cloud hosting providers like Render/Railway can connect).
6. **Get Connection String**:
   - Go to **Database** -> Click **Connect** on your cluster.
   - Choose **Drivers** (Node.js).
   - Copy the URI, which looks like:
     ```text
     mongodb+srv://resume_admin:<password>@cluster0.xyz.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0
     ```
   - Replace `<password>` with your database user password and append the database name `/ai-resume-screener` before the `?`:
     ```text
     mongodb+srv://resume_admin:YOUR_PASSWORD@cluster0.xyz.mongodb.net/ai-resume-screener?retryWrites=true&w=majority
     ```

---

## Step 2: Push Your Repository to GitHub

Ensure all deployment configurations are committed and pushed:

```bash
# Stage changes
git add .

# Commit changes
git commit -m "feat: configure full-stack production build, Render blueprint and Dockerfile"

# Push to your GitHub repository
git push origin main
```

*(If you haven't linked a remote GitHub repository yet, create a new repo on GitHub and run:)*
```bash
git remote add origin https://github.com/YOUR_USERNAME/AI-Resume-Screener.git
git branch -M main
git push -u origin main
```

---

## Step 3: Deploy to Render (Recommended - Free Tier)

Render can deploy both services automatically via the included [`render.yaml`](./render.yaml) Blueprint, or manually.

### Method A: One-Click Blueprint (Easiest)

1. Log in to [Render](https://dashboard.render.com/).
2. Click **New +** -> **Blueprint**.
3. Connect your GitHub repository.
4. Render will read [`render.yaml`](./render.yaml) and display two services:
   - `ai-resume-screener-web` (Web Service, Node)
   - `ai-resume-screener-ai` (Web Service, Python)
5. Under `ai-resume-screener-web`, fill in the prompted variable:
   - **`MONGODB_URI`**: Paste your MongoDB Atlas connection string from Step 1.
6. Click **Apply**. Render will automatically provision and deploy both services!

---

### Method B: Manual Service Creation

If you prefer configuring services manually in the Render dashboard:

#### 1. Deploy the AI Microservice First
- Click **New +** -> **Web Service**.
- Select your GitHub repo.
- **Name**: `ai-resume-screener-ai`
- **Root Directory**: `ai-service`
- **Environment**: `Python 3`
- **Build Command**: `pip install -r requirements.txt`
- **Start Command**: `uvicorn main:app --host 0.0.0.0 --port $PORT`
- **Plan**: `Free`
- Click **Deploy Web Service**.
- Copy the public service URL (e.g., `https://ai-resume-screener-ai.onrender.com`).

#### 2. Deploy the Full-Stack Web Service
- Click **New +** -> **Web Service**.
- Select your GitHub repo.
- **Name**: `ai-resume-screener-web`
- **Root Directory**: *(Leave empty / root)*
- **Environment**: `Node`
- **Build Command**: `npm run build`
- **Start Command**: `npm start`
- **Plan**: `Free`
- Add **Environment Variables**:
  | Key | Value | Description |
  | :--- | :--- | :--- |
  | `NODE_ENV` | `production` | Production mode |
  | `MONGODB_URI` | `mongodb+srv://...` | Your MongoDB Atlas connection string |
  | `JWT_SECRET` | *random 32+ char string* | Secret key for JWT tokens |
  | `AI_SERVICE_URL` | `https://ai-resume-screener-ai.onrender.com` | URL of the Python service created above |
- Click **Deploy Web Service**.

---

## Step 4: Verify Your Live Deployment

Once the build is complete:
1. Open the URL provided by Render for `ai-resume-screener-web` (e.g. `https://ai-resume-screener-web.onrender.com`).
2. **Health Check**: Visit `https://your-app.onrender.com/api/health` to confirm the database and API are healthy:
   ```json
   {
     "success": true,
     "message": "AI Resume Screener API is healthy",
     "timestamp": "...",
     "database": { "status": "connected" }
   }
   ```
3. **Register/Login**: Navigate to `/register` in your browser and create a recruiter account.
4. **Create a Job**: Add a job posting with technical skills and experience criteria.
5. **Upload Resumes**: Upload candidate resumes in PDF format and inspect real-time AI scoring and breakdown!

---

## Alternative: Deploy with Docker Compose / Railway

The project includes a ready-to-use [`Dockerfile`](./Dockerfile), [`ai-service/Dockerfile`](./ai-service/Dockerfile), and [`docker-compose.yml`](./docker-compose.yml):

### For Local Containerized Testing:
```bash
docker compose up --build
```
- Web Application: `http://localhost:5000`
- AI Microservice: `http://localhost:8000`

### For Railway:
1. Go to [Railway.app](https://railway.app/).
2. Select **New Project** -> **Deploy from GitHub repo**.
3. Add MongoDB plugin or provide your MongoDB Atlas URI.
4. Deploy the root `Dockerfile` and `ai-service/Dockerfile`.

---

## Important Free Tier Notes

> [!NOTE]
> **Free Tier Cold Starts**: Render puts free services to sleep after 15 minutes of inactivity. When visiting the site after an idle period, the first request may take 30–50 seconds while the container spins up. Subsequent requests respond instantly.
>
> **Graceful AI Fallback**: If the Python microservice is still spinning up, the Node.js backend automatically uses its embedded NLP fallback engine to ensure resume parsing and candidate scoring never fail.
