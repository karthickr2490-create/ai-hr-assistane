let reportData = null;
$(function () {
  requireLogin();
  renderShell('reports');
  setPageTitle('Reports & Analytics', 'Hiring performance from JSON data files.');
  $('#pageContent').html('<div id="reportsArea"></div>');
  loadReports();
});
function loadReports() { apiGet('/api/reports').done((data) => { reportData = data; renderReports(data); }).fail(handleAjaxError); }
function renderReports(data) {
  $('#reportsArea').html(`
    <div class="row g-4 mb-4">
      ${statCard('Jobs', data.totals.jobs, 'J')}${statCard('Candidates', data.totals.candidates, 'C')}${statCard('Average ATS', data.totals.averageAts + '%', 'A')}${statCard('Shortlisted', data.totals.shortlisted, 'S')}${statCard('Interviews', data.totals.interviews, 'I')}
    </div>
    <div class="card card-soft mb-4"><div class="card-body">
      <div class="d-flex justify-content-between align-items-center mb-3"><h5 class="fw-bold mb-0">Job-wise Candidate Count</h5><button class="btn btn-sm btn-brand" onclick="csvDownload('job-wise-candidates.csv', reportData.jobWiseCandidates)">Export</button></div>
      <div class="table-responsive"><table class="table table-hover"><thead><tr><th>Job</th><th>Candidates</th></tr></thead><tbody>${data.jobWiseCandidates.map(r => `<tr><td>${escapeHtml(r.jobTitle)}</td><td>${r.candidates}</td></tr>`).join('')}</tbody></table></div>
    </div></div>
    <div class="card card-soft"><div class="card-body">
      <div class="d-flex justify-content-between align-items-center mb-3"><h5 class="fw-bold mb-0">Candidate Report</h5><button class="btn btn-sm btn-brand" onclick="csvDownload('candidate-report.csv', reportData.candidates)">Export</button></div>
      <div class="table-responsive"><table class="table table-hover"><thead><tr><th>Name</th><th>Email</th><th>Status</th><th>Experience</th></tr></thead><tbody>${data.candidates.map(c => `<tr><td>${escapeHtml(c.fullName)}</td><td>${escapeHtml(c.email)}</td><td>${escapeHtml(c.status)}</td><td>${escapeHtml(c.totalExperienceYears)}</td></tr>`).join('') || '<tr><td colspan="4" class="text-muted">No candidates found.</td></tr>'}</tbody></table></div>
    </div></div>`);
}
function statCard(label, value, icon) { return `<div class="col-sm-6 col-xl"><div class="card stat-card"><div class="card-body d-flex justify-content-between align-items-center"><div><div class="text-muted small">${label}</div><div class="h3 fw-bold mb-0">${value}</div></div><div class="stat-icon">${icon}</div></div></div></div>`; }
