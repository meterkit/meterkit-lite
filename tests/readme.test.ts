// @ts-ignore node module resolution
import { readFileSync } from 'fs';
import { describe, it, expect } from 'vitest';

const readme = readFileSync(new URL('../README.md', import.meta.url), 'utf8');

describe('README', () => {
  it('links the funnel to meterkit.dev', () => {
    expect(readme).toContain('https://meterkit.dev');
  });
  it('states the MIT license and the paid upgrade', () => {
    expect(readme).toMatch(/MIT/);
    expect(readme).toMatch(/MeterKit Pro/);
  });
  it('embeds the dashboard screenshot', () => {
    expect(readme).toContain('docs/lite-dashboard.png');
  });
});
