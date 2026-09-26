/** /legal/ — live storage disclosure + reset, Terms of Reading, detected panel, stickers, one real notification. */
import { clearAll, listKeys, readPrefs, writePrefs } from '../../lib/storage';
import { reducedMotion } from '../../lib/motion';
import { toast } from '../../lib/toast';
import { announce } from '../../lib/announce';
import { Disposer } from '../../lib/scene';
import { url } from '../../lib/paths';
import { buildDetected } from './logic';

const read = <T>(sel: string, key: string): T =>
  JSON.parse(document.querySelector<HTMLElement>(sel)?.dataset[key] ?? '{}') as T;

/* ---------- Storage disclosure (the one part that is not a joke) ---------- */
const facts = read<{
  purposes: Record<string, string>;
  where: Record<string, string>;
  empty: string;
  resetToast: string;
}>('[data-storage-copy]', 'storageCopy');
function renderStorage(): void {
  const body = document.querySelector<HTMLTableSectionElement>('[data-storage-rows]');
  if (!body) return;
  const keys = listKeys();
  const rows = new Map<string, { area: string; bytes: number; count: number }>();
  for (const k of keys) {
    const name = k.key.startsWith('uvcr:biscotti:') ? 'uvcr:biscotti:01…50' : k.key;
    const row = rows.get(name) ?? { area: k.area, bytes: 0, count: 0 };
    row.bytes += k.bytes;
    row.count += 1;
    rows.set(name, row);
  }
  if (!rows.size) {
    const tr = document.createElement('tr');
    const td = document.createElement('td');
    td.colSpan = 4;
    td.className = 'fine';
    td.textContent = facts.empty;
    tr.append(td);
    body.replaceChildren(tr);
    return;
  }
  body.replaceChildren(
    ...[...rows].map(([name, r]) => {
      const tr = document.createElement('tr');
      const purposeKey = name.startsWith('uvcr:biscotti') ? 'uvcr:biscotti' : name;
      const cells = [
        name,
        facts.where[r.area] ?? r.area,
        `${r.bytes} bytes${r.count > 1 ? ` (${r.count} keys)` : ''}`,
        facts.purposes[purposeKey] ?? '',
      ];
      cells.forEach((c, i) => {
        const td = document.createElement('td');
        if (i === 0) {
          const code = document.createElement('code');
          code.textContent = c;
          td.append(code);
        } else td.textContent = c;
        tr.append(td);
      });
      return tr;
    }),
  );
}
renderStorage();
document.querySelector('[data-storage-reset]')?.addEventListener('click', () => {
  clearAll();
  renderStorage();
  toast(facts.resetToast);
  announce(facts.resetToast);
});
window.addEventListener('storage', renderStorage);

/* ---------- Terms of Reading: the scrollbar grows as you read (finitely) ---------- */
const tos = read<{ appended: string[]; receipt: string }>('[data-tos-copy]', 'tosCopy');
const more = document.querySelector<HTMLElement>('[data-tos-more]');
const sentinel = document.querySelector<HTMLElement>('[data-tos-sentinel]');
const accept = document.querySelector<HTMLButtonElement>('[data-tos-accept]');
const box = document.querySelector<HTMLElement>('[data-tos]');
let added = 0;
if (more && sentinel && box && typeof IntersectionObserver !== 'undefined') {
  const io = new IntersectionObserver(
    (entries) => {
      if (!entries.some((e) => e.isIntersecting)) return;
      const next = tos.appended[added];
      if (next === undefined) return;
      const p = document.createElement('p');
      p.textContent = next;
      more.append(p);
      added += 1;
      if (added >= tos.appended.length) {
        io.disconnect();
        accept?.removeAttribute('aria-disabled');
      }
    },
    { root: box, threshold: 1 },
  );
  io.observe(sentinel);
} else {
  // No IntersectionObserver: show every clause at once.
  for (const t of tos.appended) {
    const p = document.createElement('p');
    p.textContent = t;
    more?.append(p);
  }
  accept?.removeAttribute('aria-disabled');
}
accept?.addEventListener('click', () => {
  if (accept.getAttribute('aria-disabled') === 'true') return;
  const r = document.querySelector<HTMLElement>('[data-tos-receipt]');
  if (r) r.textContent = tos.receipt;
});

/* ---------- We've detected… ---------- */
const list = document.querySelector<HTMLElement>('[data-detected]');
function renderDetected(): void {
  if (!list) return;
  let tz: string | undefined;
  try {
    tz = Intl.DateTimeFormat().resolvedOptions().timeZone;
  } catch {
    tz = undefined;
  }
  const lines = buildDetected({
    cores: navigator.hardwareConcurrency || undefined,
    now: new Date(),
    timeZone: tz,
    language: navigator.language || undefined,
    reducedMotion: reducedMotion(),
  });
  list.replaceChildren(
    ...lines.map((l) => {
      const li = document.createElement('li');
      li.dataset.detect = l.id;
      const p = document.createElement('span');
      p.textContent = l.text;
      const d = document.createElement('details');
      const s = document.createElement('summary');
      s.textContent = 'How this works';
      const how = document.createElement('p');
      how.textContent = l.how;
      d.append(s, how);
      li.append(p, d);
      return li;
    }),
  );
}
renderDetected();
const d = new Disposer();
d.interval(renderDetected, 60_000);

/* ---------- Stickers (mock permissions) + one real notification ---------- */
const st = read<{
  camera: { result: string };
  location: { result: string };
  notify: {
    title: string;
    body: string;
    granted: string;
    denied: string;
    unsupported: string;
    used: string;
  };
}>('[data-sticker-copy]', 'stickerCopy');
document.querySelectorAll<HTMLElement>('[data-sticker]').forEach((el) => {
  el.addEventListener('click', (e) => {
    if (!(e.target as HTMLElement).closest('[data-sticker-btn]')) return;
    const key = el.dataset.sticker as 'camera' | 'location';
    const out = el.querySelector<HTMLElement>('[data-sticker-result]');
    if (out) out.textContent = st[key].result;
  });
});

const notifyBtn = document.querySelector<HTMLButtonElement>('[data-notify]');
const notifyOut = document.querySelector<HTMLElement>('[data-notify-result]');
if (notifyBtn && notifyOut) {
  if (!('Notification' in window)) {
    notifyBtn.hidden = true;
    notifyOut.textContent = st.notify.unsupported;
  } else if (readPrefs().notified) {
    notifyBtn.hidden = true;
    notifyOut.textContent = st.notify.used;
  }
  notifyBtn.addEventListener('click', async () => {
    if (readPrefs().notified) return;
    const perm = await Notification.requestPermission();
    if (perm === 'granted') {
      new Notification(st.notify.title, {
        body: st.notify.body,
        icon: url('/generated/icon-192.png'),
      });
      writePrefs({ notified: true });
      notifyOut.textContent = st.notify.granted;
      notifyBtn.hidden = true;
    } else {
      notifyOut.textContent = st.notify.denied;
    }
  });
}
