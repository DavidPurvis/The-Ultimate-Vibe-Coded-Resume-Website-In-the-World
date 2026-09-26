/** Landing page: the Identity Checkpoint dialog and the evasive "I am not a robot" button. */
import { register, start, stop, Disposer, type SceneCtx } from '../../lib/scene';
import { focusIn, openDialog } from '../../lib/dialog';
import { readPrefs, readSession, writeSession } from '../../lib/storage';
import { isChaos, onModeChange } from '../../lib/mode';
import { announce } from '../../lib/announce';
import { toast } from '../../lib/toast';
import { bump } from '../../lib/threat';
import { runaway } from '../../lib/runaway';
import { isKeyboardClick } from '../../lib/motion';
import {
  identities,
  identityDialog as D,
  landing,
  type IdentityId,
} from '../../content/copy/identity';
import {
  identityReducer,
  initialIdentity,
  snapshot,
  type IdentityEvent,
  type IdentityState,
} from './logic';
import { BANNER_RESOLVED } from '../cookie-banner';
import { renderIdentityCallback } from '../../lib/identityCallback';

const dialog = document.getElementById('identity') as HTMLDialogElement | null;
let state: IdentityState = initialIdentity;

function render(): void {
  if (!dialog) return;
  const title = dialog.querySelector<HTMLElement>('h2');
  for (const sec of dialog.querySelectorAll<HTMLElement>('[data-phase]')) {
    sec.hidden = sec.dataset.phase !== state.phase;
  }
  const step = dialog.querySelector<HTMLElement>('[data-id-step]');
  if (step) step.textContent = state.phase === 'final' ? D.bonusRound : '';
  const claimed = state.claimed ? identities[state.claimed] : null;

  if (state.phase === 'choose') {
    if (title) title.textContent = D.choose.title;
    const err = dialog.querySelector<HTMLElement>('[data-id-error]');
    if (err) err.hidden = state.error !== 'empty';
    dialog.querySelectorAll<HTMLInputElement>('input[name="identity"]').forEach((r) => {
      r.checked = r.value === state.pending;
    });
  } else if (state.phase === 'confirm' && claimed) {
    if (title) title.textContent = D.confirm.title;
    const line = dialog.querySelector<HTMLElement>('[data-id-confirm-line]');
    if (line) line.textContent = claimed.confirm;
    const keep = dialog.querySelector<HTMLElement>('[data-id-keep-label]');
    if (keep) keep.textContent = D.confirm.keep(claimed.label);
  } else if (state.phase === 'final') {
    if (title) title.textContent = D.final.title;
  } else if (state.phase === 'result') {
    const refused = state.refused;
    if (title) title.textContent = refused ? D.refused.title : D.result.title;
    const stampText = refused ? D.refused.stamp : (claimed?.stamp ?? '');
    const tpl = dialog.querySelector<HTMLTemplateElement>('[data-stamp-template]');
    const holder = dialog.querySelector<HTMLElement>('[data-id-stamp]');
    if (tpl && holder) {
      const frag = tpl.content.cloneNode(true) as DocumentFragment;
      const stamp = frag.querySelector<HTMLElement>('.stamp');
      if (stamp) {
        stamp.textContent = stampText;
        stamp.setAttribute('aria-label', `Stamp: ${stampText}`);
      }
      holder.replaceChildren(frag);
    }
    const res = dialog.querySelector<HTMLElement>('[data-id-result]');
    if (res) res.textContent = refused ? D.refused.body : (claimed?.result ?? '');
    const analysis = dialog.querySelector<HTMLElement>('[data-id-analysis]');
    if (analysis) {
      analysis.textContent = refused
        ? ''
        : state.confirmation === 'prompt'
          ? D.result.analysisPrompt
          : state.finalSkipped
            ? D.result.analysisSkipped
            : D.result.analysisText;
    }
  }
  focusIn(dialog, title);
  if (title?.textContent) announce(title.textContent);
}

function dispatch(e: IdentityEvent): void {
  const prev = state;
  state = identityReducer(state, e);
  if (state === prev) return;
  if (e.t === 'CHANGE') toast(D.confirm.changeToast);
  if (state.phase === 'complete') {
    writeSession({ identity: snapshot(state) });
    bump(state.refused ? 'refused' : 'identityComplete');
    renderIdentityCallback();
    stop('identity', 'complete');
    if (!state.refused && state.claimed) toast(D.result.toast(identities[state.claimed].label));
    return;
  }
  if (state.phase === 'dismissed') {
    stop('identity', 'complete');
    return;
  }
  render();
}

register({
  id: 'identity',
  major: true,
  start(ctx: SceneCtx) {
    if (!dialog) return;
    const { d } = ctx;
    const opener = document.querySelector<HTMLElement>('[data-open-identity]');
    state = identityReducer(
      {
        ...initialIdentity,
        claimed: (readSession().identity?.claimed as IdentityId | null) ?? null,
        phase: 'idle',
      },
      { t: 'OPEN' },
    );
    writeSession({ identityPrompted: true });
    const onClick = (ev: Event) => {
      const b = (ev.target as HTMLElement).closest<HTMLElement>('[data-id]');
      if (!b) return;
      const map: Record<string, IdentityEvent> = {
        submit: { t: 'SUBMIT' },
        refuse: { t: 'REFUSE' },
        keep: { t: 'KEEP' },
        double: { t: 'DOUBLE' },
        prompt: { t: 'CHECK_PROMPT' },
        change: { t: 'CHANGE' },
        skip: { t: 'SKIP_FINAL' },
        continue: { t: 'CONTINUE' },
      };
      const act = b.dataset.id ?? '';
      if (act === 'verify') {
        const text = dialog.querySelector<HTMLTextAreaElement>('[data-id-text]')?.value ?? '';
        dispatch({ t: 'VERIFY_TEXT', text });
      } else if (map[act]) dispatch(map[act]);
    };
    const onChange = (ev: Event) => {
      const r = ev.target as HTMLInputElement;
      if (r.name === 'identity') dispatch({ t: 'SELECT', id: r.value as IdentityId });
    };
    d.on(dialog, 'click', onClick);
    d.on(dialog, 'change', onChange);
    d.add(() => {
      const ta = dialog.querySelector<HTMLTextAreaElement>('[data-id-text]');
      if (ta) ta.value = ''; // the transcription never outlives the dialog
      if (dialog.open) dialog.close('dispose');
    });
    openDialog(dialog, {
      opener,
      onClose: () => {
        if (state.phase !== 'complete' && state.phase !== 'dismissed') dispatch({ t: 'CLOSE' });
      },
    });
    render();
  },
});

/* ---------- "I am not a robot" ---------- */
let robotD: Disposer | null = null;
function mountRobot(): void {
  const btn = document.querySelector<HTMLAnchorElement>('[data-robot]');
  const arena = document.querySelector<HTMLElement>('[data-robot-arena]');
  if (!btn || !arena) return;
  robotD?.run();
  robotD = new Disposer();
  if (!isChaos()) return;
  runaway(
    {
      id: 'robot',
      el: btn,
      arena,
      mode: 'proximity',
      maxDodges: 3,
      radius: 90,
      distance: 140,
      labels: landing.robotLabels,
      onDodge: () => bump('dodge'),
    },
    robotD,
  );
}

document.querySelector<HTMLAnchorElement>('[data-robot]')?.addEventListener('click', (e) => {
  if (!isChaos() || !isKeyboardClick(e)) return;
  e.preventDefault();
  toast(landing.keyboardToast);
  const href = (e.currentTarget as HTMLAnchorElement).href;
  setTimeout(() => location.assign(href), 900);
});

document
  .querySelector('[data-open-identity]')
  ?.addEventListener('click', () => void start('identity'));

mountRobot();
onModeChange(mountRobot);

/* Auto-open once per tab, after the cookie banner is dealt with. */
function autoOpen(): void {
  if (!isChaos() || readSession().identityPrompted) return;
  setTimeout(() => void start('identity'), 600);
}
if (readPrefs().cookieBanner === 'pending') {
  document.addEventListener(BANNER_RESOLVED, autoOpen, { once: true });
} else {
  autoOpen();
}
