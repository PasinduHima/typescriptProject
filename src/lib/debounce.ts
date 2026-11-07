export type Debounced<Args extends unknown[]> = ((...args: Args) => void) & {
  cancel: () => void;
};

/**
 * Returns a function that waits until it hasn't been called for `delayMs`,
 * then calls `fn` with the latest arguments.
 */
export function debounce<Args extends unknown[]>(
  fn: (...args: Args) => void,
  delayMs: number,
): Debounced<Args> {
  let timer: ReturnType<typeof setTimeout> | undefined;

  const debounced = (...args: Args): void => {
    if (timer !== undefined) clearTimeout(timer);
    timer = setTimeout(() => {
      timer = undefined;
      fn(...args);
    }, delayMs);
  };

  const cancel = (): void => {
    if (timer !== undefined) clearTimeout(timer);
    timer = undefined;
  };

  return Object.assign(debounced, { cancel });
}
