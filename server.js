const express = require('express');
const cors = require('cors');
const multer = require('multer');
const bcrypt = require('bcryptjs');
const path = require('path');
const fs = require('fs');

const app = express();
const PORT = process.env.PORT || 3000;
const ROOT = __dirname;
const DATA_DIR = path.join(ROOT, 'data');
const PUBLIC_DIR = path.join(ROOT, 'public');
const UPLOAD_DIR = path.join(ROOT, 'uploads', 'resumes');

const DATA_FILES = {
  users: path.join(DATA_DIR, 'users.json'),
  jobs: path.join(DATA_DIR, 'jobs.json'),
  candidates: path.join(DATA_DIR, 'candidates.json'),
  ats: path.join(DATA_DIR, 'ats_scores.json'),
  shortlisted: path.join(DATA_DIR, 'shortlisted.json'),
  interviews: path.join(DATA_DIR, 'interviews.json'),
  logs: path.join(DATA_DIR, 'activity_logs.json'),
  settings: path.join(DATA_DIR, 'settings.json')
};

function ensureDirectories() {
  [DATA_DIR, PUBLIC_DIR, UPLOAD_DIR].forEach((dir) => {
    if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
  });
}

function readJson(file, fallback = []) {
  try {
    if (!fs.existsSync(file)) {
      writeJson(file, fallback);
      return fallback;
    }
    const raw = fs.readFileSync(file, 'utf8');
    return raw.trim() ? JSON.parse(raw) : fallback;
  } catch (error) {
    console.error(`Failed to read ${file}:`, error.message);
    return fallback;
  }
}

function writeJson(file, value) {
  fs.writeFileSync(file, JSON.stringify(value, null, 2), 'utf8');
}

function nowIso() {
  return new Date().toISOString();
}

function makeId(prefix) {
  return `${prefix}-${Date.now()}-${Math.floor(Math.random() * 9999)}`;
}

function cleanText(value) {
  if (value === undefined || value === null) return '';
  return String(value).trim();
}

function cleanArray(value) {
  if (Array.isArray(value)) return value.map(cleanText).filter(Boolean);
  if (!value) return [];
  return String(value)
    .split(',')
    .map((item) => item.trim())
    .filter(Boolean);
}

function safeNumber(value, fallback = 0) {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : fallback;
}

function logActivity(action, details = {}) {
  const logs = readJson(DATA_FILES.logs, []);
  logs.unshift({ id: makeId('LOG'), action, details, createdAt: nowIso() });
  writeJson(DATA_FILES.logs, logs.slice(0, 500));
}

async function normaliseSeedUsers() {
  const users = readJson(DATA_FILES.users, []);
  let changed = false;
  for (const user of users) {
    if (user.password && !user.passwordHash) {
      user.passwordHash = await bcrypt.hash(user.password, 10);
      delete user.password;
      changed = true;
    }
  }
  if (changed) writeJson(DATA_FILES.users, users);
}

function publicUser(user) {
  if (!user) return null;
  const { password, passwordHash, ...safe } = user;
  return safe;
}

function tokenizeText(text) {
  return cleanText(text)
    .toLowerCase()
    .replace(/[^a-z0-9#+.\s-]/g, ' ')
    .split(/[,\s/|]+/)
    .map((item) => item.trim())
    .filter(Boolean);
}

function unique(values) {
  return [...new Set(values.filter(Boolean))];
}

function calculateAts(candidate, job, settings) {
  const weights = settings.atsWeights || { skills: 50, experience: 25, education: 15, projects: 10 };
  const requiredSkills = cleanArray(job.skills).map((item) => item.toLowerCase());
  const candidateSkills = cleanArray(candidate.skills).map((item) => item.toLowerCase());
  const matchedSkillsLower = requiredSkills.filter((skill) => candidateSkills.includes(skill));
  const missingSkillsLower = requiredSkills.filter((skill) => !candidateSkills.includes(skill));
  const originalSkillMap = new Map(cleanArray(job.skills).map((skill) => [skill.toLowerCase(), skill]));

  const skillScore = requiredSkills.length ? (matchedSkillsLower.length / requiredSkills.length) * weights.skills : 0;

  const jobExperienceText = cleanText(job.experience).toLowerCase();
  const candidateExpYears = safeNumber(candidate.totalExperienceYears, 0);
  let expScore = 0;
  const numbers = (jobExperienceText.match(/\d+/g) || []).map(Number);
  if (numbers.length >= 2) {
    expScore = candidateExpYears >= numbers[0] && candidateExpYears <= numbers[1] + 1 ? weights.experience : weights.experience * 0.45;
  } else if (numbers.length === 1) {
    expScore = candidateExpYears >= numbers[0] ? weights.experience : weights.experience * 0.45;
  } else {
    expScore = candidateExpYears > 0 ? weights.experience * 0.7 : weights.experience * 0.3;
  }

  const qualificationText = JSON.stringify(candidate.education || []).toLowerCase();
  const jobQualificationText = cleanArray(job.qualifications).join(' ').toLowerCase();
  const eduTokens = tokenizeText(jobQualificationText).filter((token) => token.length > 2);
  const eduMatches = eduTokens.filter((token) => qualificationText.includes(token));
  const educationScore = eduTokens.length ? Math.min(weights.education, (eduMatches.length / Math.min(eduTokens.length, 8)) * weights.education) : weights.education * 0.5;

  const projectText = JSON.stringify(candidate.projects || []).toLowerCase();
  const projectMatches = requiredSkills.filter((skill) => projectText.includes(skill));
  const projectScore = requiredSkills.length ? Math.min(weights.projects, (projectMatches.length / requiredSkills.length) * weights.projects) : weights.projects * 0.4;

  const finalScore = Math.round(skillScore + expScore + educationScore + projectScore);
  const recommendation = finalScore >= (settings.scoreRules?.strongMatch || 80)
    ? 'Strong Match'
    : finalScore >= (settings.scoreRules?.goodMatch || 65)
      ? 'Good Match'
      : finalScore >= (settings.scoreRules?.averageMatch || 50)
        ? 'Average Match'
        : 'Not Recommended';

  return {
    score: Math.min(100, Math.max(0, finalScore)),
    matchedSkills: matchedSkillsLower.map((skill) => originalSkillMap.get(skill) || skill),
    missingSkills: missingSkillsLower.map((skill) => originalSkillMap.get(skill) || skill),
    skillScore: Math.round(skillScore),
    experienceScore: Math.round(expScore),
    educationScore: Math.round(educationScore),
    projectScore: Math.round(projectScore),
    recommendation,
    reason: `${matchedSkillsLower.length} of ${requiredSkills.length} required skills matched. Experience, education, and project relevance were also evaluated.`
  };
}

ensureDirectories();
app.use(cors());
app.use(express.json({ limit: '2mb' }));
app.use(express.urlencoded({ extended: true }));
app.use('/uploads', express.static(path.join(ROOT, 'uploads')));
app.use(express.static(PUBLIC_DIR));

const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, UPLOAD_DIR),
  filename: (req, file, cb) => {
    const ext = path.extname(file.originalname).toLowerCase();
    const base = path.basename(file.originalname, ext).replace(/[^a-z0-9-_]+/gi, '-').toLowerCase();
    cb(null, `${Date.now()}-${base}${ext}`);
  }
});

const upload = multer({
  storage,
  limits: { fileSize: 10 * 1024 * 1024 },
  fileFilter: (req, file, cb) => {
    const allowed = ['.pdf', '.doc', '.docx'];
    const ext = path.extname(file.originalname).toLowerCase();
    if (!allowed.includes(ext)) return cb(new Error('Only PDF, DOC and DOCX files are allowed.'));
    cb(null, true);
  }
});

app.get('/api/health', (req, res) => {
  res.json({ ok: true, app: 'AI HR Assistant', storage: 'JSON + folders', time: nowIso() });
});

app.post('/api/signup', async (req, res) => {
  const users = readJson(DATA_FILES.users, []);
  const fullName = cleanText(req.body.fullName);
  const email = cleanText(req.body.email).toLowerCase();
  const password = cleanText(req.body.password);
  if (!fullName || !email || !password) return res.status(400).json({ message: 'Full name, email and password are required.' });
  if (users.some((u) => cleanText(u.email).toLowerCase() === email)) return res.status(409).json({ message: 'Email already exists.' });
  const user = {
    id: makeId('USR'),
    fullName,
    email,
    passwordHash: await bcrypt.hash(password, 10),
    role: cleanText(req.body.role) || 'HR',
    status: 'Active',
    createdAt: nowIso()
  };
  users.push(user);
  writeJson(DATA_FILES.users, users);
  logActivity('SIGNUP', { email });
  res.status(201).json({ message: 'Account created successfully.', user: publicUser(user) });
});

app.post('/api/login', async (req, res) => {
  const users = readJson(DATA_FILES.users, []);
  const email = cleanText(req.body.email).toLowerCase();
  const password = cleanText(req.body.password);
  const user = users.find((u) => cleanText(u.email).toLowerCase() === email && u.status !== 'Inactive');
  if (!user) return res.status(401).json({ message: 'Invalid email or password.' });
  const passwordOk = user.passwordHash ? await bcrypt.compare(password, user.passwordHash) : password === user.password;
  if (!passwordOk) return res.status(401).json({ message: 'Invalid email or password.' });
  const token = Buffer.from(`${user.id}:${Date.now()}`).toString('base64');
  logActivity('LOGIN', { email });
  res.json({ message: 'Login successful.', token, user: publicUser(user) });
});

app.get('/api/dashboard-summary', (req, res) => {
  const jobs = readJson(DATA_FILES.jobs, []);
  const candidates = readJson(DATA_FILES.candidates, []);
  const ats = readJson(DATA_FILES.ats, []);
  const shortlisted = readJson(DATA_FILES.shortlisted, []);
  const interviews = readJson(DATA_FILES.interviews, []);
  res.json({
    totalJobs: jobs.length,
    publishedJobs: jobs.filter((j) => j.status === 'Published').length,
    draftJobs: jobs.filter((j) => j.status === 'Draft').length,
    totalCandidates: candidates.length,
    atsCompleted: ats.length,
    shortlisted: shortlisted.length,
    interviews: interviews.length,
    recentJobs: jobs.slice(-5).reverse(),
    recentCandidates: candidates.slice(-5).reverse(),
    recentAts: ats.slice(-5).reverse()
  });
});

app.get('/api/jobs', (req, res) => res.json(readJson(DATA_FILES.jobs, [])));

app.get('/api/jobs/:id', (req, res) => {
  const job = readJson(DATA_FILES.jobs, []).find((item) => item.id === req.params.id);
  if (!job) return res.status(404).json({ message: 'Job not found.' });
  res.json(job);
});

function buildJobPayload(body, oldJob = {}) {
  const jobTitle = cleanText(body.jobTitle);
  const department = cleanText(body.department);
  const experience = cleanText(body.experience);
  const employmentType = cleanText(body.employmentType);
  const skills = cleanArray(body.skills);
  const responsibilities = cleanArray(body.responsibilities);
  const qualifications = cleanArray(body.qualifications);
  const generatedDescription = cleanText(body.generatedDescription) || generateJobDescription({ jobTitle, department, experience, employmentType, skills, responsibilities, qualifications, location: body.location, workMode: body.workMode, salaryRange: body.salaryRange });
  return {
    ...oldJob,
    jobTitle,
    department,
    experience,
    employmentType,
    location: cleanText(body.location),
    workMode: cleanText(body.workMode),
    salaryRange: cleanText(body.salaryRange),
    openings: safeNumber(body.openings, 1),
    qualifications,
    skills,
    responsibilities,
    generatedDescription,
    status: cleanText(body.status) || 'Draft',
    updatedAt: nowIso()
  };
}

function generateJobDescription(job) {
  const skillText = cleanArray(job.skills).join(', ') || 'relevant technical skills';
  const respText = cleanArray(job.responsibilities).map((r) => `• ${r}`).join('\n') || '• Deliver assigned responsibilities with quality and ownership';
  const qualText = cleanArray(job.qualifications).map((q) => `• ${q}`).join('\n') || '• Relevant education and experience';
  return `We are hiring a ${cleanText(job.jobTitle) || 'suitable professional'} for the ${cleanText(job.department) || 'respective'} department. This is a ${cleanText(job.employmentType) || 'full-time'} role with ${cleanText(job.experience) || 'relevant'} experience requirement.\n\nLocation: ${cleanText(job.location) || 'To be discussed'}\nWork Mode: ${cleanText(job.workMode) || 'To be discussed'}\nSalary Range: ${cleanText(job.salaryRange) || 'As per company standards'}\n\nRequired Skills:\n${skillText}\n\nQualifications:\n${qualText}\n\nKey Responsibilities:\n${respText}\n\nThe candidate should be proactive, detail-oriented, collaborative, and capable of delivering high-quality work within timelines.`;
}

app.post('/api/jobs/generate-description', (req, res) => res.json({ generatedDescription: generateJobDescription(req.body) }));

app.post('/api/jobs', (req, res) => {
  const jobs = readJson(DATA_FILES.jobs, []);
  const payload = buildJobPayload(req.body);
  if (!payload.jobTitle || !payload.department) return res.status(400).json({ message: 'Job title and department are required.' });
  const job = { id: makeId('JOB'), ...payload, createdBy: cleanText(req.body.createdBy) || 'USR-1001', createdAt: nowIso() };
  jobs.push(job);
  writeJson(DATA_FILES.jobs, jobs);
  logActivity('JOB_CREATED', { jobId: job.id, jobTitle: job.jobTitle });
  res.status(201).json(job);
});

app.put('/api/jobs/:id', (req, res) => {
  const jobs = readJson(DATA_FILES.jobs, []);
  const index = jobs.findIndex((job) => job.id === req.params.id);
  if (index === -1) return res.status(404).json({ message: 'Job not found.' });
  jobs[index] = buildJobPayload(req.body, jobs[index]);
  writeJson(DATA_FILES.jobs, jobs);
  logActivity('JOB_UPDATED', { jobId: req.params.id });
  res.json(jobs[index]);
});

app.delete('/api/jobs/:id', (req, res) => {
  const jobs = readJson(DATA_FILES.jobs, []);
  const filtered = jobs.filter((job) => job.id !== req.params.id);
  if (filtered.length === jobs.length) return res.status(404).json({ message: 'Job not found.' });
  writeJson(DATA_FILES.jobs, filtered);
  logActivity('JOB_DELETED', { jobId: req.params.id });
  res.json({ message: 'Job deleted successfully.' });
});

app.post('/api/upload-resume', (req, res) => {
  upload.single('resume')(req, res, (error) => {
    if (error) return res.status(400).json({ message: error.message });
    if (!req.file) return res.status(400).json({ message: 'Resume file is required.' });
    const relativePath = `/uploads/resumes/${req.file.filename}`;
    logActivity('RESUME_UPLOADED', { file: relativePath });
    res.status(201).json({ message: 'Resume uploaded successfully.', fileName: req.file.filename, filePath: relativePath, originalName: req.file.originalname, size: req.file.size });
  });
});

app.get('/api/candidates', (req, res) => res.json(readJson(DATA_FILES.candidates, [])));

app.get('/api/candidates/:id', (req, res) => {
  const candidate = readJson(DATA_FILES.candidates, []).find((item) => item.id === req.params.id);
  if (!candidate) return res.status(404).json({ message: 'Candidate not found.' });
  res.json(candidate);
});

function buildCandidatePayload(body, oldCandidate = {}) {
  return {
    ...oldCandidate,
    fullName: cleanText(body.fullName),
    email: cleanText(body.email),
    phone: cleanText(body.phone),
    location: cleanText(body.location),
    appliedJobId: cleanText(body.appliedJobId),
    resumeFile: cleanText(body.resumeFile || oldCandidate.resumeFile),
    skills: cleanArray(body.skills),
    totalExperienceYears: safeNumber(body.totalExperienceYears, 0),
    education: Array.isArray(body.education) ? body.education : [],
    experience: Array.isArray(body.experience) ? body.experience : [],
    projects: Array.isArray(body.projects) ? body.projects : [],
    links: body.links || {},
    status: cleanText(body.status) || oldCandidate.status || 'Uploaded',
    updatedAt: nowIso()
  };
}

app.post('/api/candidates', (req, res) => {
  const candidates = readJson(DATA_FILES.candidates, []);
  const payload = buildCandidatePayload(req.body);
  if (!payload.fullName || !payload.email || !payload.appliedJobId) return res.status(400).json({ message: 'Full name, email and applied job are required.' });
  const candidate = { id: makeId('CAND'), ...payload, createdAt: nowIso() };
  candidates.push(candidate);
  writeJson(DATA_FILES.candidates, candidates);
  logActivity('CANDIDATE_CREATED', { candidateId: candidate.id, fullName: candidate.fullName });
  res.status(201).json(candidate);
});

app.put('/api/candidates/:id', (req, res) => {
  const candidates = readJson(DATA_FILES.candidates, []);
  const index = candidates.findIndex((candidate) => candidate.id === req.params.id);
  if (index === -1) return res.status(404).json({ message: 'Candidate not found.' });
  candidates[index] = buildCandidatePayload(req.body, candidates[index]);
  writeJson(DATA_FILES.candidates, candidates);
  logActivity('CANDIDATE_UPDATED', { candidateId: req.params.id });
  res.json(candidates[index]);
});

app.delete('/api/candidates/:id', (req, res) => {
  const candidates = readJson(DATA_FILES.candidates, []);
  const filtered = candidates.filter((candidate) => candidate.id !== req.params.id);
  if (filtered.length === candidates.length) return res.status(404).json({ message: 'Candidate not found.' });
  writeJson(DATA_FILES.candidates, filtered);
  logActivity('CANDIDATE_DELETED', { candidateId: req.params.id });
  res.json({ message: 'Candidate deleted successfully.' });
});

app.post('/api/screen-candidate', (req, res) => {
  const candidates = readJson(DATA_FILES.candidates, []);
  const jobs = readJson(DATA_FILES.jobs, []);
  const settings = readJson(DATA_FILES.settings, {});
  const candidate = candidates.find((item) => item.id === req.body.candidateId);
  const job = jobs.find((item) => item.id === req.body.jobId);
  if (!candidate || !job) return res.status(404).json({ message: 'Candidate or job not found.' });
  const result = calculateAts(candidate, job, settings);
  const atsList = readJson(DATA_FILES.ats, []);
  const existingIndex = atsList.findIndex((item) => item.candidateId === candidate.id && item.jobId === job.id);
  const record = { id: existingIndex >= 0 ? atsList[existingIndex].id : makeId('ATS'), candidateId: candidate.id, jobId: job.id, candidateName: candidate.fullName, jobTitle: job.jobTitle, ...result, createdAt: existingIndex >= 0 ? atsList[existingIndex].createdAt : nowIso(), updatedAt: nowIso() };
  if (existingIndex >= 0) atsList[existingIndex] = record;
  else atsList.push(record);
  writeJson(DATA_FILES.ats, atsList);
  logActivity('ATS_GENERATED', { candidateId: candidate.id, jobId: job.id, score: record.score });
  res.json(record);
});

app.get('/api/ats-scores', (req, res) => res.json(readJson(DATA_FILES.ats, [])));

app.get('/api/ats-scores/:candidateId', (req, res) => {
  const scores = readJson(DATA_FILES.ats, []).filter((item) => item.candidateId === req.params.candidateId);
  res.json(scores);
});

app.get('/api/shortlisted', (req, res) => {
  const shortlisted = readJson(DATA_FILES.shortlisted, []);
  res.json(shortlisted);
});

app.post('/api/shortlist', (req, res) => {
  const shortlisted = readJson(DATA_FILES.shortlisted, []);
  if (shortlisted.some((item) => item.candidateId === req.body.candidateId && item.jobId === req.body.jobId)) return res.status(409).json({ message: 'Candidate already shortlisted for this job.' });
  const record = { id: makeId('SHORT'), candidateId: cleanText(req.body.candidateId), candidateName: cleanText(req.body.candidateName), jobId: cleanText(req.body.jobId), jobTitle: cleanText(req.body.jobTitle), atsScore: safeNumber(req.body.atsScore, 0), shortlistedBy: cleanText(req.body.shortlistedBy) || 'USR-1001', status: 'Shortlisted', createdAt: nowIso() };
  shortlisted.push(record);
  writeJson(DATA_FILES.shortlisted, shortlisted);
  logActivity('SHORTLISTED', { candidateId: record.candidateId, jobId: record.jobId });
  res.status(201).json(record);
});

app.delete('/api/shortlist/:id', (req, res) => {
  const shortlisted = readJson(DATA_FILES.shortlisted, []);
  const filtered = shortlisted.filter((item) => item.id !== req.params.id);
  if (filtered.length === shortlisted.length) return res.status(404).json({ message: 'Shortlist record not found.' });
  writeJson(DATA_FILES.shortlisted, filtered);
  logActivity('SHORTLIST_REMOVED', { shortlistId: req.params.id });
  res.json({ message: 'Shortlist record removed.' });
});

app.get('/api/interviews', (req, res) => res.json(readJson(DATA_FILES.interviews, [])));

app.post('/api/interviews', (req, res) => {
  const interviews = readJson(DATA_FILES.interviews, []);
  const record = {
    id: makeId('INT'),
    candidateId: cleanText(req.body.candidateId),
    candidateName: cleanText(req.body.candidateName),
    jobId: cleanText(req.body.jobId),
    jobTitle: cleanText(req.body.jobTitle),
    interviewDate: cleanText(req.body.interviewDate),
    interviewTime: cleanText(req.body.interviewTime),
    mode: cleanText(req.body.mode),
    interviewerName: cleanText(req.body.interviewerName),
    meetingLink: cleanText(req.body.meetingLink),
    status: cleanText(req.body.status) || 'Scheduled',
    feedback: cleanText(req.body.feedback),
    createdAt: nowIso(),
    updatedAt: nowIso()
  };
  if (!record.candidateId || !record.jobId || !record.interviewDate || !record.interviewTime) return res.status(400).json({ message: 'Candidate, job, date and time are required.' });
  interviews.push(record);
  writeJson(DATA_FILES.interviews, interviews);
  logActivity('INTERVIEW_CREATED', { interviewId: record.id });
  res.status(201).json(record);
});

app.put('/api/interviews/:id', (req, res) => {
  const interviews = readJson(DATA_FILES.interviews, []);
  const index = interviews.findIndex((item) => item.id === req.params.id);
  if (index === -1) return res.status(404).json({ message: 'Interview not found.' });
  interviews[index] = { ...interviews[index], ...req.body, updatedAt: nowIso() };
  writeJson(DATA_FILES.interviews, interviews);
  logActivity('INTERVIEW_UPDATED', { interviewId: req.params.id });
  res.json(interviews[index]);
});

app.delete('/api/interviews/:id', (req, res) => {
  const interviews = readJson(DATA_FILES.interviews, []);
  const filtered = interviews.filter((item) => item.id !== req.params.id);
  if (filtered.length === interviews.length) return res.status(404).json({ message: 'Interview not found.' });
  writeJson(DATA_FILES.interviews, filtered);
  logActivity('INTERVIEW_DELETED', { interviewId: req.params.id });
  res.json({ message: 'Interview deleted.' });
});

app.get('/api/reports', (req, res) => {
  const jobs = readJson(DATA_FILES.jobs, []);
  const candidates = readJson(DATA_FILES.candidates, []);
  const ats = readJson(DATA_FILES.ats, []);
  const shortlisted = readJson(DATA_FILES.shortlisted, []);
  const interviews = readJson(DATA_FILES.interviews, []);
  const averageAts = ats.length ? Math.round(ats.reduce((sum, item) => sum + safeNumber(item.score, 0), 0) / ats.length) : 0;
  const jobWiseCandidates = jobs.map((job) => ({ jobId: job.id, jobTitle: job.jobTitle, candidates: candidates.filter((candidate) => candidate.appliedJobId === job.id).length }));
  res.json({
    totals: { jobs: jobs.length, candidates: candidates.length, ats: ats.length, shortlisted: shortlisted.length, interviews: interviews.length, averageAts },
    jobWiseCandidates,
    candidates,
    ats,
    shortlisted,
    interviews
  });
});

app.get('/api/settings', (req, res) => res.json(readJson(DATA_FILES.settings, {})));

app.put('/api/settings', (req, res) => {
  const current = readJson(DATA_FILES.settings, {});
  const updated = { ...current, ...req.body, updatedAt: nowIso() };
  writeJson(DATA_FILES.settings, updated);
  logActivity('SETTINGS_UPDATED', {});
  res.json(updated);
});

app.get('*', (req, res) => {
  res.sendFile(path.join(PUBLIC_DIR, 'index.html'));
});

normaliseSeedUsers().then(() => {
  app.listen(PORT, () => {
    console.log(`AI HR Assistant running at http://localhost:${PORT}`);
    console.log('Default login: admin@aihr.local / admin123');
  });
});
