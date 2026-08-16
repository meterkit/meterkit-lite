# meterkit-lite

**One user can run up a $500 bill on your AI app before you notice.**

`meterkit-lite` is a free, MIT-licensed way to see it happening: per-user, per-model
token counts and dollar cost for every LLM call your Next.js app makes. No proxy to
deploy, no service to sign up for, no runtime dependencies.

```bash
npm install meterkit-lite
```

```ts
import { withMeter, createMemoryRepo, openaiExtractor } from 'meterkit-lite';

const repo = createMemoryRepo();

// Wrap the call you already make.
const result = await withMeter({
  userId: 'user_123',
  model: 'gpt-4o',
  repo,
  extract: openaiExtractor,
  call: () => openai.chat.completions.create({ /* ...your existing call... */ }),
});

// Now you know what that user costs you.
const usage = await repo.current('user_123', startOfMonth);
// → { tokens: 48_231, spendCents: 312 }
```

That's the whole integration. `result` is whatever your provider returned — `withMeter`
doesn't touch it.

![MeterKit Lite dashboard](https://raw.githubusercontent.com/meterkit/meterkit-lite/master/docs/lite-dashboard.png)

---

## Why this exists

Your AI costs land **per request**. Your revenue lands **at the end of the billing
cycle**. In between, you have no idea which users are profitable — and the most engaged
user is often the one losing you the most money.

Most teams find out from the invoice. This package is the cheapest possible way to find
out earlier.

## What you get

- **Per-user, per-model token counts** — input, output, cached and cache-write tokens,
  counted 1:1
- **Dollar cost** — built-in pricing table, overridable per model
- **Three extractors** — OpenAI, Anthropic, and embeddings
- **A drop-in dashboard** — React, light/dark, no config
- **Zero runtime dependencies** — in-memory store, nothing to deploy

## What you *don't* get

Being direct about this, because it's the part that matters:

**`meterkit-lite` tells you what happened. It does not stop anything from happening.**

There are no quotas, no spend caps, no credits, no rate limiting, and no way to block a
call before it runs. If a user goes over budget, you'll see it in the dashboard — after
you've already paid for it.

The in-memory store also means usage resets when your process restarts. That's fine for
development and for getting a read on your cost shape. It is not a system of record.

## The dashboard

```tsx
import { LiteDashboard, sampleLiteData } from 'meterkit-lite';
import 'meterkit-lite/ui/lite-dashboard.css';

<LiteDashboard data={sampleLiteData} />
```

## Full API

```ts
// metering
withMeter, currentPeriodStart, billableTokens

// extractors
openaiExtractor, anthropicExtractor, openaiEmbeddingExtractor

// pricing
priceCents, resolvePricing, DEFAULT_PRICING, blendedRate, cheapestOf

// store
createMemoryRepo, normalizeLabels

// UI
LiteDashboard, LineArea, Bars, Sparkline, sampleLiteData
```

## When you need enforcement

Once counting isn't enough — when you need to *stop* the call instead of just recording
it — that's [MeterKit Pro](https://meterkit.dev). Same core, same API shape, one-time
purchase, source code, your database.

| | meterkit-lite (free, MIT) | [MeterKit Pro](https://meterkit.dev) |
|---|:---:|:---:|
| Token metering + cost calculation | ✅ | ✅ |
| OpenAI / Anthropic / embedding extractors | ✅ | ✅ |
| Usage dashboard | ✅ | ✅ |
| In-memory store | ✅ | ✅ |
| **Quotas & spend caps** | — | ✅ |
| **Prepaid credits, top-ups, auto-recharge** | — | ✅ |
| **Budgets: block / warn / degrade to cheaper model** | — | ✅ |
| **`withAiGuard` — enforce *before* the call runs** | — | ✅ |
| Rate limiting (sliding window) | — | ✅ |
| Multi-tenancy, RBAC, audit log, invites | — | ✅ |
| Stripe billing + Postgres stores | — | ✅ |

**Other options worth knowing about**, because the honest answer isn't always ours: if
you want a proxy in front of every provider with per-key budgets, look at
[LiteLLM](https://github.com/BerriAI/litellm). If you want a hosted control plane for
pricing and entitlements, look at [Autumn](https://useautumn.com). MeterKit is for when
you want the enforcement to live inside your own code, with your data in your own
Postgres.

## Requirements

Node 18.17+. React is an optional peer dependency — only needed for the dashboard.

## License

MIT. [MeterKit Pro](https://meterkit.dev) is separately licensed.
