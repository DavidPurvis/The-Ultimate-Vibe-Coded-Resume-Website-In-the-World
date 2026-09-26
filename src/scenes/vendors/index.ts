/** "Manage 3,000 Fictional Partners" — paginated, neighbour-flipping, connected to nothing. */
import {
  categories,
  fortunes,
  namedPartners,
  vendorWords,
  vendorsDialog,
  biscotti as biscottiCopy,
} from '../../content/copy/cookies';
import {
  generateVendors,
  initialStates,
  pageSlice,
  PAGES,
  PER_PAGE,
  toggle,
  type Vendor,
} from './logic';
import { makeBiscotti } from '../cookie-banner/logic';
import { readRaw, removeRaw, writeRaw, listKeys } from '../../lib/storage';
import { openDialog } from '../../lib/dialog';
import { toast } from '../../lib/toast';
import { bump } from '../../lib/threat';

let vendors: Vendor[] | null = null;
let states: boolean[] = [];
let page = 1;
let fortuneIdx = 0;

function ensure(): void {
  if (!vendors) {
    vendors = generateVendors(namedPartners, vendorWords);
    states = initialStates(vendors);
  }
}

function render(dialog: HTMLDialogElement): void {
  ensure();
  const list = dialog.querySelector<HTMLOListElement>('[data-vd-list]');
  const label = dialog.querySelector<HTMLElement>('[data-vd-page]');
  if (!list || !vendors) return;
  const start = (page - 1) * PER_PAGE;
  list.start = start + 1;
  list.replaceChildren(
    ...pageSlice(vendors, page).map((v, k) => {
      const i = start + k;
      const li = document.createElement('li');
      const n = document.createElement('span');
      n.className = 'vd-row__n';
      n.textContent = `#${String(i + 1).padStart(4, '0')}`;
      const text = document.createElement('div');
      text.className = 'vd-row__text';
      const strong = document.createElement('strong');
      strong.id = `vd-${i}`;
      strong.textContent = v.name;
      const purpose = document.createElement('span');
      purpose.className = 'fine';
      purpose.textContent = `Purpose: ${v.purpose}${v.detail ? ` ${v.detail}` : ''}`;
      text.append(strong, purpose);
      const sw = document.createElement('button');
      sw.type = 'button';
      sw.className = 'switch';
      sw.setAttribute('role', 'switch');
      sw.setAttribute('aria-checked', String(states[i]));
      sw.setAttribute('aria-labelledby', `vd-${i}`);
      if (v.lockedOff) sw.setAttribute('aria-disabled', 'true');
      sw.dataset.vd = String(i);
      const track = document.createElement('span');
      track.className = 'switch__track';
      track.setAttribute('aria-hidden', 'true');
      sw.append(track);
      li.append(n, text, sw);
      return li;
    }),
  );
  if (label) label.textContent = vendorsDialog.page(page, PAGES);
  const jump = dialog.querySelector<HTMLInputElement>('[data-vd-jump]');
  if (jump) jump.value = '';
}

function syncSwitches(dialog: HTMLDialogElement): void {
  dialog.querySelectorAll<HTMLElement>('[data-vd]').forEach((sw) => {
    sw.setAttribute('aria-checked', String(states[Number(sw.dataset.vd)]));
  });
}

function wireOnce(dialog: HTMLDialogElement, onSave: () => void): void {
  if (dialog.dataset.vdWired) return;
  dialog.dataset.vdWired = '1';
  dialog.addEventListener('click', (e) => {
    const t = e.target as HTMLElement;
    const sw = t.closest<HTMLElement>('[data-vd]');
    if (sw && vendors) {
      if (sw.getAttribute('aria-disabled') === 'true') return;
      states = toggle(states, vendors, Number(sw.dataset.vd));
      syncSwitches(dialog);
      return;
    }
    const cat = t.closest<HTMLElement>('[data-cat]');
    if (cat) {
      const id = cat.dataset.cat;
      const c = categories.find((x) => x.id === id);
      const out = dialog.querySelector<HTMLElement>(`[data-cat-result="${id}"]`);
      if (!c || !out) return;
      if (c.locked) {
        out.textContent = c.on;
        return;
      }
      const on = cat.getAttribute('aria-checked') !== 'true';
      cat.setAttribute('aria-checked', String(on));
      out.textContent =
        c.id === 'fortune' && on
          ? (fortunes[fortuneIdx++ % fortunes.length] ?? '')
          : on
            ? c.on
            : c.off;
      return;
    }
    if (t.closest('[data-vd-prev]')) {
      page = Math.max(1, page - 1);
      render(dialog);
    } else if (t.closest('[data-vd-next]')) {
      page = Math.min(PAGES, page + 1);
      render(dialog);
    } else if (t.closest('[data-vd-reset]')) {
      if (vendors) states = initialStates(vendors);
      syncSwitches(dialog);
      toast(vendorsDialog.resetToast);
    } else if (t.closest('[data-vd-save]')) {
      dialog.close('save');
      onSave();
    } else if (t.closest('[data-biscotti-accept]')) {
      acceptBiscotti(dialog);
    }
  });
  dialog.querySelector<HTMLInputElement>('[data-vd-jump]')?.addEventListener('change', (e) => {
    const v = Number((e.target as HTMLInputElement).value);
    if (Number.isFinite(v)) {
      page = Math.min(PAGES, Math.max(1, Math.round(v)));
      render(dialog);
    }
  });
}

function acceptBiscotti(dialog: HTMLDialogElement): void {
  const out = dialog.querySelector<HTMLElement>('[data-biscotti-receipt]');
  const all = makeBiscotti(biscottiCopy.names, biscottiCopy.kinds);
  for (const b of all)
    writeRaw('local', b.key, JSON.stringify({ name: b.name, kind: b.kind, art: b.art }));
  bump('biscotti');
  if (!out) return;
  out.replaceChildren();
  const p = document.createElement('p');
  p.className = 'receipt';
  p.setAttribute('role', 'status');
  p.textContent = biscottiCopy.receipt;
  const view = document.createElement('button');
  view.type = 'button';
  view.className = 'btn btn--small';
  view.textContent = biscottiCopy.view;
  const remove = document.createElement('button');
  remove.type = 'button';
  remove.className = 'btn btn--small';
  remove.textContent = biscottiCopy.remove;
  const pre = document.createElement('pre');
  pre.className = 'biscotti-pre';
  pre.hidden = true;
  view.addEventListener('click', () => {
    const first = readRaw('local', all[0]?.key ?? '');
    pre.hidden = !pre.hidden;
    pre.textContent = all
      .slice(0, 6)
      .map((b) => `#${b.n} ${b.name} (${b.kind})\n${b.art}`)
      .join('\n\n');
    if (!first) pre.textContent = '(Nothing is stored. The biscotti have already left.)';
  });
  remove.addEventListener('click', () => {
    for (const k of listKeys()) if (k.key.startsWith('uvcr:biscotti:')) removeRaw(k.area, k.key);
    out.replaceChildren();
    toast(biscottiCopy.removed);
  });
  const row = document.createElement('div');
  row.className = 'btn-row';
  row.append(view, remove);
  out.append(p, row, pre);
}

export function openVendors(opener: HTMLElement | null, onSave: () => void): void {
  const dialog = document.getElementById('vendors') as HTMLDialogElement | null;
  if (!dialog) return;
  wireOnce(dialog, onSave);
  render(dialog);
  openDialog(dialog, { opener });
}
