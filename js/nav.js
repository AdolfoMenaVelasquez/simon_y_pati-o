document.addEventListener('DOMContentLoaded', () => {
  const toggle = document.querySelector('.nav-toggle');
  const menu = document.querySelector('.site-nav ul');
  if (!toggle || !menu) return;

  toggle.addEventListener('click', () => {
    menu.classList.toggle('open');
  });

  menu.querySelectorAll('a').forEach((link) => {
    link.addEventListener('click', () => menu.classList.remove('open'));
  });

  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') menu.classList.remove('open');
  });
});