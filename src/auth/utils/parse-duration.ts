const DURATION_MS: Record<string, number> = {
  ms: 1,
  s: 1000,
  m: 60_000,
  h: 3_600_000,
  d: 86_400_000,
};

export function parseDurationMs(value: string): number | undefined {
  const match = /^(\d+)(ms|s|m|h|d)$/i.exec(value.trim());
  if (!match) {
    return undefined;
  }
  const amount = Number(match[1]);
  const unit = match[2].toLowerCase();
  return amount * DURATION_MS[unit];
}
