import logger from "./logger.js";

const CACHE_KEY = "CLEAN_QUARTER_WEATHER";
const CACHE_TTL_MS = 60 * 60 * 1000; // 1 hour
const SOFIA_LAT = 42.6977;
const SOFIA_LNG = 23.3219;

// WMO Weather Interpretation Codes → condition category
function classifyCode(code) {
  if (code === 0) return "clear";
  if (code <= 2) return "mostly_clear";
  if (code === 3) return "cloudy";
  if (code <= 48) return "fog";
  if (code <= 67) return "rain";
  if (code <= 77) return "snow";
  if (code <= 82) return "showers";
  return "storm";
}

const CONDITION_META = {
  clear: { icon: "☀️", good: true },
  mostly_clear: { icon: "🌤️", good: true },
  cloudy: { icon: "⛅", good: true },
  fog: { icon: "🌫️", good: false },
  rain: { icon: "🌧️", good: false },
  snow: { icon: "❄️", good: false },
  showers: { icon: "🌦️", good: false },
  storm: { icon: "⛈️", good: false },
};

/**
 * Fetch current weather for Sofia from Open-Meteo (no API key required).
 * Results are cached in sessionStorage for 1 hour.
 * @returns {Promise<{ temperature: number, condition: string, icon: string, isGoodWeather: boolean } | null>}
 */
export async function fetchWeather() {
  // Return cached result if still fresh
  try {
    const cached = sessionStorage.getItem(CACHE_KEY);
    if (cached) {
      const { data, timestamp } = JSON.parse(cached);
      if (Date.now() - timestamp < CACHE_TTL_MS) return data;
    }
  } catch {
    /* ignore parse errors */
  }

  try {
    const url =
      "https://api.open-meteo.com/v1/forecast" +
      `?latitude=${SOFIA_LAT}&longitude=${SOFIA_LNG}` +
      "&current_weather=true";

    const response = await fetch(url);
    if (!response.ok) throw new Error(`HTTP ${response.status}`);

    const json = await response.json();
    const { temperature, weathercode } = json.current_weather;

    const condition = classifyCode(weathercode);
    const { icon, good } = CONDITION_META[condition];

    const data = {
      temperature: Math.round(temperature),
      condition,
      icon,
      isGoodWeather: good,
    };

    sessionStorage.setItem(CACHE_KEY, JSON.stringify({ data, timestamp: Date.now() }));
    return data;
  } catch (err) {
    logger.error("[weather] fetch failed:", err);
    return null;
  }
}
