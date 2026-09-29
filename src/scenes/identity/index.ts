/**
 * Classification (Visitor Services): a major scene in one dialog, opened only from its control.
 * The declaration is stored the moment a result is shown; closing earlier stores nothing. The
 * optional transcription is recorded as done or skipped, and the textarea is emptied whenever the
 * procedure ends, so the text never outlives it.
 */
import { register, start, stop, type SceneCtx } from '../../lib/scene';
import { focusIn, openDialog } from '../../lib/dialog';
import { writeSession } from '../../lib/storage';
import { announce } from '../../runtime/announce';
import { bump } from '../../lib/threat';
import { classification as C, isModelId, models } from '../../content/copy/identity';
import {
  identityReducer,
  initialIdentity,
  snapshot,
  type IdentityEvent,
  type IdentityState,
} from './logic';

const ACTIONS: Readonly<Record<string, IdentityEvent>> = {
  human: { t: 'HUMAN' },
  automated: { t: 'AUTOMATED' },
  withhold: { t: 'WITHHOLD' },
  'confirm-human': { t: 'CONFIRM_HUMAN' },
  submit: { t: 'SUBMIT' },
  keep: { t: 'KEEP' },
  double: { t: 'DOUBLE' },
  prompt: { t: 'CHECK_PROMPT' },
  back: { t: 'BACK' },
  transcribe: { t: 'TRANSCRIBE' },
  transcribed: { t: 'TRANSCRIBED' },
  'skip-transcription': { t: 'SKIP_TRANSCRIPTION' },
};

const TITLES: Readonly<Record<string, string>> = {
  choose: C.choose.title,
  human: C.human.title,
  model: C.model.title,
  confirm: C.confirm.title,
  result: C.result.title,
  transcribe: C.transcribe.title,
};

let opener: HTMLElement | null = null;

register({
  id: 'identity',
  major: true,
  start(ctx: SceneCtx) {
    const dialog = document.getElementById('identity') as HTMLDialogElement | null;
    if (!dialog) return;
    const { d } = ctx;
    let state: IdentityState = identityReducer(initialIdentity, { t: 'OPEN' });
    const $ = <T extends HTMLElement>(sel: string) => dialog.querySelector<T>(sel);
    const textarea = $<HTMLTextAreaElement>('[data-id-text]');

    const render = (): void => {
      const title = $<HTMLElement>('h2');
      dialog.querySelectorAll<HTMLElement>('[data-phase]').forEach((sec) => {
        sec.hidden = sec.dataset.phase !== state.phase;
      });
      if (title) title.textContent = TITLES[state.phase] ?? C.choose.title;
      const model = state.model ? models[state.model] : null;

      if (state.phase === 'model') {
        const err = $<HTMLElement>('[data-id-error]');
        if (err) err.hidden = state.error !== 'empty';
        dialog.querySelectorAll<HTMLInputElement>('input[name="model"]').forEach((r) => {
          r.checked = r.value === state.pending;
        });
      } else if (state.phase === 'confirm' && model) {
        const line = $<HTMLElement>('[data-id-confirm-line]');
        if (line) line.textContent = model.confirm;
        const keep = $<HTMLElement>('[data-id-keep-label]');
        if (keep) keep.textContent = C.confirm.keep(model.label);
      } else if (state.phase === 'result') {
        const [stampText, line] =
          state.declared === 'withheld'
            ? [C.withheld.stamp, C.withheld.result]
            : state.declared === 'human'
              ? [C.human.stamp, C.human.result]
              : [model?.stamp ?? '', model?.result ?? ''];
        const tpl = $<HTMLTemplateElement>('[data-stamp-template]');
        const holder = $<HTMLElement>('[data-id-stamp]');
        if (tpl && holder) {
          const frag = tpl.content.cloneNode(true) as DocumentFragment;
          const stamp = frag.querySelector<HTMLElement>('.stamp');
          if (stamp) {
            stamp.textContent = stampText;
            stamp.setAttribute('aria-label', `Stamp: ${stampText}`);
          }
          holder.replaceChildren(frag);
        }
        const res = $<HTMLElement>('[data-id-result]');
        if (res) res.textContent = line;
        const analysis = $<HTMLElement>('[data-id-analysis]');
        if (analysis)
          analysis.textContent =
            state.transcription === 'done'
              ? C.result.transcribed
              : state.transcription === 'skipped'
                ? C.result.skipped
                : state.confirmation === 'prompt'
                  ? C.confirm.promptNote
                  : '';
        const transcribe = $<HTMLElement>('[data-id="transcribe"]');
        if (transcribe)
          transcribe.hidden = state.declared === 'withheld' || state.transcription !== null;
      }
      focusIn(dialog, title);
      if (title?.textContent) announce(title.textContent);
    };

    const dispatch = (e: IdentityEvent): void => {
      const prev = state;
      state = identityReducer(state, e);
      if (state === prev) {
        if (e.t === 'SUBMIT') render();
        return;
      }
      if (e.t === 'TRANSCRIBED' || e.t === 'SKIP_TRANSCRIPTION') {
        if (textarea) textarea.value = '';
      }
      if (state.phase === 'dismissed') {
        stop('identity', 'complete');
        return;
      }
      if (state.phase === 'result') {
        const snap = snapshot(state);
        if (snap) writeSession({ identity: snap });
        if (prev.phase !== 'transcribe')
          bump(state.declared === 'withheld' ? 'refused' : 'identityComplete');
      }
      render();
    };

    d.on(dialog, 'click', (ev) => {
      const act = (ev.target as HTMLElement).closest<HTMLElement>('[data-id]')?.dataset.id ?? '';
      const e = ACTIONS[act];
      if (e) dispatch(e);
    });
    d.on(dialog, 'change', (ev) => {
      const r = ev.target as HTMLInputElement;
      if (r.name === 'model' && isModelId(r.value)) dispatch({ t: 'SELECT', id: r.value });
    });
    d.add(() => {
      if (textarea) textarea.value = ''; // the transcription never outlives the procedure
      if (dialog.open) dialog.close('dispose');
    });
    openDialog(dialog, {
      opener,
      onClose: () => dispatch({ t: 'CLOSE' }),
    });
    render();
  },
});

/** Opened only from its control in Visitor Services. */
document.addEventListener('click', (e) => {
  const b = (e.target as HTMLElement | null)?.closest<HTMLElement>('[data-open-identity]');
  if (!b) return;
  opener = b;
  void start('identity');
});
