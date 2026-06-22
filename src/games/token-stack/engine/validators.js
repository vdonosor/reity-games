/**
 * Validates a Chilean RUT.
 * Accepts formats: "12345678-9", "12.345.678-9", "12345678-K"
 * Returns { valid: boolean, normalized: string } where normalized is "12345678-9"
 */
export function validateChileanRUT(input) {
  if (!input || typeof input !== 'string') return { valid: false, normalized: '' };

  const clean = input.trim().replace(/\./g, '').replace(/\s/g, '').toUpperCase();
  const match = clean.match(/^(\d{7,8})-([0-9K])$/);
  if (!match) return { valid: false, normalized: '' };

  const body = match[1];
  const dv = match[2];
  const computed = computeRUTDV(parseInt(body, 10));
  if (computed !== dv) return { valid: false, normalized: '' };

  return { valid: true, normalized: `${body}-${dv}` };
}

function computeRUTDV(rut) {
  let sum = 0;
  let multiplier = 2;
  let n = rut;
  while (n > 0) {
    sum += (n % 10) * multiplier;
    n = Math.floor(n / 10);
    multiplier = multiplier === 7 ? 2 : multiplier + 1;
  }
  const remainder = 11 - (sum % 11);
  if (remainder === 11) return '0';
  if (remainder === 10) return 'K';
  return String(remainder);
}

/**
 * Validates an email address.
 * Returns { valid: boolean, normalized: string } where normalized is lowercased.
 */
export function validateEmail(input) {
  if (!input || typeof input !== 'string') return { valid: false, normalized: '' };
  const trimmed = input.trim().toLowerCase();
  // RFC 5322 simplified: requires local@domain.tld
  const valid = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(trimmed);
  return { valid, normalized: valid ? trimmed : '' };
}
