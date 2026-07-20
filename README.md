# meterkit-lite

**Free, MIT token metering & cost tracking for Next.js AI apps.** Wrap any model
call, get per-user / per-model token counts and dollar cost, and drop in a ready
dashboard. The open funnel for [MeterKit](https://meterkit.dev).

![MeterKit Lite dashboard](https://raw.githubusercontent.com/meterkit/meterkit-lite/master/docs/lite-dashboard.png)

## Install

```bash
npm install meterkit-lite
```

## Usage

```ts
import { withMeter, createMemoryRepo, openaiExtractor } from 'meterkit-lite';

const repo = createMemoryRepo();

const result = await withMeter({
  userId: 'user_123',
  model: 'gpt-4o',
  repo,
  extract: openaiExtractor,
  call: () => openai.chat.completions.create({ /* ... */ }),
});

const usage = await repo.current('user_123', startOfMonth);
// { tokens, spendCents }
```

Render the dashboard:

```tsx
import { LiteDashboard, sampleLiteData } from 'meterkit-lite';
import 'meterkit-lite/ui/lite-dashboard.css'; // tokens + dashboard styles (re-exports theme.css)

<LiteDashboard data={sampleLiteData} />
```

## Lite vs. MeterKit (paid)

Lite tracks. **MeterKit enforces** — the dashboard is a bonus; the guard is the product.

| | meterkit-lite (free, MIT) | MeterKit (one-time) |
|---|:---:|:---:|
| Token metering + cost calc | ✅ | ✅ |
| OpenAI / Anthropic / embedding extractors | ✅ | ✅ |
| In-memory usage store | ✅ | ✅ |
| Descriptive dashboard | ✅ | ✅ |
| **Quotas & spend caps (enforcement)** | — | ✅ |
| **Pre-paid credits, top-ups, auto-recharge** | — | ✅ |
| **Budgets with block / warn / degrade** | — | ✅ |
| **`withAiGuard` — enforce before the call runs** | — | ✅ |
| Multi-tenancy, RBAC, audit, invites | — | ✅ |
| Stripe billing + Postgres store | — | ✅ |
| Rate limiting | — | ✅ |

👉 **[Get MeterKit Pro at meterkit.dev](https://meterkit.dev)** — one-time payment, your code, your data.

## License

MIT. MeterKit (the full product) is a separate commercial license — see
[meterkit.dev](https://meterkit.dev).
