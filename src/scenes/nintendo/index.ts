/** Nintendo Legal may confirm they will not sue. So may anyone else. It is recorded nowhere. */
const btn = document.querySelector<HTMLButtonElement>('[data-no-sue]');
const receipt = document.querySelector<HTMLElement>('[data-no-sue-receipt]');
btn?.addEventListener('click', () => {
  if (!receipt) return;
  receipt.hidden = false;
  btn.disabled = true;
});
