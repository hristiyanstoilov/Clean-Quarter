/**
 * Neighborhoods — single source of truth
 *
 * ALL valid neighborhood values used in the system are defined here.
 * dashboard.js, stats.js, HTML dropdowns, and DB CHECK CONSTRAINTs all derive from this list.
 *
 * To add a new neighborhood:
 *   1. Add an entry to NEIGHBORHOODS below
 *   2. Add its i18n key to src/i18n/bg.json and src/i18n/en.json
 *   3. Sync public/i18n/ (cp src/i18n/*.json public/i18n/)
 *   4. Run the DB migration to add the CHECK CONSTRAINT value
 */
import { t } from "./i18n.js";

export const NEIGHBORHOODS = [
  { value: "Studentski Grad", i18nKey: "studentskiGrad" },
  { value: "Darvenitsa", i18nKey: "darvenitsa" },
  { value: "Musagenitsa", i18nKey: "musagenitsa" },
  { value: "Vitosha (VEC)", i18nKey: "vitoshaVec" },
  { value: "Malinova Dolina", i18nKey: "malinovaDolina" },
];

/** Canonical DB values — used for form validation and DB constraints. */
export const NEIGHBORHOOD_VALUES = NEIGHBORHOODS.map((n) => n.value);

// Internal lookup: DB value → i18n key (O(1))
const _NEIGHBORHOOD_I18N = Object.fromEntries(NEIGHBORHOODS.map((n) => [n.value, n.i18nKey]));

/**
 * Translate a raw DB neighborhood value to the current language label.
 * Falls back to the raw DB value if translations are not loaded or key is missing.
 *
 * Uses the same "translated !== key" pattern as resolveMessage to distinguish
 * "translation found" from "t() returned the key itself (not loaded)".
 *
 * @param {string} raw - Raw value from DB (e.g. "Darvenitsa")
 * @returns {string}
 */
export function localizeNeighborhood(raw) {
  if (!raw) return "";
  const i18nKey = _NEIGHBORHOOD_I18N[raw];
  if (i18nKey) {
    const keyPath = `neighborhoods.${i18nKey}`;
    const translated = t(keyPath);
    return translated !== keyPath ? translated : raw;
  }
  return raw;
}
