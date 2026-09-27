/**
 * /privacy/: lists exactly what this site has stored in the browser, and clears it on request.
 * It also removes the previous site's keys first, so the table shows only what is current.
 */
import { mountPage } from '../runtime/lifecycle';
import { announce } from '../runtime/announce';
import { cleanupLegacy } from '../runtime/legacy';
import { clearAll, listKeys } from '../lib/storage';

interface Copy {
  areas: Record<'session' | 'local', string>;
  cleared: string;
}

mountPage(({ scope }) => {
  const rows = document.querySelector<HTMLElement>('[data-storage-rows]');
  const empty = document.querySelector<HTMLElement>('[data-storage-empty]');
  const reset = document.querySelector<HTMLButtonElement>('[data-storage-reset]');
  const raw = document.querySelector<HTMLElement>('[data-storage-copy]')?.dataset.storageCopy;
  if (!rows || !empty || !reset || !raw) return;
  const copy = JSON.parse(raw) as Copy;

  const render = () => {
    const keys = listKeys();
    rows.replaceChildren(
      ...keys.map((k) => {
        const tr = document.createElement('tr');
        for (const text of [k.key, copy.areas[k.area], `${k.bytes} bytes`]) {
          const td = document.createElement('td');
          td.textContent = text;
          tr.append(td);
        }
        return tr;
      }),
    );
    empty.hidden = keys.length > 0;
  };

  cleanupLegacy();
  render();
  scope.on(reset, 'click', () => {
    clearAll();
    render();
    announce(copy.cleared);
  });
});
