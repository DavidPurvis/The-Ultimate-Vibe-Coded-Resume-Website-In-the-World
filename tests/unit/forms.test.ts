import { describe, expect, it } from 'vitest';
import { confess, sellData, type ParodyFormCopy } from '../../src/content/copy/forms';

const forms: ParodyFormCopy[] = [sellData, confess];

/** Things a real form would use to take something from you. None of them may appear. */
const SENSITIVE =
  /password|passcode|\bpin\b|\bssn\b|social security number|credit card|card number|\bcvv\b|date of birth|\bdob\b|birthday|home address|street|zip code|postal|maiden name|bank|routing number|account number|e-?mail|phone number/i;

describe('parody forms collect nothing sensitive', () => {
  it('no field asks for credentials, payment, identity or contact details', () => {
    for (const f of forms)
      for (const field of f.fields) {
        expect(field.label, `${f.id}.${field.id}`).not.toMatch(SENSITIVE);
        expect(field.id).not.toMatch(SENSITIVE);
        if ('placeholder' in field && field.placeholder)
          expect(field.placeholder).not.toMatch(SENSITIVE);
      }
  });

  it('“social security” is a feelings slider, never a number field', () => {
    const social = sellData.fields.find((f) => /social security/i.test(f.label));
    expect(social?.kind).toBe('range');
  });

  it('receipts promise nothing was sent or stored', () => {
    expect(sellData.receipt.join(' ')).toMatch(/Bytes transmitted: 0/);
    expect(sellData.receipt.join(' ')).toMatch(/Stored: nowhere/);
    expect(confess.receipt.join(' ')).toMatch(/SEC notified: no/);
    expect(confess.disclaimer).toMatch(/Not legal advice/);
  });

  it('field ids are unique per form', () => {
    for (const f of forms) expect(new Set(f.fields.map((x) => x.id)).size).toBe(f.fields.length);
  });
});
