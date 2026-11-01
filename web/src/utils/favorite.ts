export const FAVORITE_PRIORITY = 1;
export const PLAIN_PRIORITY = 3;

export function isFavorite(priority?: number | null): boolean {
  return priority === FAVORITE_PRIORITY;
}

export function priorityFor(favorite: boolean): number {
  return favorite ? FAVORITE_PRIORITY : PLAIN_PRIORITY;
}
