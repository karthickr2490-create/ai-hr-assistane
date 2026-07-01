$(function () {
  requireLogin();
  renderShell('shortlisted');
  setPageTitle('Shortlisted Candidates', 'Manage shortlisted candidates and export the shortlist.');
  $('#pageContent').html(`<div class="card card-soft"><div class="card-body"><div class="d-flex flex-wrap justify-content-between gap-2 align-items-center mb-3"><h5 class="fw-bold mb-0">Shortlist</h5><div class="d-flex gap-2"><button class="btn btn-sm btn-outline-primary" onclick="loadShortlisted()">Refresh</button><button class="btn btn-sm btn-brand" onclick="exportShortlist()">Export CSV</button></div></div><div class="table-responsive"><table class="table table-hover"><thead><tr><th>Candidate</th><th>Job</th><th>ATS</th><th>Status</th><th>Action</th></tr></thead><tbody id="shortTable"></tbody></table></div></div></div>`);
  loadShortlisted();
});
let shortlistRows = [];
function loadShortlisted() { apiGet('/api/shortlisted').done((data) => { shortlistRows = data; renderShortlist(); }).fail(handleAjaxError); }
function renderShortlist() { const rows = shortlistRows.map(item => `<tr><td>${escapeHtml(item.candidateName)}</td><td>${escapeHtml(item.jobTitle)}</td><td><strong>${item.atsScore}%</strong></td><td><span class="badge text-bg-success">${escapeHtml(item.status)}</span></td><td><a class="btn btn-sm btn-outline-primary" href="interview-schedule.html">Schedule</a> <button class="btn btn-sm btn-outline-danger" onclick="removeShortlist('${item.id}')">Remove</button></td></tr>`).join(''); $('#shortTable').html(rows || '<tr><td colspan="5" class="text-muted">No shortlisted candidates.</td></tr>'); }
function removeShortlist(id) { if (!confirm('Remove from shortlist?')) return; apiDelete(`/api/shortlist/${id}`).done(() => { toast('Removed from shortlist.'); loadShortlisted(); }).fail(handleAjaxError); }
function exportShortlist() { csvDownload('shortlisted-candidates.csv', shortlistRows); }
