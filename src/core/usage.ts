/** Neutral usage total: tokens consumed and money spent in a period.
 *  `spendCents` is cost *incurred* (legitimate in Lite, which has cost calc) —
 *  distinct from a spend *cap* (enforcement, which is Pro-only). */
export type Usage = { tokens: number; spendCents: number };
