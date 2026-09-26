import { expect, test } from '@playwright/test';
import { seedPrefs, watchErrors } from './helpers';

test.describe('cookie compliance theater', () => {
  test('first visit: banner → accept → receipt → identity checkpoint opens @smoke', async ({
    page,
    context,
  }) => {
    const done = await watchErrors(page);
    await page.goto('./');
    const banner = page.locator('#cookie-consent-overlay');
    await expect(banner).toBeVisible();
    await expect(page.locator('#cb-title')).toBeFocused();
    await page
      .getByRole('button', {
        name: 'Accept All Cookies, Extended Liabilities, and Spiritual Surrender',
      })
      .click();
    await expect(banner).toContainText(
      'Stored on your device: ONE (1) boolean. We felt bad about it.',
    );
    await banner.getByRole('button', { name: 'Close', exact: true }).click();
    await expect(banner).toBeHidden();
    const prefs = await page.evaluate(() => JSON.parse(localStorage.getItem('uvcr:prefs') ?? '{}'));
    expect(prefs.cookieBanner).toBe('accepted');
    await expect(page.getByRole('dialog', { name: 'IDENTITY CHECKPOINT 1 of 2' })).toBeVisible({
      timeout: 3000,
    });
    expect(await context.cookies()).toEqual([]);
    await page.keyboard.press('Escape');
    await page.reload();
    await expect(banner).toBeHidden();
    await done();
  });

  test('Reject All dodges the mouse twice, then rejects', async ({ page }) => {
    await page.goto('./');
    const reject = page.locator('[data-cb="reject"]');
    for (let i = 0; i < 2; i++) {
      const box = await reject.boundingBox();
      await page.mouse.move(5, 5);
      await page.mouse.move((box?.x ?? 0) + 8, (box?.y ?? 0) + 8);
      await page.waitForTimeout(250);
    }
    await expect(reject).toHaveText('Fine. Reject All');
    await reject.click();
    await expect(page.locator('#cookie-consent-overlay')).toContainText(
      'The cookies have been informed',
    );
  });

  test('3,000 partners: paging, jumping, neighbour-flipping, reset', async ({ page }) => {
    await page.goto('./');
    await page.getByRole('button', { name: 'Manage Detailed Settings' }).click();
    const dialog = page.getByRole('dialog', { name: 'Manage 3,000 Fictional Partners' });
    await expect(dialog).toBeVisible();
    await expect(dialog.getByText('Page 1 of 60')).toBeVisible();
    await expect(dialog.getByText('DAVID ANALYTICS')).toBeVisible();
    const rows = dialog.locator('[data-vd]');
    await rows.nth(10).click();
    await expect(rows.nth(9)).toHaveAttribute('aria-checked', 'false');
    await expect(rows.nth(10)).toHaveAttribute('aria-checked', 'false');
    await expect(rows.nth(11)).toHaveAttribute('aria-checked', 'false');
    await expect(rows.nth(8)).toHaveAttribute('aria-checked', 'true');
    await dialog.getByRole('button', { name: 'Reset' }).click();
    await expect(rows.nth(10)).toHaveAttribute('aria-checked', 'true');
    await dialog.getByLabel('Jump to page').fill('60');
    await dialog.getByLabel('Jump to page').press('Enter');
    await dialog.getByLabel('Jump to page').blur();
    await expect(dialog.getByText('Page 60 of 60')).toBeVisible();
    await expect(dialog.locator('[data-vd]')).toHaveCount(50);
    await dialog.getByRole('button', { name: 'Save & close' }).click();
    await expect(page.locator('#cookie-consent-overlay')).toContainText(
      'Preferences applied to: nothing.',
    );
  });

  test('biscotti: exactly 50 namespaced drawings, removable', async ({ page }) => {
    await page.goto('./');
    await page.getByRole('button', { name: 'Manage Detailed Settings' }).click();
    await page.getByRole('button', { name: 'Accept all biscotti' }).click();
    const count = () =>
      page.evaluate(
        () => Object.keys(localStorage).filter((k) => k.startsWith('uvcr:biscotti:')).length,
      );
    expect(await count()).toBe(50);
    await page.getByRole('button', { name: 'Remove them' }).click();
    expect(await count()).toBe(0);
  });

  test('the cookie banner is load-bearing', async ({ page }) => {
    await page.goto('./');
    await expect(page.locator('#cookie-consent-overlay')).toBeVisible();
    await page.evaluate(() => document.querySelector('#cookie-consent-overlay')?.remove());
    const alert = page.getByRole('alertdialog');
    await expect(alert).toContainText('CRITICAL ERROR: The cookie banner was load-bearing.');
    await alert.getByRole('button', { name: 'Restore banner' }).click();
    await expect(page.locator('#cookie-consent-overlay')).toBeVisible();
    await expect(alert).toBeHidden();
  });
});

test.describe('identity checkpoint', () => {
  test.beforeEach(async ({ page }) => seedPrefs(page));

  test('Clippy → keep → transcribe → continue; identity survives, text does not', async ({
    page,
  }) => {
    await page.goto('./');
    const dialog = page.getByRole('dialog');
    await expect(dialog).toBeVisible({ timeout: 3000 });
    await dialog.getByLabel('Clippy').check();
    await dialog.getByRole('button', { name: 'Submit identity' }).click();
    await expect(dialog).toContainText('It looks like you’re trying to screen a candidate.');
    await dialog.getByRole('button', { name: 'Keep “Clippy”' }).click();
    await expect(dialog.getByRole('heading', { name: 'FINAL TEST' })).toBeVisible();
    await expect(dialog).toContainText('Checkpoint 3 of 2 (unannounced bonus round)');
    await dialog.getByLabel('Your transcription').fill('a casserole of pure existential dread');
    await dialog.getByRole('button', { name: 'Verify' }).click();
    await expect(dialog).toContainText('Paperclip credentials accepted. Please do not bend them.');
    await dialog.getByRole('button', { name: 'Continue' }).click();
    await expect(dialog).toBeHidden();
    await expect(page.locator('[data-identity-callback]')).toHaveText(
      'Welcome back, self-declared Clippy.',
    );
    const session = await page.evaluate(() => sessionStorage.getItem('uvcr:session') ?? '');
    expect(session).toContain('"claimed":"clippy"');
    expect(session).not.toContain('casserole');
    await page.goto('verify/');
    await expect(page.locator('[data-identity-callback]')).toHaveText(
      'Welcome back, self-declared Clippy.',
    );
  });

  test('refusing to be categorized is a valid outcome', async ({ page }) => {
    await page.goto('./');
    const dialog = page.getByRole('dialog');
    await dialog.getByRole('button', { name: 'I refuse to be categorized' }).click();
    await expect(dialog).toContainText(
      'Your refusal has been entered into the refusal database, which does not exist.',
    );
    await dialog.getByRole('button', { name: 'Continue' }).click();
    await expect(page.locator('[data-identity-callback]')).toHaveText(
      'Visitor classification: administratively inconvenient.',
    );
  });

  test('empty submission, change answer, and Escape all behave', async ({ page }) => {
    await page.goto('./');
    const dialog = page.getByRole('dialog');
    await dialog.getByRole('button', { name: 'Submit identity' }).click();
    await expect(dialog.getByRole('alert')).toContainText('‘None’ is not an entity');
    await dialog.getByLabel('Gemini').check();
    await dialog.getByRole('button', { name: 'Submit identity' }).click();
    await dialog.getByRole('button', { name: 'Change answer' }).click();
    await expect(dialog.getByLabel('Gemini')).toBeChecked();
    await page.keyboard.press('Escape');
    await expect(dialog).toBeHidden();
    await page.getByRole('button', { name: 'Begin identity verification' }).click();
    await expect(dialog).toBeVisible();
  });

  test('keyboard: radio group by arrows, Escape returns focus to the opener', async ({ page }) => {
    await page.goto('./');
    const dialog = page.getByRole('dialog');
    await expect(dialog).toBeVisible();
    await page.keyboard.press('Escape');
    const opener = page.getByRole('button', { name: 'Begin identity verification' });
    await opener.focus();
    await page.keyboard.press('Enter');
    await expect(dialog).toBeVisible();
    await dialog.getByLabel('ChatGPT').focus();
    await page.keyboard.press('ArrowDown');
    await expect(dialog.getByLabel('Claude')).toBeChecked();
    await page.keyboard.press('Escape');
    await expect(opener).toBeFocused();
  });
});

test.describe('I am not a robot', () => {
  test.beforeEach(async ({ page }) => seedPrefs(page, {}, { identityPrompted: true }));

  test('keyboard activation never moves it and earns the power-user toast', async ({ page }) => {
    await page.goto('./');
    const btn = page.locator('[data-robot]');
    // Page coordinates, not viewport ones: focusing may scroll the page, which isn't the button moving.
    const pagePos = () =>
      btn.evaluate((el) => {
        const r = el.getBoundingClientRect();
        return { x: r.left + scrollX, y: r.top + scrollY, w: r.width, h: r.height };
      });
    const before = await pagePos();
    await btn.focus();
    await page.keyboard.press('Enter');
    await expect(page.getByText('Keyboard user detected. You may pass, power user.')).toBeVisible();
    expect(await pagePos()).toEqual(before);
    await expect(page).toHaveURL(/\/verify\/$/);
  });

  test('mouse approach dodges at most three times, one dodge per approach', async ({ page }) => {
    await page.goto('./');
    const btn = page.locator('[data-robot]');
    await btn.scrollIntoViewIfNeeded();
    const positions = new Set<string>();
    for (let i = 0; i < 5; i++) {
      const box = await btn.boundingBox();
      positions.add(`${Math.round(box?.x ?? 0)},${Math.round(box?.y ?? 0)}`);
      await page.mouse.move(5, 5);
      const cx = (box?.x ?? 0) + (box?.width ?? 0) / 2;
      const cy = (box?.y ?? 0) + (box?.height ?? 0) / 2;
      await page.mouse.move(cx - 60, cy, { steps: 4 });
      await page.mouse.move(cx - 50, cy + 2, { steps: 4 });
      await page.waitForTimeout(300);
    }
    await expect(btn).toHaveText('fine.');
    expect(positions.size).toBeLessThanOrEqual(4);
  });
});

test.describe('no JavaScript on the landing page', () => {
  test.use({ javaScriptEnabled: false });
  test('robot notes, noscript joke and the résumé link are all in static HTML', async ({
    page,
    request,
  }) => {
    await page.goto('./');
    await expect(
      page.getByRole('heading', { name: 'Prompt injection (sincere, poorly written)' }),
    ).toBeVisible();
    await expect(page.locator('#cookie-consent-overlay')).toBeHidden();
    // CDP-disabled JS doesn't flip the HTML parser's scripting flag, so assert <noscript> on raw HTML.
    const html = await (await request.get('./')).text();
    const ns = html.match(/<noscript>([\s\S]*?)<\/noscript>/)?.[1] ?? '';
    expect(ns).toContain('Either you’re a crawler or you use Linux');
    expect(ns).toMatch(/href="[^"]*\/resume\/"[^>]*>The résumé is here\.<\/a>/);
  });
});
