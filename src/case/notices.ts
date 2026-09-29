/**
 * The case record on the page. On entry the page records its department (once per session, never
 * in Direct access), states the status tier, and may show one new notice chosen by the case
 * policy. A notice counts as issued only once it is in a visible, permitted slot; nothing is
 * queued for later, and nothing appears over an active procedure. The words arrive with the page
 * (server-rendered JSON), so shared JavaScript carries no prose.
 */
import { isDirectAccess, onModeChange } from '../lib/mode';
import { majorActive } from '../lib/scene';
import { readPrefs, readSession } from '../lib/storage';
import { evidenceOf } from './evidence';
import { departmentOf, selectNotice, statusTier, type CategoryId, type StatusTier } from './policy';
import { updateCase } from './record';
import type { NoticeId } from './state';

export interface CaseCopy {
  status: Record<StatusTier, string>;
  notices: Record<NoticeId, string>;
  noticeLabel: string;
  cookie: { open: string; dismiss: string };
}

const CATEGORIES: readonly CategoryId[] = [
  'visitor-services',
  'records',
  'correspondence',
  'public-affairs',
  'recreation',
  'facilities',
];
const asCategory = (v: string | null): CategoryId | null => CATEGORIES.find((c) => c === v) ?? null;
const meta = (name: string): string | null =>
  document.querySelector<HTMLMetaElement>(`meta[name="${name}"]`)?.content ?? null;

/** In the page, not inside anything hidden, and actually rendered where the browser can say. */
function visible(el: HTMLElement): boolean {
  if (!el.isConnected || el.closest('[hidden]')) return false;
  const check = (el as HTMLElement & { checkVisibility?: () => boolean }).checkVisibility;
  return typeof check === 'function' ? check.call(el) : true;
}

function noticeElement(id: NoticeId, copy: CaseCopy): HTMLElement {
  const el = document.createElement('div');
  el.className = 'notice';
  el.dataset.notice = id;
  const p = document.createElement('p');
  p.className = 'notice__text';
  const label = document.createElement('strong');
  label.className = 'notice__label';
  label.textContent = copy.noticeLabel;
  p.append(label, ' ', copy.notices[id]);
  el.append(p);
  if (id === 'cookie-invitation') {
    const actions = document.createElement('div');
    actions.className = 'notice__actions';
    const open = document.createElement('button');
    open.type = 'button';
    open.className = 'btn btn--small';
    open.dataset.cookieAdmin = '';
    open.textContent = copy.cookie.open;
    const dismiss = document.createElement('button');
    dismiss.type = 'button';
    dismiss.className = 'btn btn--small btn--ghost';
    dismiss.textContent = copy.cookie.dismiss;
    dismiss.addEventListener('click', () => {
      el.remove();
      document.getElementById('main')?.focus({ preventScroll: true });
    });
    actions.append(open, dismiss);
    el.append(actions);
    // Once the visitor has answered, the invitation has nothing left to say. Focus inside it moves
    // to main rather than to nothing.
    document.addEventListener(
      'uvcr:cookies',
      () => {
        const hadFocus = el.contains(document.activeElement);
        el.remove();
        if (hadFocus) document.getElementById('main')?.focus({ preventScroll: true });
      },
      { once: true },
    );
  }
  return el;
}

export function initCaseRecord(): void {
  const bar = document.querySelector<HTMLElement>('[data-case-bar]');
  const status = bar?.querySelector<HTMLElement>('[data-status]');
  const text = bar?.querySelector<HTMLElement>('[data-status-text]');
  const slot = bar?.querySelector<HTMLElement>('[data-notice-slot]');
  const raw = bar?.dataset.caseCopy;
  const route = meta('department-route');
  if (!bar || !status || !text || !slot || !raw || route === null) return;
  const copy = JSON.parse(raw) as CaseCopy;

  const department = departmentOf(route);
  if (department && !isDirectAccess()) updateCase({ t: 'visit', department });

  // The line is already in the first paint with tier 0's words; only the words change here.
  const renderStatus = (): void => {
    status.hidden = isDirectAccess();
    if (!status.hidden)
      text.textContent = copy.status[statusTier(readSession().caseFile.departments.length)];
  };
  renderStatus();

  if (!isDirectAccess() && !majorActive()) {
    const s = readSession();
    const id = selectNotice(
      asCategory(meta('department-category')),
      evidenceOf(s, readPrefs()),
      s.caseFile,
    );
    if (id) {
      slot.replaceChildren(noticeElement(id, copy));
      if (visible(slot)) updateCase({ t: 'notice', id });
      else slot.replaceChildren();
    }
  }

  onModeChange((m) => {
    if (m === 'recruiter') slot.replaceChildren();
    renderStatus();
  });
}
