$(function () {
  requireLogin();
  renderShell('dashboard');
  setPageTitle('Dashboard', 'Complete hiring overview from JSON database.');
  loadDashboard();
});

function loadDashboard() {
  apiGet('/api/dashboard-summary').done((data) => {
    $('#pageContent').html(`
      <div class="row g-4 mb-4">
        ${statCard('Total Jobs', data.totalJobs, 'J')}
        ${statCard('Candidates', data.totalCandidates, 'C')}
        ${statCard('ATS Completed', data.atsCompleted, 'A')}
        ${statCard('Shortlisted', data.shortlisted, 'S')}
        ${statCard('Interviews', data.interviews, 'I')}
        ${statCard('Published Jobs', data.publishedJobs, 'P')}
      </div>
      <div class="row g-4">
        <div class="col-lg-6">
          <div class="card card-soft h-100"><div class="card-body">
            <div class="d-flex justify-content-between align-items-center mb-3"><h5 class="fw-bold mb-0">Recent Jobs</h5><a class="btn btn-sm btn-outline-primary" href="job-description.html">Manage</a></div>
            <div class="table-responsive"><table class="table table-hover"><thead><tr><th>Job</th><th>Status</th><th>Openings</th></tr></thead><tbody>${jobRows(data.recentJobs)}</tbody></table></div>
          </div></div>
        </div>
        <div class="col-lg-6">
          <div class="card card-soft h-100"><div class="card-body">
            <div class="d-flex justify-content-between align-items-center mb-3"><h5 class="fw-bold mb-0">Recent Candidates</h5><a class="btn btn-sm btn-outline-primary" href="candidate-upload.html">Upload</a></div>
            <div class="table-responsive"><table class="table table-hover"><thead><tr><th>Name</th><th>Email</th><th>Status</th></tr></thead><tbody>${candidateRows(data.recentCandidates)}</tbody></table></div>
          </div></div>
        </div>
      </div>
      <div class="card card-soft mt-4"><div class="card-body">
        <h5 class="fw-bold mb-3">Quick Actions</h5>
        <div class="d-flex flex-wrap gap-2">
          <a class="btn btn-brand" href="job-description.html">Create Job</a>
          <a class="btn btn-outline-primary" href="candidate-upload.html">Upload Candidate</a>
          <a class="btn btn-outline-primary" href="resume-screening.html">Run Screening</a>
          <a class="btn btn-outline-primary" href="interview-schedule.html">Schedule Interview</a>
        </div>
      </div></div>
    `);
  }).fail(handleAjaxError);
}

function statCard(label, value, icon) {
  return `<div class="col-sm-6 col-xl-4"><div class="card stat-card"><div class="card-body d-flex justify-content-between align-items-center"><div><div class="text-muted small">${label}</div><div class="h2 fw-bold mb-0">${value}</div></div><div class="stat-icon">${icon}</div></div></div></div>`;
}

function jobRows(jobs) {
  return jobs.length ? jobs.map(job => `<tr><td>${escapeHtml(job.jobTitle)}</td><td><span class="badge badge-soft">${escapeHtml(job.status)}</span></td><td>${job.openings || 1}</td></tr>`).join('') : '<tr><td colspan="3" class="text-muted">No jobs found.</td></tr>';
}

function candidateRows(candidates) {
  return candidates.length ? candidates.map(candidate => `<tr><td>${escapeHtml(candidate.fullName)}</td><td>${escapeHtml(candidate.email)}</td><td><span class="badge badge-soft">${escapeHtml(candidate.status)}</span></td></tr>`).join('') : '<tr><td colspan="3" class="text-muted">No candidates found.</td></tr>';
}
