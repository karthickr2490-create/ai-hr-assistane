$(function () {
  $('#loginForm').on('submit', function (event) {
    event.preventDefault();
    const payload = {
      email: $('#loginEmail').val().trim(),
      password: $('#loginPassword').val().trim()
    };
    if (!payload.email || !payload.password) return toast('Email and password are required.', 'warning');
    apiPost('/api/login', payload)
      .done((response) => {
        sessionStorage.setItem('aihr_user', JSON.stringify(response.user));
        sessionStorage.setItem('aihr_token', response.token);
        window.location.href = 'dashboard.html';
      })
      .fail(handleAjaxError);
  });

  $('#signupForm').on('submit', function (event) {
    event.preventDefault();
    const payload = {
      fullName: $('#signupName').val().trim(),
      email: $('#signupEmail').val().trim(),
      password: $('#signupPassword').val().trim(),
      role: $('#signupRole').val()
    };
    if (!payload.fullName || !payload.email || !payload.password) return toast('All sign up fields are required.', 'warning');
    apiPost('/api/signup', payload)
      .done(() => {
        toast('Account created. You can login now.');
        $('#authTabs button[data-bs-target="#loginPane"]').tab('show');
        $('#signupForm')[0].reset();
      })
      .fail(handleAjaxError);
  });
});
