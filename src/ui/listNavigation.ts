/**
 * Next highlighted index after pressing ↓ (step 1) or ↑ (step -1) in a list of `count` items.
 * Wraps around at both ends. From "nothing highlighted", ↓ goes to the first item and ↑ to the last.
 */
export function moveActiveIndex(
  current: number | null,
  step: 1 | -1,
  count: number,
): number | null {
  if (count === 0) return null;
  if (current === null) return step === 1 ? 0 : count - 1;
  return (current + step + count) % count;
}
