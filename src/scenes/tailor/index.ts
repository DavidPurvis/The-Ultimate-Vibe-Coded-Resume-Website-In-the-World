/**
 * Résumé For You™: read the answers, show the verified cut that fits, and point the Claude link at
 * a pre-filled message. Nothing here sends or stores anything; the link only goes anywhere if the
 * visitor presses it. The quiz logic is a same-origin chunk loaded on the first "Assemble".
 */
import { announce } from '../../runtime/announce';
import { reducedMotion } from '../../runtime/modality';
import type { LaneId } from '../../content/resume/resolve';
import type { Family, Focus, PromptLabels, TailorAnswers } from './logic';

let logic: Promise<typeof import('./logic')> | undefined;
const loadLogic = () => (logic ??= import('./logic'));

interface LaneData {
  label: string;
  url: string;
  text: string;
  href: string;
  pdf: string;
  pdfName: string;
  cut: string;
  why: string;
}
interface Data {
  lanes: Record<LaneId, LaneData>;
  labels: PromptLabels;
  fan: string;
  aliases: string[];
  processing: string;
  /** "{n} of 3,000 characters". */
  counter: string;
}

const root = document.querySelector<HTMLElement>('[data-tailor]');
const result = document.querySelector<HTMLElement>('[data-tailor-result]');
const raw = document.querySelector<HTMLElement>('[data-tailor-data]')?.dataset.tailorData;

if (root && result && raw) {
  const data = JSON.parse(raw) as Data;
  const $ = <T extends Element>(sel: string, from: ParentNode = result) =>
    from.querySelector<T>(sel);
  const assemble = $<HTMLButtonElement>('[data-tq-assemble]', root);
  const status = $<HTMLElement>('[data-tq-status]', root);
  const jd = $<HTMLTextAreaElement>('[data-tq-jd]', root);
  const counter = $<HTMLElement>('[data-tq-counter]', root);
  const alias = $<HTMLSelectElement>('[data-tq-alias]', root);
  const claude = $<HTMLAnchorElement>('[data-tr-claude]');
  const base = claude?.getAttribute('href') ?? '';

  const checked = (name: string) =>
    root.querySelector<HTMLInputElement>(`input[name="tq-${name}"]:checked`)?.value;

  const answers = (): TailorAnswers => ({
    family: checked('family') as Family | undefined,
    focus: checked('focus') as Focus | undefined,
    summary: checked('summary') as 'yes' | 'no' | undefined,
    jd: jd?.value ?? '',
  });

  const set = (sel: string, text: string) => {
    const el = $<HTMLElement>(sel);
    if (el) el.textContent = text;
  };

  const render = async () => {
    const { handoff, pickLane } = await loadLogic();
    const a = answers();
    const id = pickLane(a);
    const lane = data.lanes[id];
    set('[data-tr-cut]', lane.cut);
    set('[data-tr-why]', a.family === 'fan' ? `${data.fan} ${lane.why}` : lane.why);
    const aliasLine = data.aliases[Number(alias?.value ?? 0)] ?? '';
    const aliasEl = $<HTMLElement>('[data-tr-alias]');
    if (aliasEl) {
      aliasEl.textContent = aliasLine;
      aliasEl.hidden = !aliasLine;
    }
    const view = $<HTMLAnchorElement>('[data-tr-view]');
    if (view) view.href = lane.href;
    const pdf = $<HTMLAnchorElement>('[data-tr-pdf]');
    if (pdf) {
      pdf.href = lane.pdf;
      pdf.download = lane.pdfName;
    }
    const h = handoff(a, lane, data.labels, base);
    if (claude) claude.href = h.href;
    const prompt = $<HTMLTextAreaElement>('[data-tr-prompt]');
    if (prompt) prompt.value = h.prompt;
    const truncated = $<HTMLElement>('[data-tr-truncated]');
    if (truncated) truncated.hidden = !h.truncated;
  };

  const updateCounter = () => {
    if (counter && jd)
      counter.textContent = data.counter.replace('{n}', jd.value.length.toLocaleString('en-US'));
  };

  assemble?.addEventListener('click', () => {
    assemble.disabled = true;
    if (status) status.textContent = data.processing;
    void loadLogic();
    window.setTimeout(
      async () => {
        await render();
        result.hidden = false;
        assemble.disabled = false;
        if (status) status.textContent = '';
        result.focus();
        announce(result.querySelector('h2')?.textContent ?? '');
      },
      reducedMotion() ? 0 : 900,
    );
  });

  // Once the result is showing, keep it in step with the answers (quietly: no focus moves).
  const onChange = () => {
    updateCounter();
    if (!result.hidden) void render();
  };
  root.addEventListener('input', onChange);
  root.addEventListener('change', onChange);
}
