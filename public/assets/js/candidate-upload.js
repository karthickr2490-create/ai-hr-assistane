let candidateJobs = [];
let candidatesCache = [];
let uploadedResumePath = '';
let editingCandidateId = null;

$(function () {
  requireLogin();
  renderShell('candidates');
  setPageTitle('Candidate Upload', 'Upload resume, store file in folder, and save candidate to JSON.');
  renderCandidatePage();
  loadCandidateDependencies();
});

function renderCandidatePage() {
  $('#pageContent').html(`
    <div class="row g-4">
      <div class="col-xl-5">
        <div class="card card-soft"><div class="card-body">
          <h5 class="fw-bold mb-3">Candidate Details</h5>
          <form id="candidateForm">
            <div class="upload-drop mb-3" onclick="$('#resumeFile').click()">
              <div class="h4 fw-bold">Upload Resume</div>
              <p class="text-muted mb-2">PDF, DOC, DOCX up to 10MB</p>
              <button type="button" class="btn btn-outline-primary">Browse Files</button>
              <input type="file" id="resumeFile" accept=".pdf,.doc,.docx" class="d-none">
              <div id="resumeStatus" class="small text-muted mt-3">No file uploaded.</div>
            </div>
            <div class="row g-3">
              <div class="col-md-6"><label class="form-label">Full Name *</label><input id="fullName" class="form-control" required></div>
              <div class="col-md-6"><label class="form-label">Email *</label><input id="email" type="email" class="form-control" required></div>
              <div class="col-md-6"><label class="form-label">Phone *</label><input id="phone" class="form-control"></div>
              <div class="col-md-6"><label class="form-label">Location</label><input id="location" class="form-control"></div>
              <div class="col-md-6"><label class="form-label">Applied Job *</label><select id="appliedJobId" class="form-select"></select></div>
              <div class="col-md-6"><label class="form-label">Total Experience Years</label><input id="totalExperienceYears" type="number" class="form-control" min="0" step="0.5"></div>
              <div class="col-12"><label class="form-label">Skills comma separated</label><textarea id="skills" class="form-control" rows="2" placeholder="HTML, CSS, JavaScript, React"></textarea></div>
              <div class="col-md-4"><label class="form-label">LinkedIn</label><input id="linkedin" class="form-control"></div>
              <div class="col-md-4"><label class="form-label">GitHub</label><input id="github" class="form-control"></div>
              <div class="col-md-4"><label class="form-label">Portfolio</label><input id="portfolio" class="form-control"></div>
            </div>
            <hr>
            <h6 class="fw-bold">Education</h6><div id="educationRows" class="vstack gap-2"></div><button type="button" class="btn btn-sm btn-outline-primary mt-2" onclick="addEducationRow()">Add Education</button>
            <hr>
            <h6 class="fw-bold">Experience</h6><div id="experienceRows" class="vstack gap-2"></div><button type="button" class="btn btn-sm btn-outline-primary mt-2" onclick="addExperienceRow()">Add Experience</button>
            <hr>
            <h6 class="fw-bold">Projects</h6><div id="projectRows" class="vstack gap-2"></div><button type="button" class="btn btn-sm btn-outline-primary mt-2" onclick="addProjectRow()">Add Project</button>
            <div class="form-check mt-4"><input class="form-check-input" type="checkbox" id="consent"><label class="form-check-label" for="consent">Candidate consent received for storing resume and screening details.</label></div>
            <div class="d-flex flex-wrap gap-2 mt-4">
              <button type="submit" class="btn btn-brand">Save Candidate</button>
              <button type="button" class="btn btn-outline-secondary" onclick="resetCandidateForm()">Clear</button>
            </div>
          </form>
        </div></div>
      </div>
      <div class="col-xl-7">
        <div class="card card-soft"><div class="card-body">
          <div class="d-flex justify-content-between align-items-center mb-3"><h5 class="fw-bold mb-0">Candidates</h5><button class="btn btn-sm btn-outline-primary" onclick="loadCandidates()">Refresh</button></div>
          <div class="table-responsive"><table class="table table-hover"><thead><tr><th>Name</th><th>Job</th><th>Skills</th><th>Resume</th><th>Action</th></tr></thead><tbody id="candidateTable"></tbody></table></div>
        </div></div>
      </div>
    </div>
  `);
  addEducationRow(); addExperienceRow(); addProjectRow();
  $('#resumeFile').on('change', uploadResume);
  $('#candidateForm').on('submit', saveCandidate);
}

function loadCandidateDependencies() {
  $.when(apiGet('/api/jobs'), apiGet('/api/candidates')).done((jobsRes, candRes) => {
    candidateJobs = jobsRes[0];
    candidatesCache = candRes[0];
    $('#appliedJobId').html(candidateJobs.map(job => `<option value="${job.id}">${escapeHtml(job.jobTitle)}</option>`).join(''));
    renderCandidateTable();
  }).fail(handleAjaxError);
}
function loadCandidates() { apiGet('/api/candidates').done((data) => { candidatesCache = data; renderCandidateTable(); }).fail(handleAjaxError); }

function uploadResume() {
  const file = this.files[0];
  if (!file) return;
  const formData = new FormData();
  formData.append('resume', file);
  $('#resumeStatus').text('Uploading...');
  $.ajax({ url: API_BASE + '/api/upload-resume', method: 'POST', data: formData, processData: false, contentType: false })
    .done((response) => { uploadedResumePath = response.filePath; $('#resumeStatus').html(`Uploaded: <a href="${response.filePath}" target="_blank">${escapeHtml(response.originalName)}</a>`); toast('Resume uploaded.'); })
    .fail((xhr) => { $('#resumeStatus').text('Upload failed.'); handleAjaxError(xhr); });
}

function addEducationRow(row = {}) { $('#educationRows').append(`<div class="row g-2 dynamic-row"><div class="col-md-4"><input class="form-control edu-degree" placeholder="Degree" value="${escapeHtml(row.degree || '')}"></div><div class="col-md-4"><input class="form-control edu-institute" placeholder="Institute" value="${escapeHtml(row.institute || '')}"></div><div class="col-md-3"><input class="form-control edu-score" placeholder="Score" value="${escapeHtml(row.score || '')}"></div><div class="col-md-1"><button type="button" class="btn btn-outline-danger w-100" onclick="$(this).closest('.dynamic-row').remove()">×</button></div></div>`); }
function addExperienceRow(row = {}) { $('#experienceRows').append(`<div class="row g-2 dynamic-row"><div class="col-md-3"><input class="form-control exp-company" placeholder="Company" value="${escapeHtml(row.company || '')}"></div><div class="col-md-3"><input class="form-control exp-designation" placeholder="Designation" value="${escapeHtml(row.designation || '')}"></div><div class="col-md-2"><input class="form-control exp-start" placeholder="Start" value="${escapeHtml(row.startDate || '')}"></div><div class="col-md-2"><input class="form-control exp-end" placeholder="End" value="${escapeHtml(row.endDate || '')}"></div><div class="col-md-2"><button type="button" class="btn btn-outline-danger w-100" onclick="$(this).closest('.dynamic-row').remove()">Remove</button></div></div>`); }
function addProjectRow(row = {}) { $('#projectRows').append(`<div class="row g-2 dynamic-row"><div class="col-md-4"><input class="form-control proj-name" placeholder="Project Name" value="${escapeHtml(row.projectName || '')}"></div><div class="col-md-6"><input class="form-control proj-desc" placeholder="Description / Technologies" value="${escapeHtml(row.description || '')}"></div><div class="col-md-2"><button type="button" class="btn btn-outline-danger w-100" onclick="$(this).closest('.dynamic-row').remove()">Remove</button></div></div>`); }

function collectCandidatePayload() {
  const education = $('#educationRows .dynamic-row').map(function () { return { degree: $(this).find('.edu-degree').val(), institute: $(this).find('.edu-institute').val(), score: $(this).find('.edu-score').val() }; }).get().filter(x => x.degree || x.institute);
  const experience = $('#experienceRows .dynamic-row').map(function () { return { company: $(this).find('.exp-company').val(), designation: $(this).find('.exp-designation').val(), startDate: $(this).find('.exp-start').val(), endDate: $(this).find('.exp-end').val() }; }).get().filter(x => x.company || x.designation);
  const projects = $('#projectRows .dynamic-row').map(function () { return { projectName: $(this).find('.proj-name').val(), description: $(this).find('.proj-desc').val() }; }).get().filter(x => x.projectName || x.description);
  return { fullName: $('#fullName').val(), email: $('#email').val(), phone: $('#phone').val(), location: $('#location').val(), appliedJobId: $('#appliedJobId').val(), resumeFile: uploadedResumePath, skills: $('#skills').val(), totalExperienceYears: $('#totalExperienceYears').val(), education, experience, projects, links: { linkedin: $('#linkedin').val(), github: $('#github').val(), portfolio: $('#portfolio').val() } };
}

function saveCandidate(event) {
  event.preventDefault();
  if (!$('#consent').is(':checked')) return toast('Consent confirmation is required.', 'warning');
  const payload = collectCandidatePayload();
  if (!payload.fullName || !payload.email || !payload.appliedJobId) return toast('Full name, email and applied job are required.', 'warning');
  const request = editingCandidateId ? apiPut(`/api/candidates/${editingCandidateId}`, payload) : apiPost('/api/candidates', payload);
  request.done(() => { toast(editingCandidateId ? 'Candidate updated.' : 'Candidate saved.'); resetCandidateForm(); loadCandidates(); }).fail(handleAjaxError);
}

function renderCandidateTable() {
  const rows = candidatesCache.map(c => { const job = candidateJobs.find(j => j.id === c.appliedJobId); return `<tr><td><div class="fw-bold">${escapeHtml(c.fullName)}</div><div class="small text-muted">${escapeHtml(c.email)}</div></td><td>${escapeHtml(job?.jobTitle || c.appliedJobId)}</td><td>${escapeHtml((c.skills || []).slice(0, 4).join(', '))}</td><td>${c.resumeFile ? `<a href="${c.resumeFile}" target="_blank">Open</a>` : '<span class="text-muted">No file</span>'}</td><td class="text-nowrap"><button class="btn btn-sm btn-outline-secondary" onclick="editCandidate('${c.id}')">Edit</button><button class="btn btn-sm btn-outline-danger" onclick="deleteCandidate('${c.id}')">Delete</button></td></tr>`; }).join('');
  $('#candidateTable').html(rows || '<tr><td colspan="5" class="text-muted">No candidates found.</td></tr>');
}

function editCandidate(id) {
  const c = candidatesCache.find(x => x.id === id); if (!c) return;
  editingCandidateId = id; uploadedResumePath = c.resumeFile || '';
  $('#fullName').val(c.fullName); $('#email').val(c.email); $('#phone').val(c.phone); $('#location').val(c.location); $('#appliedJobId').val(c.appliedJobId); $('#skills').val((c.skills || []).join(', ')); $('#totalExperienceYears').val(c.totalExperienceYears); $('#linkedin').val(c.links?.linkedin); $('#github').val(c.links?.github); $('#portfolio').val(c.links?.portfolio); $('#resumeStatus').html(c.resumeFile ? `Current: <a href="${c.resumeFile}" target="_blank">Open resume</a>` : 'No file uploaded.');
  $('#educationRows,#experienceRows,#projectRows').empty(); (c.education || []).forEach(addEducationRow); (c.experience || []).forEach(addExperienceRow); (c.projects || []).forEach(addProjectRow);
  if (!c.education?.length) addEducationRow(); if (!c.experience?.length) addExperienceRow(); if (!c.projects?.length) addProjectRow();
  $('#consent').prop('checked', true); toast('Candidate loaded for editing.', 'info');
}
function deleteCandidate(id) { if (!confirm('Delete this candidate?')) return; apiDelete(`/api/candidates/${id}`).done(() => { toast('Candidate deleted.'); loadCandidates(); }).fail(handleAjaxError); }
function resetCandidateForm() { editingCandidateId = null; uploadedResumePath = ''; $('#candidateForm')[0].reset(); $('#educationRows,#experienceRows,#projectRows').empty(); addEducationRow(); addExperienceRow(); addProjectRow(); $('#resumeStatus').text('No file uploaded.'); }
