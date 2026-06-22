import { describe, it, expect } from 'vitest';
import { validateChileanRUT, validateEmail } from '../engine/validators.js';

describe('validateChileanRUT', () => {
  const valid = [
    ['12345678-5', '12345678-5'],
    ['12.345.678-5', '12345678-5'],
    ['11111111-1', '11111111-1'],
    ['76354771-K', '76354771-K'],
    ['76354771-k', '76354771-K'], // lowercase k accepted
    ['5126663-3', '5126663-3'],   // 7-digit RUT
    ['9999999-3', '9999999-3'],
    ['1-9', null],                // too short (< 7 digits) — invalid
    ['22222222-2', '22222222-2'],
    ['17477863-9', '17477863-9'],
  ];

  it.each(valid)('validates %s → %s', (input, expectedNorm) => {
    const result = validateChileanRUT(input);
    if (expectedNorm === null) {
      expect(result.valid).toBe(false);
    } else {
      expect(result.valid).toBe(true);
      expect(result.normalized).toBe(expectedNorm);
    }
  });

  const invalid = [
    '12345678-0',    // wrong DV
    '12345678',      // missing DV
    '12345678-',     // missing DV digit
    'abcdefgh-1',    // non-numeric body
    '',              // empty
    '12345678-A',    // invalid DV letter
    '12345678-10',   // DV too long
    '1234567890-1',  // body too long
    '0-0',           // too short
    null,            // null
  ];

  it.each(invalid)('rejects %s', (input) => {
    expect(validateChileanRUT(input).valid).toBe(false);
  });
});

describe('validateEmail', () => {
  const valid = [
    'user@example.com',
    'User@Example.COM',        // case-insensitive, normalizes to lowercase
    'user+tag@example.co.uk',
    'user.name@sub.domain.cl',
    'a@b.io',
    'test123@universidad.cl',
  ];

  it.each(valid)('accepts %s', (input) => {
    const result = validateEmail(input);
    expect(result.valid).toBe(true);
    expect(result.normalized).toBe(input.trim().toLowerCase());
  });

  const invalid = [
    'notanemail',
    '@nodomain.com',
    'user@',
    'user@domain',      // no TLD
    'user @domain.com', // space
    '',
    null,
    'user@@domain.com',
  ];

  it.each(invalid)('rejects %s', (input) => {
    expect(validateEmail(input).valid).toBe(false);
  });
});
