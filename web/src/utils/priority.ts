export type PriorityLevel = "high" | "medium" | "low";

export const PRIORITY_OPTIONS: { value: number; level: PriorityLevel }[] = [
  { value: 1, level: "high" },
  { value: 2, level: "medium" },
  { value: 3, level: "low" },
];

export const PRIORITY_TAG_VARIANTS = {
  high: "accent",
  medium: "accent-2",
  low: "neutral",
} as const satisfies Record<PriorityLevel, string>;

const LOWEST_LEVEL: PriorityLevel = "low";

export function priorityLevel(priority?: number | null): PriorityLevel | null {
  if (priority == null) return null;
  return (
    PRIORITY_OPTIONS.find((option) => option.value === priority)?.level ??
    LOWEST_LEVEL
  );
}
