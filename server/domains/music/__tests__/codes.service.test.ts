import { describe, it, expect } from 'vitest';
import { generateIsrc, isValidIsrc } from '../codes.service.js';

describe('generateIsrc', () => {
  it('produces a spec-compliant ISRC: CC-XXX-YY-NNNNN', () => {
    const isrc = generateIsrc();
    expect(isrc).toMatch(/^US-SS1-\d{2}-\d{5}$/);
  });

  it('uses the LAST TWO DIGITS OF THE CURRENT YEAR for the year segment', () => {
    // Regression test for the 2026-07 fix: the previous implementation used
    // Date.now().toString().slice(-2) - the last two digits of epoch milliseconds,
    // effectively a random number - which produced ISRCs DSPs would reject.
    const isrc = generateIsrc();
    const expectedYY = String(new Date().getFullYear() % 100).padStart(2, '0');
    expect(isrc.split('-')[2]).toBe(expectedYY);
  });

  it('honors an explicit year, including century rollover padding', () => {
    expect(generateIsrc({ year: 2026 }).split('-')[2]).toBe('26');
    expect(generateIsrc({ year: 2100 }).split('-')[2]).toBe('00');
    expect(generateIsrc({ year: 2107 }).split('-')[2]).toBe('07');
  });

  it('zero-pads the designation to exactly five digits', () => {
    expect(generateIsrc({ designation: 7 })).toBe(`US-SS1-${String(new Date().getFullYear() % 100).padStart(2, '0')}-00007`);
    expect(generateIsrc({ designation: 99999 }).endsWith('-99999')).toBe(true);
  });

  it('rejects out-of-range or fractional designations', () => {
    expect(() => generateIsrc({ designation: -1 })).toThrow();
    expect(() => generateIsrc({ designation: 100000 })).toThrow();
    expect(() => generateIsrc({ designation: 3.5 })).toThrow();
  });

  it('random designations always stay within the 5-digit space', () => {
    for (let i = 0; i < 200; i++) {
      const designation = generateIsrc().split('-')[3];
      expect(designation).toMatch(/^\d{5}$/);
    }
  });
});

describe('isValidIsrc', () => {
  it('accepts well-formed ISRCs and everything generateIsrc emits', () => {
    expect(isValidIsrc('US-SS1-26-00042')).toBe(true);
    expect(isValidIsrc('GB-AB1-99-12345')).toBe(true);
    expect(isValidIsrc(generateIsrc())).toBe(true);
  });

  it('rejects the malformed shapes the old generator could emit', () => {
    expect(isValidIsrc('US-SS1-26-1234')).toBe(false);   // 4-digit designation
    expect(isValidIsrc('US-SS1-6-12345')).toBe(false);   // 1-digit year
    expect(isValidIsrc('us-ss1-26-12345')).toBe(false);  // lowercase
    expect(isValidIsrc('USSS12612345')).toBe(false);     // missing separators
    expect(isValidIsrc('')).toBe(false);
  });
});
