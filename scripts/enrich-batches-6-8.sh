#!/usr/bin/env bash
set -euo pipefail

echo "Adding content to batches 6-8..."
cd "c:/VS Code Softuni/Чиста Дървеница"

git fetch origin

declare -A BATCH_CONTENT=(
  ["06"]="feat:Add campaign filters by neighborhood and status"
  ["07"]="feat:Add participation approval workflow"
  ["08"]="docs:Add contribution guidelines"
)

for batch_num in {06..08}; do
  BR="blitz/batch-${batch_num}"
  TITLE="${BATCH_CONTENT[$batch_num]}"
  
  echo "Processing $BR: $TITLE"
  
  git checkout -B "$BR" "origin/$BR"
  
  case $batch_num in
    06)
      mkdir -p src/utils
      cat > src/utils/campaign-filters.js <<'EOF'
/**
 * Campaign filtering utilities
 */

export const NEIGHBORHOODS = [
  'Studentski Grad',
  'Darvenitsa',
  'Musagenitsa',
  'Kv. Vitosha (VEC)',
  'Malinova Dolina'
];

export const STATUSES = ['active', 'completed', 'cancelled'];

export function filterCampaigns(campaigns, filters = {}) {
  let filtered = [...campaigns];
  
  if (filters.neighborhood) {
    filtered = filtered.filter(c => c.neighborhood === filters.neighborhood);
  }
  
  if (filters.status) {
    filtered = filtered.filter(c => c.status === filters.status);
  }
  
  if (filters.searchTerm) {
    const term = filters.searchTerm.toLowerCase();
    filtered = filtered.filter(c => 
      c.title.toLowerCase().includes(term) ||
      c.description?.toLowerCase().includes(term)
    );
  }
  
  return filtered;
}

export function sortCampaigns(campaigns, sortBy = 'created_at', order = 'desc') {
  const sorted = [...campaigns];
  
  sorted.sort((a, b) => {
    const aVal = a[sortBy];
    const bVal = b[sortBy];
    
    if (order === 'asc') {
      return aVal > bVal ? 1 : -1;
    }
    return aVal < bVal ? 1 : -1;
  });
  
  return sorted;
}
EOF
      git add src/utils/campaign-filters.js
      ;;
    
    07)
      mkdir -p src/workflows
      cat > src/workflows/participation-approval.js <<'EOF'
/**
 * Participation approval workflow
 */

export const APPROVAL_STATUSES = {
  PENDING: 'pending',
  APPROVED: 'approved',
  REJECTED: 'rejected'
};

export function validateParticipationForApproval(participation) {
  const errors = [];
  
  if (!participation.after_photo_url) {
    errors.push('After photo is required');
  }
  
  if (!participation.campaign_id) {
    errors.push('Campaign ID is missing');
  }
  
  if (!participation.user_id) {
    errors.push('User ID is missing');
  }
  
  return {
    valid: errors.length === 0,
    errors
  };
}

export async function approveParticipation(participationId, adminUserId, supabase) {
  // Update participation status
  const { data, error } = await supabase
    .from('participations')
    .update({ 
      status: APPROVAL_STATUSES.APPROVED,
      approved_by: adminUserId,
      approved_at: new Date().toISOString()
    })
    .eq('id', participationId)
    .select()
    .single();
  
  if (error) throw error;
  
  // Award points (handled by DB trigger in production)
  return data;
}

export async function rejectParticipation(participationId, reason, adminUserId, supabase) {
  const { data, error } = await supabase
    .from('participations')
    .update({ 
      status: APPROVAL_STATUSES.REJECTED,
      rejection_reason: reason,
      reviewed_by: adminUserId,
      reviewed_at: new Date().toISOString()
    })
    .eq('id', participationId)
    .select()
    .single();
  
  if (error) throw error;
  return data;
}
EOF
      git add src/workflows/participation-approval.js
      ;;
    
    08)
      cat > CONTRIBUTING.md <<'EOF'
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
- Unit tests за utils/services (Vitest)
- E2E tests за критични флоуве (Cypress)
- Demo mode compatibility

## 🧪 Running Tests

```bash
# Unit tests
npx vitest run

# E2E tests (headless)
npm run test:e2e:headless

# E2E tests (interactive)
npm run test:e2e
```

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
EOF
      git add CONTRIBUTING.md
      ;;
  esac
  
  git commit -m "${TITLE}"  
  git push origin "$BR" --force
  
  echo "✓ Updated $BR"
done

echo ""
echo "=========================================="
echo "Successfully added content to batches 6-8"
echo "=========================================="
