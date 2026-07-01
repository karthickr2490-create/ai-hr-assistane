let screenJobs = [];
let screenCandidates = [];
let lastAtsResult = null;

$(function () {
  requireLogin();
  renderShell('screening');
  setPageTitle('Resume Screening', 'Compare candidates against jobs and generate actionable ATS recommendations.');
  renderScreeningPage();
  loadScreeningData();
});

function renderScreeningPage() {
  $('#pageContent').html(`
    <div class="row g-4">
      <div class="col-lg-4"><div class="card card-soft"><div class="card-body">
        <h5 class="fw-bold mb-3">Run Screening</h5>
        <div class="mb-3"><label class="form-label">Select Job</label><select id="jobSelect" class="form-select"></select></div>
        <div class="mb-3"><label class="form-label">Select Candidate</label><select id="candidateSelect" class="form-select"></select></div>
        <button class="btn btn-brand w-100 mb-2" onclick="runScreening()">Generate ATS Score</button>
        <button class="btn btn-outline-secondary w-100" onclick="window.location.href='candidate-upload.html'">Upload New Candidate</button>
      </div></div></div>
      <div class="col-lg-8"><div class="card card-soft"><div class="card-body" id="screeningResult">
        <div class="text-center text-muted py-5">Select a job and candidate, then run screening.</div>
      </div></div></div>
    </div>
  `);
}

function loadScreeningData() {
  $.when(apiGet('/api/jobs'), apiGet('/api/candidates')).done((jobsRes, candRes) => {
    screenJobs = jobsRes[0]; screenCandidates = candRes[0];
    $('#jobSelect').html(screenJobs.map(j => `<option value="${j.id}">${escapeHtml(j.jobTitle)}</option>`).join(''));
    $('#candidateSelect').html(screenCandidates.map(c => `<option value="${c.id}">${escapeHtml(c.fullName)} - ${escapeHtml(c.email)}</option>`).join(''));
  }).fail(handleAjaxError);
}

function runScreening() {
  const payload = { jobId: $('#jobSelect').val(), candidateId: $('#candidateSelect').val() };
  if (!payload.jobId || !payload.candidateId) return toast('Please select both job and candidate.', 'warning');
  apiPost('/api/screen-candidate', payload).done((result) => {
    lastAtsResult = result;
    renderResult(result);
    toast('ATS score generated.');
  }).fail(handleAjaxError);
}

function renderResult(result) {
  const deg = Math.round((result.score / 100) * 360);
  $('#screeningResult').html(`
    <div class="d-flex flex-wrap justify-content-between gap-3 align-items-center mb-4">
      <div><h4 class="fw-bold mb-1">${escapeHtml(result.candidateName)}</h4><p class="text-muted mb-0">Against: ${escapeHtml(result.jobTitle)}</p></div>
      <span class="badge text-bg-${result.score >= 80 ? 'success' : result.score >= 65 ? 'primary' : result.score >= 50 ? 'warning' : 'danger'} fs-6">${escapeHtml(result.recommendation)}</span>
    </div>
    <div class="row g-4 align-items-center">
      <div class="col-md-4 d-flex justify-content-center"><div class="score-circle" style="--score-deg:${deg}deg"><span>${result.score}%</span></div></div>
      <div class="col-md-8">
        <div class="mb-3"><div class="d-flex justify-content-between"><span>Skills</span><strong>${result.skillScore}</strong></div><div class="progress"><div class="progress-bar" style="width:${result.skillScore}%"></div></div></div>
        <div class="mb-3"><div class="d-flex justify-content-between"><span>Experience</span><strong>${result.experienceScore}</strong></div><div class="progress"><div class="progress-bar" style="width:${result.experienceScore * 4}%"></div></div></div>
        <div class="mb-3"><div class="d-flex justify-content-between"><span>Education</span><strong>${result.educationScore}</strong></div><div class="progress"><div class="progress-bar" style="width:${result.educationScore * 6.66}%"></div></div></div>
        <div class="mb-3"><div class="d-flex justify-content-between"><span>Projects</span><strong>${result.projectScore}</strong></div><div class="progress"><div class="progress-bar" style="width:${result.projectScore * 10}%"></div></div></div>
      </div>
    </div>
    <hr>
    <div class="row g-4">
      <div class="col-md-6"><h6 class="fw-bold text-success">Matched Skills</h6>${tagList(result.matchedSkills, 'success')}</div>
      <div class="col-md-6"><h6 class="fw-bold text-danger">Missing Skills</h6>${tagList(result.missingSkills, 'danger')}</div>
    </div>
    <div class="alert alert-info mt-4">${escapeHtml(result.reason)}</div>
    <button class="btn btn-brand" onclick="shortlistLastResult()">Move to Shortlist</button>
  `);
}
function tagList(items, type) { return items?.length ? items.map(item => `<span class="badge text-bg-${type} me-1 mb-1">${escapeHtml(item)}</span>`).join('') : '<span class="text-muted">None</span>'; }
function shortlistLastResult() { if (!lastAtsResult) return; apiPost('/api/shortlist', { candidateId: lastAtsResult.candidateId, candidateName: lastAtsResult.candidateName, jobId: lastAtsResult.jobId, jobTitle: lastAtsResult.jobTitle, atsScore: lastAtsResult.score }).done(() => toast('Candidate shortlisted.')).fail(handleAjaxError); }
