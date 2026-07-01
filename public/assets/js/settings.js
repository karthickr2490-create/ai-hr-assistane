$(function () {
  requireLogin();
  renderShell('settings');
  setPageTitle('Settings', 'Configure company name, file rules and ATS weightages.');
  renderSettingsPage();
  loadSettings();
});
function renderSettingsPage() {
  $('#pageContent').html(`
    <div class="card card-soft"><div class="card-body">
      <form id="settingsForm" class="row g-3">
        <div class="col-md-6"><label class="form-label">Company Name</label><input id="companyName" class="form-control"></div>
        <div class="col-md-3"><label class="form-label">Max Resume Size MB</label><input id="maxResumeSizeMb" class="form-control" type="number"></div>
        <div class="col-md-3"><label class="form-label">Allowed Types</label><input id="allowedResumeTypes" class="form-control" placeholder="pdf, doc, docx"></div>
        <div class="col-md-3"><label class="form-label">Skills Weight</label><input id="skillsWeight" class="form-control" type="number"></div>
        <div class="col-md-3"><label class="form-label">Experience Weight</label><input id="experienceWeight" class="form-control" type="number"></div>
        <div class="col-md-3"><label class="form-label">Education Weight</label><input id="educationWeight" class="form-control" type="number"></div>
        <div class="col-md-3"><label class="form-label">Projects Weight</label><input id="projectsWeight" class="form-control" type="number"></div>
        <div class="col-12"><button class="btn btn-brand" type="submit">Save Settings</button></div>
      </form>
    </div></div>`);
  $('#settingsForm').on('submit', saveSettings);
}
function loadSettings() { apiGet('/api/settings').done((s) => { $('#companyName').val(s.companyName); $('#maxResumeSizeMb').val(s.maxResumeSizeMb); $('#allowedResumeTypes').val((s.allowedResumeTypes || []).join(', ')); $('#skillsWeight').val(s.atsWeights?.skills); $('#experienceWeight').val(s.atsWeights?.experience); $('#educationWeight').val(s.atsWeights?.education); $('#projectsWeight').val(s.atsWeights?.projects); }).fail(handleAjaxError); }
function saveSettings(e) { e.preventDefault(); const payload = { companyName: $('#companyName').val(), maxResumeSizeMb: Number($('#maxResumeSizeMb').val()), allowedResumeTypes: $('#allowedResumeTypes').val().split(',').map(x => x.trim()).filter(Boolean), atsWeights: { skills: Number($('#skillsWeight').val()), experience: Number($('#experienceWeight').val()), education: Number($('#educationWeight').val()), projects: Number($('#projectsWeight').val()) } }; apiPut('/api/settings', payload).done(() => toast('Settings saved.')).fail(handleAjaxError); }
