let intCandidates = [], intJobs = [], intRows = [];

$(function () {
  requireLogin();
  renderShell('interviews');
  setPageTitle('Interview Schedule', 'Create, update, cancel and track interview feedback.');
  renderInterviewPage();
  loadInterviewData();
});

function renderInterviewPage() {
  $('#pageContent').html(`
    <div class="row g-4">
      <div class="col-lg-4"><div class="card card-soft"><div class="card-body">
        <h5 class="fw-bold mb-3">Schedule Interview</h5>
        <form id="interviewForm">
          <div class="mb-3"><label class="form-label">Candidate</label><select id="candidateId" class="form-select"></select></div>
          <div class="mb-3"><label class="form-label">Job</label><select id="jobId" class="form-select"></select></div>
          <div class="row g-2"><div class="col-6"><label class="form-label">Date</label><input type="date" id="interviewDate" class="form-control"></div><div class="col-6"><label class="form-label">Time</label><input type="time" id="interviewTime" class="form-control"></div></div>
          <div class="mb-3 mt-3"><label class="form-label">Mode</label><select id="mode" class="form-select"><option>Online</option><option>Offline</option><option>Telephonic</option></select></div>
          <div class="mb-3"><label class="form-label">Interviewer</label><input id="interviewerName" class="form-control" placeholder="Karthick Ramesh"></div>
          <div class="mb-3"><label class="form-label">Meeting Link / Location</label><input id="meetingLink" class="form-control"></div>
          <button class="btn btn-brand w-100" type="submit">Save Schedule</button>
        </form>
      </div></div></div>
      <div class="col-lg-8"><div class="card card-soft"><div class="card-body">
        <div class="d-flex justify-content-between align-items-center mb-3"><h5 class="fw-bold mb-0">Scheduled Interviews</h5><button class="btn btn-sm btn-outline-primary" onclick="loadInterviews()">Refresh</button></div>
        <div class="table-responsive"><table class="table table-hover"><thead><tr><th>Candidate</th><th>Job</th><th>Date & Time</th><th>Status</th><th>Action</th></tr></thead><tbody id="interviewTable"></tbody></table></div>
      </div></div></div>
    </div>`);
  $('#interviewForm').on('submit', saveInterview);
}
function loadInterviewData() { $.when(apiGet('/api/candidates'), apiGet('/api/jobs'), apiGet('/api/interviews')).done((cRes, jRes, iRes) => { intCandidates = cRes[0]; intJobs = jRes[0]; intRows = iRes[0]; $('#candidateId').html(intCandidates.map(c => `<option value="${c.id}">${escapeHtml(c.fullName)}</option>`).join('')); $('#jobId').html(intJobs.map(j => `<option value="${j.id}">${escapeHtml(j.jobTitle)}</option>`).join('')); renderInterviews(); }).fail(handleAjaxError); }
function loadInterviews() { apiGet('/api/interviews').done((rows) => { intRows = rows; renderInterviews(); }).fail(handleAjaxError); }
function saveInterview(e) { e.preventDefault(); const candidate = intCandidates.find(c => c.id === $('#candidateId').val()); const job = intJobs.find(j => j.id === $('#jobId').val()); const payload = { candidateId: candidate?.id, candidateName: candidate?.fullName, jobId: job?.id, jobTitle: job?.jobTitle, interviewDate: $('#interviewDate').val(), interviewTime: $('#interviewTime').val(), mode: $('#mode').val(), interviewerName: $('#interviewerName').val(), meetingLink: $('#meetingLink').val(), status: 'Scheduled' }; apiPost('/api/interviews', payload).done(() => { toast('Interview scheduled.'); $('#interviewForm')[0].reset(); loadInterviews(); }).fail(handleAjaxError); }
function renderInterviews() { const rows = intRows.map(i => `<tr><td>${escapeHtml(i.candidateName)}</td><td>${escapeHtml(i.jobTitle)}</td><td>${escapeHtml(i.interviewDate)} ${escapeHtml(i.interviewTime)}</td><td><span class="badge text-bg-info">${escapeHtml(i.status)}</span></td><td><button class="btn btn-sm btn-outline-success" onclick="markInterview('${i.id}','Completed')">Complete</button> <button class="btn btn-sm btn-outline-danger" onclick="deleteInterview('${i.id}')">Cancel</button></td></tr>`).join(''); $('#interviewTable').html(rows || '<tr><td colspan="5" class="text-muted">No interviews scheduled.</td></tr>'); }
function markInterview(id, status) { apiPut(`/api/interviews/${id}`, { status, feedback: 'Feedback pending' }).done(() => { toast('Interview updated.'); loadInterviews(); }).fail(handleAjaxError); }
function deleteInterview(id) { if (!confirm('Cancel this interview?')) return; apiDelete(`/api/interviews/${id}`).done(() => { toast('Interview cancelled.'); loadInterviews(); }).fail(handleAjaxError); }
