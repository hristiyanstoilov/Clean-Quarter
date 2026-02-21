# 📋 План за Push на PR-та - Clean Quarter

## ✅ PR #1 - ЗАВРШЕНА (Feb 1)
- **Status:** Merged to main ✅
- **Files:** 10
  - tests/validation.test.js
  - tests/auth-store.integration.test.js
  - tests/auth.test.js
  - tests/logger.test.js
  - tests/map.integration.test.js
  - tests/map.test.js
  - tests/storage.integration.test.js
  - tests/supabase.crud.integration.test.js
  - tests/supabase.extra.integration.test.js
  - src/services/auth.js
- **Result:** 90 tests passing, 0 failures

---

## 📅 PR #2 - ЗА УТРЕ (Feb 2)
**Тема:** Configuration, Build & Core Updates

### Файлове за включване:
1. **Config Files** (4 файла):
   - vite.config.js
   - vitest.config.js
   - cypress.config.js
   - .github/workflows/ci.yml

2. **Core App Files** (2 файла):
   - src/main.js
   - index.html

3. **Package Management** (2 файла):
   - package.json
   - package-lock.json

**Total:** 8 файла

---

## 📅 PR #3 - ЗА 3-ти ДЕН (Feb 3)
**Тема:** Services & Core Logic Updates

### Файлове за включване:
1. **Service Updates** (5 файла):
   - src/services/errorHandler.js
   - src/services/logger.js
   - src/services/map.js
   - src/services/pwa.js
   - src/services/storage.js

2. **Core Services** (2 файла):
   - src/services/supabase.js
   - src/services/validation.js

3. **API & State** (2 файла):
   - src/api/client.js
   - src/state/store.js

**Total:** 9 файла

---

## 📅 PR #4 - ЗА 4-ти ДЕН (Feb 4)
**Тема:** UI & Components Updates

### Файлове за включване:
1. **Pages** (6 файла):
   - src/pages/admin.html
   - src/pages/campaign-detail.html
   - src/pages/create-campaign.html
   - src/pages/dashboard.html
   - src/pages/profile.html
   - src/pages/rewards.html

2. **Components** (1 файл):
   - src/components/navbar.html

**Total:** 7 файла

---

## 📅 PR #5 - ЗА 5-ти ДЕН (Feb 5)
**Тема:** Utilities & Internationalization

### Файлове за включване:
1. **Utils** (3 файла):
   - src/utils/demoMode.js
   - src/utils/helpers.js
   - src/utils/i18n.js

2. **Hooks** (1 файл):
   - src/hooks/index.js

3. **i18n Translations** (2 файла):
   - src/i18n/bg.json
   - src/i18n/en.json

**Total:** 6 файла

---

## 📅 PR #6 - ЗА 6-ти ДЕН (Feb 6)
**Тема:** New Services & Components

### Файлове за включување:
1. **New Services** (1 файл):
   - src/services/points.js

2. **New Components** (2 файла):
   - src/components/passwordStrength.js
   - src/components/passwordToggle.js

3. **Utilities** (1 файл):
   - src/utils/env.js

**Total:** 4 файла

---

## 📅 PR #7 - ЗА 7-ми ДЕН (Feb 7)
**Тема:** E2E Tests (Cypress)

### Файлове за включување:
1. **Cypress E2E Tests** (9 файла):
   - cypress/e2e/admin.cy.js
   - cypress/e2e/approve-participation.cy.js
   - cypress/e2e/create-campaign.cy.js
   - cypress/e2e/join-campaign.cy.js
   - cypress/e2e/navigation.cy.js
   - cypress/e2e/profile.cy.js
   - cypress/e2e/rewards.cy.js
   - cypress/e2e/user-history.cy.js

**Total:** 9 файла

---

## 📅 PR #8 - ЗА 8-ми ДЕН (Feb 8)
**Тема:** Documentation

### Файлове за включување:
1. **README** (1 файл):
   - README.md

**Total:** 1 файл

---

## ⚠️ EXCLUDE (НЕ пушвать):
1. **Coverage Files** (23 файла) - генерирани автоматски
   - coverage/** (всичко)

2. **Temporary/Test Files** (неклассифицирани):
   - minimal-root.test.js
   - src/main-clean.js
   - src/services/__tests__/
   - tests-simple/
   - tests/rls-policy.node.js
   - tests/rls-policy.test.js
   - tests/sanity.test.js

---

## 📊 РЕЗЮМЕ

| PR | Дата | Файлове | Тема |
|----|----|---------|------|
| #1 | Feb 1 | 10 | ✅ Test Fixes |
| #2 | Feb 2 | 8 | Config & Build |
| #3 | Feb 3 | 9 | Services & Logic |
| #4 | Feb 4 | 7 | UI & Pages |
| #5 | Feb 5 | 6 | Utils & i18n |
| #6 | Feb 6 | 4 | New Services |
| #7 | Feb 7 | 9 | E2E Tests |
| #8 | Feb 8 | 1 | Documentation |

**總:** 54 файла (без coverage & temp файлове)

---

## 🚀 НАЧИН НА ДЕЙСТВИЕ ДО УТРЕ

1. Утре (Feb 2) ще подготвим гранка за PR #2
2. Ще добавиме само файловете за Config & Build
3. Commit и push

Готово! ✅
