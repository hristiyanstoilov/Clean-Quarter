# Contributing to Clean Quarter

Благодарим за интереса към проекта! Всеки принос е ценен.

## 🚀 Как да допринесеш

### 1. Fork и Clone
```bash
# Fork repo-то в GitHub
# След това клонирай локално
git clone https://github.com/YOUR_USERNAME/Clean-Quarter.git
cd Clean-Quarter
```

### 2. Setup
```bash
npm install
npm run dev
```

### 3. Създай Branch
```bash
git checkout -b feature/your-feature-name
```

### 4. Направи промени
- Следвай съществуващия код стил
- Добави коментари на български или английски
- Тествай локално (npm run test)

### 5. Commit
```bash
git add .
git commit -m "feat: add your feature description"
```

**Commit message format:**
- `feat:` за нови функционалности
- `fix:` за bugfix-ове
- `docs:` за документация
- `test:` за тестове
- `style:` за CSS/UI промени
- `refactor:` за рефакторинг

### 6. Push и PR
```bash
git push origin feature/your-feature-name
```

Отвори Pull Request в GitHub с описание на промените.

## 📋 Code Guidelines

### JavaScript
- ES6+ синтаксис (async/await, arrow functions)
- Type="module" в HTML скриптове
- Избягвай глобални променливи
- Документирай публични функции

### HTML/CSS
- Semantic HTML5
- Bootstrap 5 utility classes
- Mobile-first responsive design
- Accessibility (ARIA labels)

### Testing
- Unit + integration tests за utils/services (Vitest) — 973+ теста, всички трябва да минават
- E2E tests за критични флоуве (Cypress — включително file upload и mobile touch)
- Accessibility tests (axe-core — 55 теста, блокира на critical violations)
- Visual regression (Playwright — 2% pixel tolerance)
- Demo mode compatibility
- Нови features изискват тестове преди merge

## 🧪 Running Tests

```bash
# Lint (трябва да е 0 warnings преди всичко)
npm run lint

# Unit + integration tests
npm test

# E2E tests (headless)
npm run test:e2e:headless

# E2E tests (interactive)
npm run test:e2e

# Visual regression baseline update (само след intentional UI промени)
npm run playwright:update
```

## 🗄️ Database Migrations

Миграциите се прилагат към Supabase prod чрез **Supabase MCP** (не чрез `supabase db push`).

**Важно:** Локалните файлове в `supabase/migrations/` имат различни timestamps от регистрираните в prod `supabase_migrations.schema_migrations`. Това е очаквано поведение — файловете са reference-only за version control. Не използвай `supabase db push` от локалното repo, тъй като ще докладва грешки или ще пропусне вече приложени миграции.

За нова миграция:
1. Създай `.sql` файл в `supabase/migrations/` с timestamp-prefix
2. Приложи го чрез Supabase MCP (`apply_migration`)
3. Провери в prod с `list_migrations`

## 🐛 Reporting Issues

Ако намериш bug:
1. Провери дали вече не е репортван в Issues
2. Създай нов Issue с:
   - Описание на проблема
   - Стъпки за репродукция
   - Screenshot (ако е визуален проблем)
   - Browser/OS версия

## 💡 Feature Requests

Имаш идея за нова функционалност?
1. Отвори Discussion или Issue
2. Обясни use case-а
3. Предложи имплементация (опционално)

## 📖 Documentation

При промени в API или major features:
- Обнови README.md
- Добави/обнови JSDoc коментари
- Добави примери в docs/

## ✅ Code Review Process

1. Автоматични проверки (CI/CD) трябва да минат
2. Поне един reviewer одобрява
3. Merge to main след одобрение

## 🙏 Благодарности

Специални благодарности на всички contributors! Вижте пълния списък в [Contributors](https://github.com/hristiyanstoilov/Clean-Quarter/graphs/contributors).

---

**Въпроси?** Отвори Discussion или намери контакт в README.
