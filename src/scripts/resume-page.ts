document.querySelector('[data-print]')?.addEventListener('click', () => window.print());

const mode = new URLSearchParams(location.search).get('mode');
if (mode === 'recruiter' || mode === 'chaos') {
  void import('../lib/storage').then(({ writePrefs }) => writePrefs({ mode }));
}
