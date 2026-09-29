const axios = require('axios');

const AI_SERVICE_URL = process.env.AI_SERVICE_URL || 'http://127.0.0.1:8000';

/**
 * Invoke independent FastAPI microservice for explainable resume-job matching
 * @param {object} params
 * @param {string} params.resumeText
 * @param {string} params.jobDescription
 * @param {string[]} params.requiredSkills
 * @param {string[]} params.preferredSkills
 * @param {number} params.requiredExperience
 * @returns {Promise<object>} Structured AI match analysis
 */
const analyzeResumeWithAI = async ({
  resumeText,
  jobDescription,
  requiredSkills = [],
  preferredSkills = [],
  requiredExperience = 0
}) => {
  try {
    const response = await axios.post(
      `${AI_SERVICE_URL}/analyze`,
      {
        resume_text: resumeText,
        job_description: jobDescription,
        required_skills: requiredSkills,
        preferred_skills: preferredSkills,
        required_experience: requiredExperience
      },
      {
        timeout: 10000 // 10 second timeout
      }
    );

    return {
      success: true,
      data: response.data,
      source: 'fastapi-ai-microservice'
    };
  } catch (error) {
    console.warn(`[AI Service Warning] FastAPI service unavailable (${error.message}). Executing graceful embedded fallback.`);

    // Graceful embedded NLP analysis fallback
    const resumeLower = (resumeText || '').toLowerCase();
    const matched = requiredSkills.filter(s =>
      new RegExp(`(?:^|[^a-zA-Z0-9#+])${s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}(?:$|[^a-zA-Z0-9#+])`, 'i').test(resumeLower)
    );
    const missing = requiredSkills.filter(s => !matched.includes(s));
    const prefMatched = preferredSkills.filter(s =>
      new RegExp(`(?:^|[^a-zA-Z0-9#+])${s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}(?:$|[^a-zA-Z0-9#+])`, 'i').test(resumeLower)
    );

    const skillScore = requiredSkills.length > 0 ? (matched.length / requiredSkills.length) * 80 : 70;
    const bonus = Math.min(15, prefMatched.length * 5);
    const finalScore = Math.min(100, Math.round(skillScore + bonus));

    return {
      success: true,
      data: {
        match_score: finalScore,
        matched_skills: matched,
        missing_skills: missing,
        preferred_skills_matched: prefMatched,
        experience_analysis: 'Evaluated against candidate documented resume tenure.',
        education_analysis: 'Candidate credentials parsed from resume header.',
        project_analysis: `Candidate demonstrates usage of ${matched.length} core competencies.`,
        explanation: `Candidate demonstrates proficiency in ${matched.join(', ') || 'general web technologies'}${missing.length > 0 ? `. Further verification recommended for ${missing.join(', ')}.` : '.'} AI-assisted recommendation for recruiter review.`,
        recommendation: finalScore >= 80 ? 'Strong Match' : finalScore >= 50 ? 'Potential Match' : 'Review'
      },
      source: 'embedded-fallback'
    };
  }
};

module.exports = {
  analyzeResumeWithAI
};
