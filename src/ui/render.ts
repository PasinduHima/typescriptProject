import { formatCityLabel } from "../domain/cityLabel.ts";
import type { City } from "../domain/types.ts";
import type { AppState } from "../state.ts";
import { createEl } from "./dom.ts";
import { getStatusMessage } from "./statusMessage.ts";

export type Elements = {
  combobox: HTMLDivElement;
  input: HTMLInputElement;
  list: HTMLUListElement;
  status: HTMLParagraphElement;
};

export type Handlers = {
  onSelectCity: (city: City) => void;
};

function optionId(index: number): string {
  return `search-option-${index}`;
}

function renderSearch(
  els: Elements,
  state: Readonly<AppState>,
  handlers: Handlers,
): void {
  const results = state.search.status === "success" ? state.search.data : [];
  const isOpen = state.isListOpen && results.length > 0;

  els.input.setAttribute("aria-expanded", String(isOpen));
  els.list.hidden = !isOpen;

  const options = results.map((city, index) => {
    const isActive = index === state.activeIndex;
    const li = createEl("li", {
      className: "search__option",
      text: formatCityLabel(city),
      attrs: {
        id: optionId(index),
        role: "option",
        "aria-selected": String(isActive),
      },
    });
    li.addEventListener("click", () => {
      handlers.onSelectCity(city);
    });
    return li;
  });
  els.list.replaceChildren(...options);

  const active =
    isOpen && state.activeIndex !== null
      ? options[state.activeIndex]
      : undefined;
  if (active === undefined) {
    els.input.removeAttribute("aria-activedescendant");
  } else {
    els.input.setAttribute("aria-activedescendant", active.id);
    active.scrollIntoView({ block: "nearest" });
  }
}

function renderStatus(els: Elements, state: Readonly<AppState>): void {
  const message = getStatusMessage(state);
  // Only touch the live region when the text changes, so it isn't re-announced.
  if (els.status.textContent !== message) {
    els.status.textContent = message;
  }
}

export function render(
  els: Elements,
  state: Readonly<AppState>,
  handlers: Handlers,
): void {
  renderSearch(els, state, handlers);
  renderStatus(els, state);
}
