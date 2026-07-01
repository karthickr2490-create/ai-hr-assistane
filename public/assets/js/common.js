function getSessionUser() {
  const raw = sessionStorage.getItem('aihr_user');
  try { return raw ? JSON.parse(raw) : null; } catch { return null; }
}

function requireLogin() {
  const user = getSessionUser();
  if (!user) window.location.href = 'login.html';
  return user;
}

function logout() {
  sessionStorage.removeItem('aihr_user');
  sessionStorage.removeItem('aihr_token');
  window.location.href = 'login.html';
}

function toast(message, type = 'success') {
  const id = `toast-${Date.now()}`;
  const html = `
    <div id="${id}" class="toast align-items-center text-bg-${type} border-0 mb-2" role="alert" aria-live="assertive" aria-atomic="true">
      <div class="d-flex">
        <div class="toast-body">${escapeHtml(message)}</div>
        <button type="button" class="btn-close btn-close-white me-2 m-auto" data-bs-dismiss="toast" aria-label="Close"></button>
      </div>
    </div>`;
  if (!$('#toastHost').length) $('body').append('<div id="toastHost" class="toast-container position-fixed top-0 end-0 p-3" style="z-index: 2000"></div>');
  $('#toastHost').append(html);
  const toastEl = new bootstrap.Toast(document.getElementById(id), { delay: 3200 });
  toastEl.show();
}

function escapeHtml(value) {
  return String(value ?? '')
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#039;');
}

function apiGet(url) {
  return $.ajax({ url: API_BASE + url, method: 'GET', dataType: 'json' });
}

function apiPost(url, data) {
  return $.ajax({ url: API_BASE + url, method: 'POST', contentType: 'application/json', data: JSON.stringify(data), dataType: 'json' });
}

function apiPut(url, data) {
  return $.ajax({ url: API_BASE + url, method: 'PUT', contentType: 'application/json', data: JSON.stringify(data), dataType: 'json' });
}

function apiDelete(url) {
  return $.ajax({ url: API_BASE + url, method: 'DELETE', dataType: 'json' });
}

function handleAjaxError(xhr) {
  const message = xhr?.responseJSON?.message || xhr?.responseText || 'Something went wrong.';
  toast(message, 'danger');
}

function setPageTitle(title, subtitle) {
  $('#pageTitle').text(title);
  $('#pageSubtitle').text(subtitle || '');
  document.title = `${title} - AI HR Assistant`;
}

function renderShell(activePage) {
  const user = getSessionUser() || { fullName: 'HR Manager', role: 'Admin' };
  const links = [
    ['dashboard.html', 'Dashboard', 'dashboard'],
    ['job-description.html', 'Job Description', 'jobs'],
    ['candidate-upload.html', 'Candidate Upload', 'candidates'],
    ['resume-screening.html', 'Resume Screening', 'screening'],
    ['ats-score.html', 'ATS Score', 'ats'],
    ['shortlisted-candidates.html', 'Shortlisted', 'shortlisted'],
    ['interview-schedule.html', 'Interviews', 'interviews'],
    ['reports.html', 'Reports', 'reports'],
    ['settings.html', 'Settings', 'settings']
  ];
  const navLinks = links.map(([href, label, key]) => `<a class="nav-link sidebar-link px-3 py-2 ${activePage === key ? 'active' : ''}" href="${href}">${label}</a>`).join('');
  $('#appShell').prepend(`
    <nav class="navbar navbar-expand-lg bg-white border-bottom sticky-top">
      <div class="container-fluid px-3 px-lg-4">
        <a class="navbar-brand d-flex align-items-center gap-2 fw-bold" href="dashboard.html">
          <span class="navbar-brand-badge brand-gradient">AI</span>
          <span>AI HR Assistant</span>
        </a>
        <button class="navbar-toggler" type="button" data-bs-toggle="collapse" data-bs-target="#mainNav" aria-controls="mainNav" aria-expanded="false" aria-label="Toggle navigation">
          <span class="navbar-toggler-icon"></span>
        </button>
        <div class="collapse navbar-collapse" id="mainNav">
          <div class="navbar-nav d-lg-none mt-3 mb-2">${navLinks}</div>
          <div class="ms-auto d-flex align-items-center gap-3 mt-3 mt-lg-0">
            <div class="text-end small d-none d-sm-block">
              <div class="fw-bold">${escapeHtml(user.fullName)}</div>
              <div class="text-muted">${escapeHtml(user.role || 'HR')}</div>
            </div>
            <button class="btn btn-outline-secondary btn-sm" onclick="logout()">Logout</button>
          </div>
        </div>
      </div>
    </nav>
    <div class="container-fluid">
      <div class="row">
        <aside class="col-lg-2 app-sidebar d-none d-lg-block p-3">
          <nav class="nav flex-column gap-1">${navLinks}</nav>
        </aside>
        <section class="col-12 col-lg-10 page-wrapper">
          <div class="d-flex justify-content-between align-items-start flex-wrap gap-3 mb-4">
            <div>
              <h1 id="pageTitle" class="h3 fw-bold mb-1"></h1>
              <p id="pageSubtitle" class="text-muted mb-0"></p>
            </div>
          </div>
          <div id="pageContent"></div>
        </section>
      </div>
    </div>
  `);
}

function csvDownload(filename, rows) {
  if (!rows || !rows.length) return toast('No rows available to export.', 'warning');
  const headers = Object.keys(rows[0]);
  const csv = [headers.join(',')].concat(rows.map(row => headers.map(header => `"${String(row[header] ?? '').replaceAll('"', '""')}"`).join(','))).join('\n');
  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
  const link = document.createElement('a');
  link.href = URL.createObjectURL(blob);
  link.download = filename;
  link.click();
  URL.revokeObjectURL(link.href);
}
