import { formatCityLabel } from "../domain/cityLabel.ts";
import { forecastDayLabel } from "../domain/dates.ts";
import type { City, CurrentWeather, DailyForecast } from "../domain/types.ts";
import {
  formatTemperature,
  formatWindSpeed,
  windUnitFor,
} from "../domain/units.ts";
import { getWeatherInfo } from "../domain/weatherCodes.ts";
import { assertNever } from "../lib/assertNever.ts";
import type { AppState } from "../state.ts";
import { createEl } from "./dom.ts";
import { getStatusMessage } from "./statusMessage.ts";

export type Elements = {
  combobox: HTMLDivElement;
  input: HTMLInputElement;
  list: HTMLUListElement;
  status: HTMLParagraphElement;
  current: HTMLElement;
  forecast: HTMLElement;
  forecastList: HTMLOListElement;
  unitToggle: HTMLFieldSetElement;
  unitCelsius: HTMLInputElement;
  unitFahrenheit: HTMLInputElement;
};

export type Handlers = {
  onSelectCity: (city: City) => void;
};

// ---------- Search ----------

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

// ---------- Status ----------

function renderStatus(els: Elements, state: Readonly<AppState>): void {
  const { text, tone } = getStatusMessage(state);
  els.status.dataset.tone = tone;
  // Only touch the live region when the text changes, so it isn't re-announced.
  if (els.status.textContent !== text) {
    els.status.textContent = text;
  }
}

// ---------- Weather ----------

/** An emoji icon with an accessible name (screen readers read the label, not the emoji). */
function weatherIcon(code: number, className: string): HTMLSpanElement {
  const { icon, label } = getWeatherInfo(code);
  return createEl("span", {
    className,
    text: icon,
    attrs: { role: "img", "aria-label": label },
  });
}

function detail(term: string, value: string): HTMLDivElement {
  return createEl("div", { className: "current__detail" }, [
    createEl("dt", { text: term }),
    createEl("dd", { text: value }),
  ]);
}

function renderCurrent(
  els: Elements,
  city: City | null,
  current: CurrentWeather,
  state: Readonly<AppState>,
): void {
  const { label } = getWeatherInfo(current.weatherCode);
  els.current.replaceChildren(
    createEl("h2", {
      className: "current__place",
      text: city === null ? "Current weather" : formatCityLabel(city),
      attrs: { id: "current-heading" },
    }),
    createEl("div", { className: "current__main" }, [
      weatherIcon(current.weatherCode, "current__icon"),
      createEl("p", {
        className: "current__temp",
        text: formatTemperature(current.temperatureC, state.unit),
      }),
    ]),
    createEl("p", { className: "current__condition", text: label }),
    createEl("dl", { className: "current__details" }, [
      detail("Feels like", formatTemperature(current.feelsLikeC, state.unit)),
      detail("Humidity", `${Math.round(current.humidityPercent)}%`),
      detail(
        "Wind",
        formatWindSpeed(current.windSpeedKmh, windUnitFor(state.unit)),
      ),
    ]),
  );
}

function renderForecastList(
  els: Elements,
  days: DailyForecast[],
  state: Readonly<AppState>,
): void {
  const items = days.map((day, index) =>
    createEl("li", { className: "forecast__day" }, [
      createEl("span", {
        className: "forecast__name",
        text: forecastDayLabel(day.date, index),
      }),
      weatherIcon(day.weatherCode, "forecast__icon"),
      createEl("span", { className: "forecast__temps" }, [
        createEl("span", { className: "visually-hidden", text: "High " }),
        createEl("span", {
          className: "forecast__max",
          text: formatTemperature(day.maxTemperatureC, state.unit),
        }),
        createEl("span", { className: "visually-hidden", text: ", low " }),
        createEl("span", {
          className: "forecast__min",
          text: formatTemperature(day.minTemperatureC, state.unit),
        }),
      ]),
    ]),
  );
  els.forecastList.replaceChildren(...items);
}

function renderWeather(els: Elements, state: Readonly<AppState>): void {
  const { forecast } = state;
  switch (forecast.status) {
    case "idle":
    case "loading":
    case "error":
      // Messages for these go in the status region; hide stale weather.
      els.current.hidden = true;
      els.forecast.hidden = true;
      return;
    case "success":
      renderCurrent(els, state.selectedCity, forecast.data.current, state);
      renderForecastList(els, forecast.data.daily, state);
      els.current.hidden = false;
      els.forecast.hidden = false;
      return;
    default:
      assertNever(forecast);
  }
}

// ---------- Units ----------

function renderUnitToggle(els: Elements, state: Readonly<AppState>): void {
  els.unitCelsius.checked = state.unit === "celsius";
  els.unitFahrenheit.checked = state.unit === "fahrenheit";
}

export function render(
  els: Elements,
  state: Readonly<AppState>,
  handlers: Handlers,
): void {
  renderSearch(els, state, handlers);
  renderStatus(els, state);
  renderWeather(els, state);
  renderUnitToggle(els, state);
}
