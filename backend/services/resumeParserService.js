const fs = require('fs');
const path = require('path');
const pdfParse = require('pdf-parse');
const mammoth = require('mammoth');

// Comprehensive technical skill taxonomy for accurate parsing without hallucinations
const TECHNICAL_SKILLS_DICTIONARY = [
  // Programming Languages
  'javascript', 'typescript', 'python', 'java', 'c++', 'c#', 'c', 'go', 'golang', 'rust', 'ruby', 'php', 'swift', 'kotlin', 'dart', 'scala', 'r',
  // Frontend
  'react', 'react.js', 'reactjs', 'vue', 'vue.js', 'angular', 'svelte', 'next.js', 'nextjs', 'nuxt.js', 'html', 'html5', 'css', 'css3', 'tailwind', 'tailwind css', 'bootstrap', 'sass', 'redux', 'zustand', 'webpack', 'vite',
  // Backend & APIs
  'node.js', 'nodejs', 'express', 'express.js', 'fastapi', 'flask', 'django', 'spring boot', 'spring', 'nest.js', 'nestjs', 'graphql', 'rest api', 'restful api', 'grpc', 'microservices',
  // Databases
  'mongodb', 'postgresql', 'postgres', 'mysql', 'sqlite', 'redis', 'elasticsearch', 'cassandra', 'dynamodb', 'oracle', 'firebase', 'supabase', 'prisma', 'mongoose',
  // Cloud & DevOps
  'aws', 'amazon web services', 'azure', 'google cloud', 'gcp', 'docker', 'kubernetes', 'k8s', 'terraform', 'ansible', 'jenkins', 'git', 'github', 'gitlab', 'ci/cd', 'linux', 'bash', 'nginx', 'apache',
  // AI / ML / Data Science
  'machine learning', 'deep learning', 'artificial intelligence', 'nlp', 'natural language processing', 'computer vision', 'pytorch', 'tensorflow', 'keras', 'scikit-learn', 'pandas', 'numpy', 'opencv', 'llm', 'langchain', 'hugging face', 'transformers',
  // Architecture & Practices
  'agile', 'scrum', 'system design', 'unit testing', 'jest', 'cypress', 'mocha'
];

/**
 * Extract raw text from PDF or DOCX file
 * @param {string} filePath - Path to file on disk
 * @param {string} originalName - Original filename
 * @returns {Promise<string>}
 */
const extractRawText = async (filePath, originalName) => {
  const ext = path.extname(originalName || filePath).toLowerCase();

  try {
    if (ext === '.pdf') {
      const dataBuffer = fs.readFileSync(filePath);
      if (pdfParse.PDFParse) {
        const parser = new pdfParse.PDFParse({ data: dataBuffer });
        const result = await parser.getText();
        return result.text || '';
      } else if (typeof pdfParse === 'function') {
        const pdfData = await pdfParse(dataBuffer);
        return pdfData.text || '';
      } else {
        throw new Error('PDF parsing library interface not recognized');
      }
    } else if (ext === '.docx' || ext === '.doc') {
      const result = await mammoth.extractRawText({ path: filePath });
      return result.value || '';
    } else {
      throw new Error(`Unsupported file extension: ${ext}`);
    }
  } catch (error) {
    console.error(`Error reading ${filePath}:`, error.message);
    throw new Error(`Failed to extract text from ${originalName}: ${error.message}`);
  }
};

/**
 * Extract structured information from raw resume text
 * @param {string} text - Raw extracted resume text
 * @param {string} fallbackFileName - Used if name cannot be inferred
 * @returns {object} Extracted candidate entities
 */
const extractCandidateEntities = (text, fallbackFileName = '') => {
  const cleanText = text.replace(/\r/g, '\n').replace(/\t/g, ' ');
  const lines = cleanText
    .split('\n')
    .map(line => line.trim())
    .filter(line => line.length > 0);

  // 1. Extract Email
  const emailRegex = /\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Z|a-z]{2,}\b/i;
  const emailMatch = cleanText.match(emailRegex);
  const email = emailMatch ? emailMatch[0].toLowerCase() : '';

  // 2. Extract Phone Number
  const phoneRegex = /(?:(?:\+?\d{1,3}[-.\s]?)?\(?\d{3}\)?[-.\s]?\d{3}[-.\s]?\d{4}|\+?\d{10,12})/g;
  const phoneMatches = cleanText.match(phoneRegex);
  let phone = '';
  if (phoneMatches && phoneMatches.length > 0) {
    // Pick the phone candidate with digits between 10 and 15
    const validPhone = phoneMatches.find(p => {
      const digitsOnly = p.replace(/\D/g, '');
      return digitsOnly.length >= 10 && digitsOnly.length <= 15;
    });
    phone = validPhone ? validPhone.trim() : phoneMatches[0].trim();
  }

  // 3. Extract Candidate Name
  let name = '';
  const nonNamePatterns = [
    /curriculum\s+vitae/i,
    /resume/i,
    /contact/i,
    /profile/i,
    /summary/i,
    /@/,
    /http/i,
    /www\./i,
    /phone/i,
    /email/i,
    /page\s+\d/i,
    /\+?\d{10}/
  ];

  // Inspect first 8 non-empty lines for candidate name
  for (let i = 0; i < Math.min(lines.length, 8); i++) {
    const line = lines[i];
    const isExcluded = nonNamePatterns.some(pattern => pattern.test(line));

    if (!isExcluded && line.length >= 3 && line.length <= 40) {
      // Must contain mostly letters
      const letterCount = (line.match(/[a-zA-Z]/g) || []).length;
      if (letterCount / line.length > 0.7 && !line.includes(':')) {
        name = line.replace(/[^a-zA-Z\s.-]/g, '').trim();
        break;
      }
    }
  }

  // Fallback to filename if no reliable name line found
  if (!name && fallbackFileName) {
    name = path.parse(fallbackFileName).name
      .replace(/[-_]/g, ' ')
      .replace(/resume|cv/gi, '')
      .trim();
  }
  if (!name) name = 'Candidate';

  // 4. Extract Technical Skills
  const lowerText = cleanText.toLowerCase();
  const matchedSkillsSet = new Set();

  TECHNICAL_SKILLS_DICTIONARY.forEach(skill => {
    // Exact word boundary regex
    const escaped = skill.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    const regex = new RegExp(`(?:^|[^a-zA-Z0-9#+])${escaped}(?:$|[^a-zA-Z0-9#+])`, 'i');
    if (regex.test(lowerText)) {
      // Format proper casing
      const formatted = skill
        .split(' ')
        .map(w => w.charAt(0).toUpperCase() + w.slice(1))
        .join(' ');
      matchedSkillsSet.add(formatted);
    }
  });

  const skills = Array.from(matchedSkillsSet);

  // 5. Extract Education Information
  const educationDegrees = [
    'B.Tech', 'B.E.', 'Bachelor of Technology', 'Bachelor of Engineering',
    'M.Tech', 'M.E.', 'Master of Technology',
    'B.Sc', 'M.Sc', 'Bachelor of Science', 'Master of Science',
    'BCA', 'MCA', 'Bachelor of Computer Applications', 'Master of Computer Applications',
    'Ph.D', 'PhD', 'Doctorate', 'MBA'
  ];

  const education = [];
  educationDegrees.forEach(deg => {
    const degRegex = new RegExp(`\\b${deg.replace('.', '\\.')}\\b`, 'i');
    if (degRegex.test(cleanText)) {
      education.push({
        degree: deg,
        college: 'Extracted from Resume Credentials',
        year: ''
      });
    }
  });

  // 6. Estimate Years of Experience
  let yearsOfExperience = 0;
  // Look for patterns like "3.5 years of experience", "5+ years", etc.
  const expRegex = /(\d+(?:\.\d+)?)\s*(?:\+?\s*(?:years?|yrs?)(?:\s+of)?(?:\s+experience)?)/gi;
  let expMatch;
  const foundYears = [];
  while ((expMatch = expRegex.exec(cleanText)) !== null) {
    const val = parseFloat(expMatch[1]);
    if (val >= 0.5 && val <= 35) {
      foundYears.push(val);
    }
  }

  if (foundYears.length > 0) {
    yearsOfExperience = Math.max(...foundYears);
  }

  // 7. Extract Project keywords
  const projects = [];
  const projectSectionRegex = /(?:projects|academic projects|key projects)([\s\S]*?)(?:experience|education|certifications|skills|$)/i;
  const projectMatch = cleanText.match(projectSectionRegex);
  if (projectMatch && projectMatch[1]) {
    const projectLines = projectMatch[1]
      .split('\n')
      .map(l => l.trim())
      .filter(l => l.length > 5 && l.length < 80 && !l.startsWith('http'))
      .slice(0, 4);

    projectLines.forEach((line) => {
      projects.push({
        title: line.replace(/^[•\-\*]\s*/, ''),
        description: 'Candidate project extracted from resume',
        technologies: skills.slice(0, 3)
      });
    });
  }

  // 8. Extract Certifications
  const certifications = [];
  const certKeywords = ['AWS Certified', 'Google Cloud Certified', 'Azure Certified', 'PMP', 'Scrum Master', 'Certified Kubernetes', 'Meta Certified'];
  certKeywords.forEach(cert => {
    if (new RegExp(cert, 'i').test(cleanText)) {
      certifications.push(cert);
    }
  });

  return {
    name,
    email,
    phone,
    skills,
    education,
    yearsOfExperience,
    projects,
    certifications
  };
};

module.exports = {
  extractRawText,
  extractCandidateEntities
};
