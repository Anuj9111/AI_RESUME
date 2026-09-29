import re
from typing import List, Optional
from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, Field
from sklearn.feature_extraction.text import TfidfVectorizer
from sklearn.metrics.pairwise import cosine_similarity

app = FastAPI(
    title="AI Resume Screening & Matching Microservice",
    description="Independent NLP and semantic matching engine for explainable resume-job evaluation",
    version="1.0.0"
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

class AnalyzeRequest(BaseModel):
    resume_text: str = Field(..., description="Raw text of candidate resume")
    job_description: str = Field(..., description="Job description and scope")
    required_skills: List[str] = Field(default=[], description="List of mandatory technical skills")
    preferred_skills: List[str] = Field(default=[], description="List of preferred nice-to-have skills")
    required_experience: float = Field(default=0.0, description="Minimum years of required experience")

class AnalyzeResponse(BaseModel):
    match_score: int
    matched_skills: List[str]
    missing_skills: List[str]
    preferred_skills_matched: List[str]
    experience_analysis: str
    education_analysis: str
    project_analysis: str
    explanation: str
    recommendation: str

def compute_semantic_similarity(text1: str, text2: str) -> float:
    """Computes TF-IDF cosine similarity between two text documents."""
    if not text1.strip() or not text2.strip():
        return 0.0
    try:
        vectorizer = TfidfVectorizer(stop_words='english', max_features=5000)
        tfidf_matrix = vectorizer.fit_transform([text1, text2])
        sim = cosine_similarity(tfidf_matrix[0:1], tfidf_matrix[1:2])[0][0]
        return float(sim)
    except Exception as e:
        print(f"Semantic similarity error: {e}")
        return 0.5

def extract_years_of_experience(text: str) -> float:
    """Extracts years of experience mentioned in resume text."""
    exp_patterns = [
        r'(\d+(?:\.\d+)?)\s*(?:\+?\s*(?:years?|yrs?)(?:\s+of)?(?:\s+experience)?)',
        r'(?:experience\s*:\s*)(\d+(?:\.\d+)?)\s*(?:years?|yrs?)'
    ]
    found = []
    for pattern in exp_patterns:
        matches = re.finditer(pattern, text, re.IGNORECASE)
        for m in matches:
            val = float(m.group(1))
            if 0.5 <= val <= 35:
                found.append(val)
    return max(found) if found else 0.0

def detect_education(text: str) -> List[str]:
    """Detects academic credentials present in resume."""
    degrees = [
        'B.Tech', 'B.E.', 'Bachelor of Technology', 'Bachelor of Engineering',
        'M.Tech', 'M.E.', 'Master of Technology',
        'B.Sc', 'M.Sc', 'Bachelor of Science', 'Master of Science',
        'MCA', 'BCA', 'Ph.D', 'PhD', 'MBA'
    ]
    detected = []
    for deg in degrees:
        if re.search(r'\b' + re.escape(deg) + r'\b', text, re.IGNORECASE):
            detected.append(deg)
    return list(set(detected))

@app.get("/")
def read_root():
    return {
        "service": "AI Resume Screening Engine",
        "status": "online",
        "version": "1.0.0"
    }

@app.get("/health")
def health_check():
    return {"status": "ok", "service": "ai-matching-service"}

@app.post("/analyze", response_model=AnalyzeResponse)
def analyze_resume(req: AnalyzeRequest):
    if not req.resume_text.strip():
        raise HTTPException(status_code=400, detail="resume_text cannot be empty")

    resume_clean = req.resume_text
    lower_resume = resume_clean.lower()

    # 1. Skill Matching (Required & Preferred)
    matched_skills = []
    missing_skills = []
    for skill in req.required_skills:
        skill_clean = skill.strip()
        if not skill_clean:
            continue
        # Exact word/phrase boundary search
        escaped = re.escape(skill_clean.lower())
        pattern = r'(?:^|[^a-zA-Z0-9#+])' + escaped + r'(?:$|[^a-zA-Z0-9#+])'
        if re.search(pattern, lower_resume):
            matched_skills.append(skill_clean)
        else:
            missing_skills.append(skill_clean)

    preferred_matched = []
    for skill in req.preferred_skills:
        skill_clean = skill.strip()
        if not skill_clean:
            continue
        escaped = re.escape(skill_clean.lower())
        pattern = r'(?:^|[^a-zA-Z0-9#+])' + escaped + r'(?:$|[^a-zA-Z0-9#+])'
        if re.search(pattern, lower_resume):
            preferred_matched.append(skill_clean)

    # Required skill score (0-100)
    skill_ratio = len(matched_skills) / len(req.required_skills) if req.required_skills else 1.0
    skill_score = skill_ratio * 100

    # 2. Experience Matching
    cand_exp = extract_years_of_experience(resume_clean)
    if req.required_experience > 0:
        if cand_exp >= req.required_experience:
            exp_score = 100
            experience_analysis = f"Candidate has {cand_exp} years of relevant experience, meeting the required threshold of {req.required_experience} years."
        elif cand_exp > 0:
            exp_score = (cand_exp / req.required_experience) * 80
            experience_analysis = f"Candidate shows {cand_exp} years of experience, slightly below the target {req.required_experience} years."
        else:
            exp_score = 50
            experience_analysis = f"Experience duration could not be strictly determined from resume text; manual verification recommended."
    else:
        exp_score = 100
        experience_analysis = f"No minimum experience required for this entry position ({cand_exp} years identified)."

    # 3. Education Matching
    detected_edu = detect_education(resume_clean)
    if detected_edu:
        edu_score = 100
        education_analysis = f"Candidate holds recognized qualification: {', '.join(detected_edu)}."
    else:
        edu_score = 65
        education_analysis = "Specific technical degree acronym was not highlighted in header; profile demonstrates practical competencies."

    # 4. Semantic NLP & Project Matching
    semantic_sim = compute_semantic_similarity(req.job_description, resume_clean)
    semantic_score = min(100, max(20, int(semantic_sim * 100) + 30))

    project_match_count = 0
    for s in matched_skills:
        if s.lower() in lower_resume:
            project_match_count += 1
    project_analysis = (
        f"Candidate demonstrates hands-on usage of {len(matched_skills)} core role technologies across past projects and responsibilities."
        if matched_skills else "Candidate does not highlight project alignment with the required stack."
    )

    # 5. Composite Weighted Match Score (0–100)
    # Weights: Skills (50%), Experience (20%), Education (15%), Semantic NLP (15%)
    # Bonus for preferred skills: up to +5 points
    preferred_bonus = min(5, len(preferred_matched) * 2.5)

    composite = (
        (0.50 * skill_score) +
        (0.20 * exp_score) +
        (0.15 * edu_score) +
        (0.15 * semantic_score) +
        preferred_bonus
    )
    final_score = int(round(min(100, max(0, composite))))

    # 6. Recommendation (Section 9: Human-in-the-loop, AI-assisted)
    if final_score >= 80:
        recommendation = "Strong Match"
    elif final_score >= 50:
        recommendation = "Potential Match"
    else:
        recommendation = "Low Match"

    # 7. Natural Language Explainable Reason (Section 8)
    explanation_parts = []
    if matched_skills:
        explanation_parts.append(f"Candidate demonstrates strong alignment with key required skills ({', '.join(matched_skills[:4])})")
    else:
        explanation_parts.append("Candidate does not demonstrate alignment with the primary required technical stack")

    if missing_skills:
        explanation_parts.append(f"lacks documented proficiency in {', '.join(missing_skills[:3])}")

    if preferred_matched:
        explanation_parts.append(f"offers bonus expertise in {', '.join(preferred_matched[:2])}")

    explanation_parts.append(experience_analysis)
    explanation_parts.append("AI-assisted recommendation for recruiter review.")

    explanation = ". ".join(explanation_parts)

    return AnalyzeResponse(
        match_score=final_score,
        matched_skills=matched_skills,
        missing_skills=missing_skills,
        preferred_skills_matched=preferred_matched,
        experience_analysis=experience_analysis,
        education_analysis=education_analysis,
        project_analysis=project_analysis,
        explanation=explanation,
        recommendation=recommendation
    )
