export const MAX_LABEL_KEYS = 16;
export const MAX_LABEL_KEY_LEN = 64;
export const MAX_LABEL_VALUE_LEN = 256;

// Coerce untrusted buyer input to a bounded flat string→string map. Non-string
// values are dropped; keys/values are truncated; at most MAX_LABEL_KEYS entries
// (insertion order). Junk (undefined / non-object) → {}. Never throws — a
// malformed labels argument must not break the already-paid metered write.
export const normalizeLabels = (raw?: Record<string, unknown>): Record<string, string> => {
  if (!raw || typeof raw !== 'object') return {};
  const out: Record<string, string> = {};
  for (const [k, v] of Object.entries(raw)) {
    if (typeof v !== 'string') continue;
    if (Object.keys(out).length >= MAX_LABEL_KEYS) break;
    out[k.slice(0, MAX_LABEL_KEY_LEN)] = v.slice(0, MAX_LABEL_VALUE_LEN);
  }
  return out;
};
