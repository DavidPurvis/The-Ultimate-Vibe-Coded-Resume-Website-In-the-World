/** "Skip this ad" skips to… another ad. Loaded on the first skip, so pages don't pay for it. */
interface Variant {
  id: string;
  style: string;
  text: string;
  small?: string;
  struck?: string;
}

export function skipAd(btn: HTMLElement): void {
  const ad = btn.closest<HTMLElement>('[data-parody-ad]');
  const raw = document.querySelector<HTMLElement>('[data-parody-ads]')?.dataset.parodyAds;
  const box = ad?.querySelector<HTMLElement>('[data-pb]');
  if (!ad || !raw || !box) return;
  const all = JSON.parse(raw) as Variant[];
  const i = all.findIndex((a) => a.id === ad.dataset.variant);
  const next = all[(i + 1) % all.length];
  if (!next) return;
  ad.dataset.variant = next.id;
  box.className = `pb pb--${next.style}`;
  const text = document.createElement('p');
  text.className = 'pb__text';
  if (next.struck)
    text.append(Object.assign(document.createElement('del'), { textContent: next.struck }));
  text.append(Object.assign(document.createElement('span'), { textContent: next.text }));
  const small = Object.assign(document.createElement('p'), {
    className: 'pb__small',
    textContent: next.small ?? '',
  });
  box.replaceChildren(text, small);
}
