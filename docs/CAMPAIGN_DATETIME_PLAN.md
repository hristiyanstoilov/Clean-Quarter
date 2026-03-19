# Plan: Campaign Date & Time Feature

> **STATUS: COMPLETED ✅** — Merged via PR #43 on 2026-03-19.
> This document is kept for reference. All steps below were implemented as described.

**Branch:** `feat/campaign-datetime`
**Depends on:** `feat/weather-widget` merged first (see Step 0)
**PR:** #43 (merged to `main`)

---

## Контекст

`campaigns` таблицата няма `date` поле. Навсякъде се показва `created_at`
(кога е публикувана кампанията), а не кога е планирано почистването.
Този PR добавя `scheduled_date`, `start_time` и `end_time` и оправя
всички места, където датата се показва или сортира.

---

## Стъпка 0 — Merge `feat/weather-widget` първо

**Защо:** `weather.js` ще се промени и в двата branch-а. Ако `feat/campaign-datetime`
тръгне от `main` преди merge-а на weather widget, ще има конфликт в `weather.js`
при merge.

**Как:**
1. Създай и merge PR на GitHub: `feat/weather-widget` → `main`
2. Локално: `git checkout main && git pull`
3. `git checkout -b feat/campaign-datetime`

---

## Стъпка 1 — DB Миграция

**Файл:** `supabase/migrations/20260315120000_add_campaign_datetime.sql`

```sql
-- 1. Добавяме колоните като nullable
ALTER TABLE campaigns
  ADD COLUMN scheduled_date DATE,
  ADD COLUMN start_time TIME,
  ADD COLUMN end_time TIME;

-- 2. Backfill на съществуващи редове
UPDATE campaigns
SET scheduled_date = created_at::date,
    start_time = '10:00'
WHERE scheduled_date IS NULL;

-- 3. Правим задължителни
ALTER TABLE campaigns
  ALTER COLUMN scheduled_date SET NOT NULL,
  ALTER COLUMN start_time SET NOT NULL;

-- 4. Валидация: краен час трябва да е след началния
ALTER TABLE campaigns
  ADD CONSTRAINT end_time_after_start_time
  CHECK (end_time IS NULL OR end_time > start_time);
```

**Рискове:**
- Backfill дава исторически кампании дата = `created_at::date` — не е точно,
  но е единствената разумна стойност
- Не добавяме `CHECK (scheduled_date >= CURRENT_DATE)` на DB ниво — ще блокира
  UPDATE на стари записи; валидацията е само на frontend

---

## Стъпка 2 — i18n (4 файла)

**Файлове:** `src/i18n/bg.json`, `src/i18n/en.json`, `public/i18n/bg.json`, `public/i18n/en.json`

Нови ключове под `campaign`:

| Ключ | БГ | EN |
|---|---|---|
| `campaign.scheduledDate` | Дата на почистването | Cleanup Date |
| `campaign.startTime` | Начален час | Start Time |
| `campaign.endTime` | Краен час (по желание) | End Time (optional) |
| `campaign.timeRange` | `{start} – {end}` | `{start} – {end}` |
| `campaign.pastDateError` | Датата не може да е в миналото | Date cannot be in the past |
| `campaign.noDate` | Час неуточнен | Time TBD |

---

## Стъпка 3 — Create Campaign форма

**Файлове:** `src/pages/create-campaign.html`, `src/scripts/create-campaign.js`

### HTML промени
- Date picker: `<input type="date" id="campaignDate" required>`
- Start time picker: `<input type="time" id="campaignStartTime" required>`
- End time picker: `<input type="time" id="campaignEndTime">` (незадължителен)
- Добавяне към visual checklist

### JS промени
- `setupEventListeners()`: добавяме listeners за новите полета
- `checkFormCompletion()`: `scheduled_date` + `start_time` са задължителни
- `updateVisualChecklist()`: нови редове в чеклиста
- Валидация: `scheduled_date >= днес` (frontend only)
- `min` атрибут на date input: `input.min = new Date().toISOString().split('T')[0]`
- INSERT payload:
  ```js
  scheduled_date: document.getElementById('campaignDate').value,
  start_time: document.getElementById('campaignStartTime').value,
  end_time: document.getElementById('campaignEndTime').value || null,
  ```

---

## Стъпка 4 — Edit Campaign форма (НОВА — беше пропусната)

**Файлове:** `src/pages/campaign-detail.html`, `src/scripts/campaign-detail.js`

Съществуващият edit form (`toggleEditCampaign`) позволява промяна на
title, description, neighborhood, status — но **не** на дата/час.

### HTML промени
- Добавяме date + start_time + end_time полета в `#editCampaignSection`

### JS промени
- `toggleEditCampaign()`: pre-fill новите полета от `campaign` обекта
- `saveCampaignEdit()`: добавяме в update payload:
  ```js
  scheduled_date: newDate,
  start_time: newStartTime,
  end_time: newEndTime || null,
  ```
- Demo mode localStorage update: същите полета
- UI update след save: обновяваме date/time display елементите

---

## Стъпка 5 — Dashboard

**Файл:** `src/scripts/dashboard.js`

### Query промени
```js
.select("id, title, neighborhood, before_photo_url, status, scheduled_date, start_time, end_time, created_by, creator:profiles!created_by(username)")
.eq("status", "active")
.gte("scheduled_date", new Date().toISOString().split("T")[0])  // ← само предстоящи!
.order("scheduled_date", { ascending: true })
.order("start_time", { ascending: true })
```

**Важно:** Без `.gte("scheduled_date", today)` кампании с backfill минали дати
ще се покажат първи след deploy-а.

### `buildCampaignCard()` промени
- Показва `scheduled_date + start_time` вместо `created_at`
- Форматиране: `"20 март · 10:00"` (bg) / `"Mar 20 · 10:00"` (en)
- Ако `scheduled_date` е null (стари данни): показва `t("campaign.noDate")`

---

## Стъпка 6 — Map Popup (НОВА — беше пропусната)

**Файл:** `src/services/map.js`

### Query промени
- Добавяме `scheduled_date, start_time` в SELECT на campaigns

### Popup template
```js
const popupContent = `
  <strong>${campaign.title}</strong><br>
  📅 ${formatDate(campaign.scheduled_date)} · ${campaign.start_time?.slice(0,5) || ''}<br>
  <a href="/campaign/${campaign.id}">Виж детайли →</a>
`;
```

---

## Стъпка 7 — Campaign Detail (display)

**Файлове:** `src/pages/campaign-detail.html`, `src/scripts/campaign-detail.js`

### HTML промени
- Нов ред: "Дата: 20 март 2026"
- Нов ред: "Час: 10:00 – 12:00" (или само "10:00" ако няма end_time)
- Weather секция за hourly прогноза (≤7 дни напред)

### JS промени (`displayCampaignDetails`)
- Четем `campaign.scheduled_date`, `campaign.start_time`, `campaign.end_time`
- Форматираме: `new Date(date + "T00:00:00")` — важно за timezone
- Извикваме `loadCampaignWeather(scheduled_date, start_time)`

---

## Стъпка 8 — Weather Service (hourly)

**Файл:** `src/services/weather.js`

Нова export функция:

```js
export async function fetchWeatherForDate(date, startTime) {
  const hour = parseInt(startTime.split(':')[0]);
  const cacheKey = `CLEAN_QUARTER_WEATHER_${date}_${hour}`;

  // Cache check (sessionStorage, 1h TTL)
  // ...

  const url = `https://api.open-meteo.com/v1/forecast`
    + `?latitude=${SOFIA_LAT}&longitude=${SOFIA_LNG}`
    + `&hourly=temperature_2m,weathercode`
    + `&start_date=${date}&end_date=${date}`
    + `&timezone=Europe/Sofia`;

  // Взима hourly[hour] индекс
  // Връща същата структура като fetchWeather()
  // Ако датата е >7 дни напред → връща null (прогнозата не е надеждна)
}
```

**Cache:** Отделен ключ per `date_hour` — не замърсява current weather cache.

---

## Стъпка 9 — Admin панел

**Файл:** `src/scripts/admin.js`

- Добавяме `scheduled_date, start_time` в SELECT на campaigns query
- Показваме датата в таблицата с кампании

---

## Стъпка 10 — Demo данни + version check

**Файл:** `src/utils/demoMode.js`

### Version check (в началото на `initDemoMode`)
```js
const existing = JSON.parse(localStorage.getItem(DEMO_CAMPAIGNS_KEY) || '[]');
if (existing.length > 0 && !existing[0].scheduled_date) {
  localStorage.removeItem(DEMO_CAMPAIGNS_KEY);
}
```

### Demo кампании с бъдещи дати
```js
const futureDate = (days) => {
  const d = new Date();
  d.setDate(d.getDate() + days);
  return d.toISOString().split('T')[0];
};

// campaign-001: futureDate(3),  start_time: '09:00', end_time: '12:00'
// campaign-002: futureDate(7),  start_time: '10:00', end_time: null
// campaign-003: futureDate(14), start_time: '08:00', end_time: '11:00'
// campaign-004: futureDate(5),  start_time: '14:00', end_time: '17:00'
// campaign-005: futureDate(10), start_time: '09:30', end_time: '13:00'
// completed campaign: futureDate(-30) (минала дата е ок за completed)
```

---

## Извън обхвата на този PR

- **Нотификации "събитието ти е след 2 часа"** — изисква pg_cron или
  Supabase Edge Function scheduler. Отделна задача.

---

## Файлове по стъпки (резюме)

| # | Файл | Тип |
|---|---|---|
| 1 | `supabase/migrations/20260315120000_add_campaign_datetime.sql` | Нов |
| 2 | `src/i18n/bg.json` | Промяна |
| 2 | `src/i18n/en.json` | Промяна |
| 2 | `public/i18n/bg.json` | Промяна |
| 2 | `public/i18n/en.json` | Промяна |
| 3 | `src/pages/create-campaign.html` | Промяна |
| 3 | `src/scripts/create-campaign.js` | Промяна |
| 4 | `src/pages/campaign-detail.html` | Промяна |
| 4 | `src/scripts/campaign-detail.js` | Промяна |
| 5 | `src/scripts/dashboard.js` | Промяна |
| 6 | `src/services/map.js` | Промяна |
| 7 | `src/pages/campaign-detail.html` | Промяна |
| 7 | `src/scripts/campaign-detail.js` | Промяна |
| 8 | `src/services/weather.js` | Промяна |
| 9 | `src/scripts/admin.js` | Промяна |
| 10 | `src/utils/demoMode.js` | Промяна |

---

## Ключови архитектурни бележки

1. **Timezone:** Винаги `new Date(date + "T00:00:00")` — не `new Date(date)`,
   защото `"2026-04-15"` се парсва като UTC и може да покаже грешен ден.

2. **Sort след deploy:** `.gte("scheduled_date", today)` е задължително —
   без него backfill-натите стари кампании излизат първи.

3. **`end_time > start_time`:** Enforced на DB ниво с CHECK constraint.

4. **Weather hourly:** Показваме само ако `scheduled_date` е ≤7 дни напред.
   Open-Meteo дава прогноза до 16 дни, но точността след 7 дни е ниска.

5. **Branch:** Задължително от `main` след merge на `feat/weather-widget`.
