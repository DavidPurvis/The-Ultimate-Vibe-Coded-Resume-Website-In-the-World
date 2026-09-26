/** /skills/ — "Inspect" flips a skin to show where the skill was actually used (pack evidence). */
document.querySelectorAll<HTMLButtonElement>('[data-inspect]').forEach((btn) => {
  const back = document.getElementById(btn.getAttribute('aria-controls') ?? '');
  const label = btn.querySelector('span');
  if (!back) return;
  back.hidden = true;
  btn.setAttribute('aria-expanded', 'false');
  btn.addEventListener('click', () => {
    const open = btn.getAttribute('aria-expanded') !== 'true';
    btn.setAttribute('aria-expanded', String(open));
    back.hidden = !open;
    if (label) label.textContent = (open ? btn.dataset.openLabel : btn.dataset.closedLabel) ?? '';
  });
});
