/**
 * Typed querySelector: finds `selector` and checks it is an instance of `ctor`.
 * Throws a clear error if it's missing or the wrong kind of element,
 * so callers get a real `HTMLInputElement` (etc.) without an `as` cast.
 *
 *   const input = getEl("#search-input", HTMLInputElement);
 */
export function getEl<T extends Element>(
  selector: string,
  ctor: new () => T,
  root: ParentNode = document,
): T {
  const el = root.querySelector(selector);
  if (el === null) {
    throw new Error(`Element not found: ${selector}`);
  }
  if (!(el instanceof ctor)) {
    throw new Error(
      `Element ${selector} is a ${el.constructor.name}, expected ${ctor.name}`,
    );
  }
  return el;
}

type ElOptions = {
  className?: string;
  /** Set with textContent — safe for API strings. */
  text?: string;
  attrs?: Record<string, string>;
};

/** createElement with the right return type for each tag, e.g. "li" → HTMLLIElement. */
export function createEl<K extends keyof HTMLElementTagNameMap>(
  tag: K,
  options: ElOptions = {},
  children: Node[] = [],
): HTMLElementTagNameMap[K] {
  const el = document.createElement(tag);
  if (options.className !== undefined) el.className = options.className;
  if (options.text !== undefined) el.textContent = options.text;
  for (const [name, value] of Object.entries(options.attrs ?? {})) {
    el.setAttribute(name, value);
  }
  el.append(...children);
  return el;
}
