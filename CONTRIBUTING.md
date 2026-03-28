# Contributing to Clean Quarter

Thank you for your interest in the project! Every contribution is welcome.

## How to Contribute

### 1. Fork and Clone

```bash
# Fork the repo on GitHub, then clone locally
git clone https://github.com/YOUR_USERNAME/Clean-Quarter.git
cd Clean-Quarter
```

### 2. Setup

```bash
npm install
npm run dev
```

### 3. Create a Branch

```bash
git checkout -b feature/your-feature-name
```

### 4. Make Changes

- Follow the existing code style
- Add comments in English
- Test locally (`npm run test`)

### 5. Commit

```bash
git add .
git commit -m "feat: add your feature description"
```

**Commit message format:**
- `feat:` for new features
- `fix:` for bug fixes
- `docs:` for documentation
- `test:` for tests
- `style:` for CSS/UI changes
- `refactor:` for refactoring

### 6. Push and Open a PR

```bash
git push origin feature/your-feature-name
```

Open a Pull Request on GitHub with a description of your changes.

---

## Code Guidelines

### JavaScript

- ES6+ syntax (async/await, arrow functions)
- `type="module"` on HTML script tags
- Avoid global variables
- Document public functions with JSDoc

### HTML/CSS

- Semantic HTML5
- Bootstrap 5 utility classes
- Mobile-first responsive design
- Accessibility (ARIA labels)

### Testing

- Unit + integration tests for utils/services (Vitest) — **1,097+ tests, all must pass**
- Accessibility tests (axe-core — 55 tests, blocks on critical violations)
- Demo mode compatibility
- New features require tests before merge

---

## Running Tests

```bash
# Lint (must be 0 warnings before anything else)
npm run lint

# Unit + integration tests
npm test

# E2E tests (headless)
npm run test:e2e:headless

# E2E tests (interactive)
npm run test:e2e
```

---

## Database Migrations

Migrations are applied to Supabase prod via **Supabase MCP** (`apply_migration`), not via `supabase db push`.

**Important:** Local files in `supabase/migrations/` may have different timestamps than those registered in prod `supabase_migrations.schema_migrations`. This is expected — the files are reference-only for version control. Do not use `supabase db push` from the local repo, as it may report errors or skip already-applied migrations.

To add a new migration:
1. Create a `.sql` file in `supabase/migrations/` with a timestamp prefix
2. Apply it via Supabase MCP (`apply_migration`)
3. Verify in prod with `list_migrations`

---

## Reporting Issues

If you find a bug:
1. Check if it has already been reported in Issues
2. Open a new Issue with:
   - Description of the problem
   - Steps to reproduce
   - Screenshot (if it's a visual issue)
   - Browser/OS version

---

## Feature Requests

Have an idea for a new feature?
1. Open a Discussion or Issue
2. Explain the use case
3. Propose an implementation (optional)

---

## Documentation

When changing an API or adding major features:
- Update `README.md`
- Add/update JSDoc comments
- Add examples in `docs/`

---

## Code Review Process

1. Automated checks (CI/CD) must pass
2. At least one reviewer approves
3. Merge to main after approval

---

**Questions?** Open a Discussion or find contact info in the README.
