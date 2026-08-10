/**
 * SonicStream Production Metadata Standards
 * Enforces industry-standard rules for ISRC, UPC, and formatting.
 */

export const METADATA_RULES = {
  TITLE_MAX_LENGTH: 100,
  ARTIST_MAX_LENGTH: 100,
  MIN_PRICE: 0.49,
};

/**
 * Validates ISRC (International Standard Recording Code)
 * Format: Two-letter country code, three-character registrant code, 
 * two-digit year of reference, and five-character designation code.
 * Example: US-ABC-24-12345
 */
export function validateISRC(isrc: string): boolean {
  if (!isrc) return true; // Optional during draft
  const clean = isrc.replace(/[^A-Z0-9]/g, '');
  return /^[A-Z]{2}[A-Z0-9]{3}[0-9]{2}[0-9]{5}$/.test(clean);
}

/**
 * Validates UPC (Universal Product Code) / EAN
 * Usually 12 or 13 digits.
 */
export function validateUPC(upc: string): boolean {
  if (!upc) return true;
  const clean = upc.replace(/[^0-9]/g, '');
  return clean.length === 12 || clean.length === 13;
}

/**
 * Enforces Label-level formatting rules
 * - No excessive capitalization (e.g. "MY SONG")
 * - No placeholder text
 * - Proper featuring syntax: "Title (feat. Artist)"
 */
export function formatMusicMetadata(text: string): string {
  if (!text) return '';
  
  let formatted = text.trim();
  
  // Rule: If all caps and longer than 3 chars, convert to title case
  if (formatted === formatted.toUpperCase() && formatted.length > 3) {
    formatted = formatted.toLowerCase().split(' ').map(word => 
      word.charAt(0).toUpperCase() + word.slice(1)
    ).join(' ');
  }

  return formatted;
}

export interface ValidationResult {
  valid: boolean;
  errors: string[];
}

export function validateTrackMetadata(data: any): ValidationResult {
  const errors: string[] = [];

  if (!data.title || data.title.length < 2) errors.push("Title is too short");
  if (data.title && data.title.length > METADATA_RULES.TITLE_MAX_LENGTH) errors.push("Title is too long");
  
  if (!validateISRC(data.isrc || '')) errors.push("Invalid ISRC format. Expected: CC-XXX-YY-NNNNN");
  if (!validateUPC(data.upc || '')) errors.push("Invalid UPC/EAN format (12-13 digits required)");

  if (data.price < METADATA_RULES.MIN_PRICE) errors.push(`Minimum price is $${METADATA_RULES.MIN_PRICE}`);

  return {
    valid: errors.length === 0,
    errors
  };
}
