import { describe, it, expect } from 'vitest';
import { normalizeLabels, MAX_LABEL_KEYS, MAX_LABEL_KEY_LEN, MAX_LABEL_VALUE_LEN } from '../../src/store/labels';

describe('normalizeLabels', () => {
  it('returns {} for undefined or a non-object', () => {
    expect(normalizeLabels(undefined)).toEqual({});
    expect(normalizeLabels(null as unknown as Record<string, unknown>)).toEqual({});
  });
  it('keeps string values and drops non-string values', () => {
    expect(normalizeLabels({ feature: 'chat', n: 5, ok: 'yes', b: true } as Record<string, unknown>))
      .toEqual({ feature: 'chat', ok: 'yes' });
  });
  it('truncates over-long keys and values', () => {
    const longKey = 'k'.repeat(MAX_LABEL_KEY_LEN + 10);
    const longVal = 'v'.repeat(MAX_LABEL_VALUE_LEN + 10);
    const out = normalizeLabels({ [longKey]: longVal });
    const [k] = Object.keys(out);
    expect(k.length).toBe(MAX_LABEL_KEY_LEN);
    expect(out[k].length).toBe(MAX_LABEL_VALUE_LEN);
  });
  it('caps the number of keys at MAX_LABEL_KEYS', () => {
    const raw: Record<string, string> = {};
    for (let i = 0; i < MAX_LABEL_KEYS + 5; i++) raw[`k${i}`] = 'v';
    expect(Object.keys(normalizeLabels(raw))).toHaveLength(MAX_LABEL_KEYS);
  });
});
