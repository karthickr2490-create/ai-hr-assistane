$(function () {
  requireLogin();
  renderShell('ats');
  setPageTitle('ATS Score', 'View all generated candidate-job match scores.');
  $('#pageContent').html(`<div class="card card-soft"><div class="card-body"><div class="d-flex justify-content-between align-items-center mb-3"><h5 class="fw-bold mb-0">ATS Score History</h5><button class="btn btn-sm btn-outline-primary" onclick="loadAtsScores()">Refresh</button></div><div class="table-responsive"><table class="table table-hover"><thead><tr><th>Candidate</th><th>Job</th><th>Score</th><th>Recommendation</th><th>Matched</th><th>Missing</th></tr></thead><tbody id="atsTable"></tbody></table></div></div></div>`);
  loadAtsScores();
});
function loadAtsScores() {
  apiGet('/api/ats-scores').done((scores) => {
    const rows = scores.map(s => `<tr><td>${escapeHtml(s.candidateName)}</td><td>${escapeHtml(s.jobTitle)}</td><td><strong>${s.score}%</strong></td><td><span class="badge text-bg-${s.score >= 80 ? 'success' : s.score >= 65 ? 'primary' : s.score >= 50 ? 'warning' : 'danger'}">${escapeHtml(s.recommendation)}</span></td><td>${escapeHtml((s.matchedSkills || []).join(', '))}</td><td>${escapeHtml((s.missingSkills || []).join(', '))}</td></tr>`).join('');
    $('#atsTable').html(rows || '<tr><td colspan="6" class="text-muted">No ATS scores available yet.</td></tr>');
  }).fail(handleAjaxError);
}
