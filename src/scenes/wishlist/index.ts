/** "Add to cart" adds nothing, and returns the cart to the corral. */
import { toast } from '../../lib/toast';

const raw = document.querySelector<HTMLElement>('[data-wish-copy]')?.dataset.wishCopy;
const copy = raw ? (JSON.parse(raw) as { added: string }) : { added: '' };

document.querySelector('[data-wishes]')?.addEventListener('click', (e) => {
  const btn = (e.target as HTMLElement).closest<HTMLButtonElement>('[data-add-cart]');
  if (btn && copy.added) toast(copy.added);
});
