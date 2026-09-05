const toggle = document.querySelector('.theme-toggle');
const icon = toggle?.querySelector('.theme-icon');
const label = toggle?.querySelector('.theme-toggle-label');

function isDarkTheme() {
  return document.documentElement.dataset.theme === 'dark';
}

function renderToggle() {
  const dark = isDarkTheme();
  toggle.setAttribute('aria-pressed', String(dark));
  toggle.setAttribute('aria-label', dark ? 'Ativar tema claro' : 'Ativar tema escuro');
  icon.textContent = dark ? '☀' : '☾';
  label.textContent = dark ? 'Tema claro' : 'Tema escuro';
}

if (toggle) {
  renderToggle();
  toggle.addEventListener('click', () => {
    document.documentElement.dataset.theme = isDarkTheme() ? 'light' : 'dark';
    if (!isDarkTheme()) delete document.documentElement.dataset.theme;
    localStorage.setItem('incident-hub-theme', isDarkTheme() ? 'dark' : 'light');
    renderToggle();
  });
}
