const HIGH_PRIORITY_MAX = 2;

export function isHighPriority(priority?: number | null): boolean {
  return priority != null && priority <= HIGH_PRIORITY_MAX;
}
