let editingJobId = null;
let jobsCache = [];

$(function () {
  requireLogin();
  renderShell('jobs');
  setPageTitle('Job Description', 'Create, generate, publish, edit and delete job descriptions.');
  renderJobPage();
  loadJobs();
});

function renderJobPage() {
  $('#pageContent').html(`
    <div class="row g-4">
      <div class="col-xl-5">
        <div class="card card-soft"><div class="card-body">
          <h5 class="fw-bold mb-3">Job Information</h5>
          <form id="jobForm">
            <input type="hidden" id="jobStatus" value="Draft">
            <div class="row g-3">
              <div class="col-md-6"><label class="form-label">Job Title *</label><input id="jobTitle" class="form-control" required placeholder="Frontend Developer"></div>
              <div class="col-md-6"><label class="form-label">Department *</label><input id="department" class="form-control" required placeholder="IT / Engineering"></div>
              <div class="col-md-6"><label class="form-label">Experience *</label><input id="experience" class="form-control" placeholder="2 - 4 Years"></div>
              <div class="col-md-6"><label class="form-label">Employment Type</label><select id="employmentType" class="form-select"><option>Full-time</option><option>Contract</option><option>Part-time</option><option>Internship</option></select></div>
              <div class="col-md-6"><label class="form-label">Location</label><input id="location" class="form-control" placeholder="Bangalore"></div>
              <div class="col-md-6"><label class="form-label">Work Mode</label><select id="workMode" class="form-select"><option>On-site</option><option>Hybrid</option><option>Remote</option></select></div>
              <div class="col-md-6"><label class="form-label">Salary Range</label><input id="salaryRange" class="form-control" placeholder="₹4 LPA - ₹8 LPA"></div>
              <div class="col-md-6"><label class="form-label">Openings</label><input id="openings" type="number" class="form-control" value="1" min="1"></div>
              <div class="col-12"><label class="form-label">Skills comma separated *</label><textarea id="skills" class="form-control" rows="2" placeholder="HTML, CSS, JavaScript, React"></textarea></div>
              <div class="col-12"><label class="form-label">Qualifications comma separated</label><textarea id="qualifications" class="form-control" rows="2" placeholder="B.Tech, Computer Science"></textarea></div>
              <div class="col-12"><label class="form-label">Responsibilities comma separated</label><textarea id="responsibilities" class="form-control" rows="3" placeholder="Build UI, Integrate APIs, Fix bugs"></textarea></div>
              <div class="col-12"><label class="form-label">Generated Description</label><textarea id="generatedDescription" class="form-control" rows="8"></textarea></div>
            </div>
            <div class="d-flex flex-wrap gap-2 mt-4">
              <button type="button" class="btn btn-outline-primary" id="generateBtn">Generate JD</button>
              <button type="button" class="btn btn-secondary" onclick="saveJob('Draft')">Save Draft</button>
              <button type="button" class="btn btn-brand" onclick="saveJob('Published')">Publish Job</button>
              <button type="button" class="btn btn-outline-secondary" onclick="resetJobForm()">Clear</button>
            </div>
          </form>
        </div></div>
      </div>
      <div class="col-xl-7">
        <div class="card card-soft"><div class="card-body">
          <div class="d-flex flex-wrap justify-content-between gap-2 align-items-center mb-3">
            <h5 class="fw-bold mb-0">Job List</h5>
            <input id="jobSearch" class="form-control w-auto" placeholder="Search job...">
          </div>
          <div class="table-responsive"><table class="table table-hover"><thead><tr><th>Job</th><th>Department</th><th>Status</th><th>Openings</th><th>Action</th></tr></thead><tbody id="jobsTable"></tbody></table></div>
        </div></div>
      </div>
    </div>
    <div class="modal fade" id="jdModal" tabindex="-1"><div class="modal-dialog modal-lg"><div class="modal-content"><div class="modal-header"><h5 class="modal-title">Job Description Preview</h5><button class="btn-close" data-bs-dismiss="modal"></button></div><div class="modal-body"><pre id="jdPreview" class="white-space-pre-wrap"></pre></div></div></div></div>
  `);
  $('#generateBtn').on('click', generateJobDescription);
  $('#jobSearch').on('input', function () { renderJobs($(this).val()); });
}

function getJobPayload(status) {
  return {
    jobTitle: $('#jobTitle').val(),
    department: $('#department').val(),
    experience: $('#experience').val(),
    employmentType: $('#employmentType').val(),
    location: $('#location').val(),
    workMode: $('#workMode').val(),
    salaryRange: $('#salaryRange').val(),
    openings: $('#openings').val(),
    skills: $('#skills').val(),
    qualifications: $('#qualifications').val(),
    responsibilities: $('#responsibilities').val(),
    generatedDescription: $('#generatedDescription').val(),
    status
  };
}

function generateJobDescription() {
  apiPost('/api/jobs/generate-description', getJobPayload('Draft')).done((response) => {
    $('#generatedDescription').val(response.generatedDescription);
    toast('Job description generated.');
  }).fail(handleAjaxError);
}

function saveJob(status) {
  const payload = getJobPayload(status);
  if (!payload.jobTitle || !payload.department) return toast('Job title and department are required.', 'warning');
  const request = editingJobId ? apiPut(`/api/jobs/${editingJobId}`, payload) : apiPost('/api/jobs', payload);
  request.done(() => {
    toast(editingJobId ? 'Job updated successfully.' : 'Job saved successfully.');
    resetJobForm();
    loadJobs();
  }).fail(handleAjaxError);
}

function loadJobs() {
  apiGet('/api/jobs').done((jobs) => { jobsCache = jobs; renderJobs(); }).fail(handleAjaxError);
}

function renderJobs(filter = '') {
  const text = filter.toLowerCase();
  const rows = jobsCache.filter(job => JSON.stringify(job).toLowerCase().includes(text)).map(job => `
    <tr>
      <td><div class="fw-bold">${escapeHtml(job.jobTitle)}</div><div class="small text-muted">${escapeHtml(job.location || '')} • ${escapeHtml(job.workMode || '')}</div></td>
      <td>${escapeHtml(job.department)}</td>
      <td><span class="badge ${job.status === 'Published' ? 'text-bg-success' : 'text-bg-secondary'}">${escapeHtml(job.status)}</span></td>
      <td>${job.openings || 1}</td>
      <td class="text-nowrap">
        <button class="btn btn-sm btn-outline-primary" onclick="viewJob('${job.id}')">View</button>
        <button class="btn btn-sm btn-outline-secondary" onclick="editJob('${job.id}')">Edit</button>
        <button class="btn btn-sm btn-outline-danger" onclick="deleteJob('${job.id}')">Delete</button>
      </td>
    </tr>`).join('');
  $('#jobsTable').html(rows || '<tr><td colspan="5" class="text-muted">No jobs available.</td></tr>');
}

function viewJob(id) {
  const job = jobsCache.find(j => j.id === id);
  $('#jdPreview').text(job?.generatedDescription || 'No description available.');
  new bootstrap.Modal(document.getElementById('jdModal')).show();
}

function editJob(id) {
  const job = jobsCache.find(j => j.id === id);
  if (!job) return;
  editingJobId = id;
  $('#jobTitle').val(job.jobTitle);
  $('#department').val(job.department);
  $('#experience').val(job.experience);
  $('#employmentType').val(job.employmentType);
  $('#location').val(job.location);
  $('#workMode').val(job.workMode);
  $('#salaryRange').val(job.salaryRange);
  $('#openings').val(job.openings);
  $('#skills').val((job.skills || []).join(', '));
  $('#qualifications').val((job.qualifications || []).join(', '));
  $('#responsibilities').val((job.responsibilities || []).join(', '));
  $('#generatedDescription').val(job.generatedDescription);
  toast('Job loaded for editing.', 'info');
}

function deleteJob(id) {
  if (!confirm('Delete this job?')) return;
  apiDelete(`/api/jobs/${id}`).done(() => { toast('Job deleted.'); loadJobs(); }).fail(handleAjaxError);
}

function resetJobForm() {
  editingJobId = null;
  $('#jobForm')[0].reset();
  $('#openings').val(1);
  $('#generatedDescription').val('');
}
