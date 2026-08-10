import crypto from 'crypto';

/**
 * ISRC (International Standard Recording Code) generation.
 * Format: CC-XXX-YY-NNNNN
 *   CC    - ISO country code of the registrant (2 letters)
 *   XXX   - registrant code (3 alphanumerics)
 *   YY    - year of reference: the LAST TWO DIGITS OF THE CURRENT YEAR.
 *           (Bug fixed 2026-07: this previously used the last two digits of
 *           Date.now() epoch milliseconds - effectively a random number - which
 *           produced ISRCs that DSPs and PROs would reject or misfile.)
 *   NNNNN - 5-digit designation code, unique per registrant per year.
 */

const COUNTRY = 'US';
const REGISTRANT = 'SS1';

export function generateIsrc(opts: { year?: number; designation?: number } = {}): string {
  const year = opts.year ?? new Date().getFullYear();
  const yy = String(year % 100).padStart(2, '0');

  let designation: number;
  if (opts.designation !== undefined) {
    if (!Number.isInteger(opts.designation) || opts.designation < 0 || opts.designation > 99999) {
      throw new Error('ISRC designation must be an integer between 0 and 99999');
    }
    designation = opts.designation;
  } else {
    // Cryptographically random 5-digit designation. True uniqueness requires a
    // per-year sequence counter; random assignment keeps collision odds low
    // (1 in 100k per pair) until a registrar sequence is introduced.
    designation = crypto.randomInt(0, 100000);
  }

  return `${COUNTRY}-${REGISTRANT}-${yy}-${String(designation).padStart(5, '0')}`;
}

const ISRC_RE = /^[A-Z]{2}-[A-Z0-9]{3}-\d{2}-\d{5}$/;

export function isValidIsrc(isrc: string): boolean {
  return ISRC_RE.test(isrc);
}
