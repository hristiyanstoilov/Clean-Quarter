/**
 * Ensure a user exists in CLEAN_QUARTER_DEMO_USERS
 * @param {Object} user - user object with at least id, username, role
 */
export function ensureDemoUser(user) {
  if (!user || !user.id) return;
  const users = JSON.parse(localStorage.getItem("CLEAN_QUARTER_DEMO_USERS") || "[]");
  if (!users.find((u) => u.id === user.id)) {
    users.push(user);
    localStorage.setItem("CLEAN_QUARTER_DEMO_USERS", JSON.stringify(users));
  }
}
/**
 * Demo Mode - Local mock data for testing without Supabase
 * Use email: admin@demo.com, password: demo123
 */

const DEMO_MODE_KEY = "CLEAN_QUARTER_DEMO_MODE";
const DEMO_USER_KEY = "CLEAN_QUARTER_DEMO_USER";
const DEMO_CAMPAIGNS_KEY = "CLEAN_QUARTER_DEMO_CAMPAIGNS";
const DEMO_PARTICIPATIONS_KEY = "CLEAN_QUARTER_DEMO_PARTICIPATIONS";
const DEMO_REWARDS_KEY = "CLEAN_QUARTER_DEMO_REWARDS";
const DEMO_TRANSACTIONS_KEY = "CLEAN_QUARTER_DEMO_TRANSACTIONS";

/**
 * Initialize demo mode with sample data
 */
export function initDemoMode() {
  const demoUser = {
    id: "demo-admin-001",
    email: "admin@demo.com",
    username: "admin_demo",
    role: "admin",
    points_balance: 2500,
    neighborhood: "Studentski Grad",
    avatar_url: null,
    created_at: new Date("2024-01-15").toISOString(),
  };

  const demoCampaigns = [
    {
      id: "campaign-001",
      title: 'Почистване на парк "Студентски"',
      description: "Събиране на боклук около детската площадка",
      location_lat: 42.6977,
      location_lng: 23.3219,
      status: "active",
      before_photo_url:
        "data:image/svg+xml,%3Csvg xmlns=%22http://www.w3.org/2000/svg%22 width=%22400%22 height=%22300%22%3E%3Crect fill=%22%234CAF50%22 width=%22400%22 height=%22300%22/%3E%3Ctext x=%2250%25%22 y=%2250%25%22 text-anchor=%22middle%22 dy=%22.3em%22 fill=%22white%22 font-size=%2220%22%3EBefore Photo 📷%3C/text%3E%3C/svg%3E",
      created_by: "demo-admin-001",
      neighborhood: "Studentski Grad",
      created_at: new Date("2024-01-10").toISOString(),
      updated_at: new Date("2024-01-10").toISOString(),
    },
    {
      id: "campaign-002",
      title: 'Почистване на тротоар улица "Царица Йоанна"',
      description: "Премахване на листа и боклук от тротоара",
      location_lat: 42.695,
      location_lng: 23.318,
      status: "active",
      before_photo_url:
        "data:image/svg+xml,%3Csvg xmlns=%22http://www.w3.org/2000/svg%22 width=%22400%22 height=%22300%22%3E%3Crect fill=%22%234CAF50%22 width=%22400%22 height=%22300%22/%3E%3Ctext x=%2250%25%22 y=%2250%25%22 text-anchor=%22middle%22 dy=%22.3em%22 fill=%22white%22 font-size=%2220%22%3EBefore Photo 📷%3C/text%3E%3C/svg%3E",
      created_by: "demo-admin-001",
      neighborhood: "Darvenitsa",
      created_at: new Date("2024-01-12").toISOString(),
      updated_at: new Date("2024-01-12").toISOString(),
    },
    {
      id: "campaign-003",
      title: 'Почистване на зелена площ "Малинова долина"',
      description: "Събиране на пластмасови отпадъци",
      location_lat: 42.692,
      location_lng: 23.315,
      status: "completed",
      before_photo_url:
        "data:image/svg+xml,%3Csvg xmlns=%22http://www.w3.org/2000/svg%22 width=%22400%22 height=%22300%22%3E%3Crect fill=%22%234CAF50%22 width=%22400%22 height=%22300%22/%3E%3Ctext x=%2250%25%22 y=%2250%25%22 text-anchor=%22middle%22 dy=%22.3em%22 fill=%22white%22 font-size=%2220%22%3EBefore Photo 📷%3C/text%3E%3C/svg%3E",
      created_by: "demo-admin-001",
      neighborhood: "Malinova Dolina",
      created_at: new Date("2024-01-05").toISOString(),
      updated_at: new Date("2024-01-08").toISOString(),
    },
    {
      id: "campaign-004",
      title: "Почистване на спортно игрище",
      description: "Основно чистене на игрището и около него",
      location_lat: 42.7,
      location_lng: 23.325,
      status: "active",
      before_photo_url:
        "data:image/svg+xml,%3Csvg xmlns=%22http://www.w3.org/2000/svg%22 width=%22400%22 height=%22300%22%3E%3Crect fill=%22%234CAF50%22 width=%22400%22 height=%22300%22/%3E%3Ctext x=%2250%25%22 y=%2250%25%22 text-anchor=%22middle%22 dy=%22.3em%22 fill=%22white%22 font-size=%2220%22%3EBefore Photo 📷%3C/text%3E%3C/svg%3E",
      created_by: "demo-admin-001",
      neighborhood: "Vitosha (VEC)",
      created_at: new Date("2024-01-14").toISOString(),
      updated_at: new Date("2024-01-14").toISOString(),
    },
    {
      id: "campaign-005",
      title: "Почистване на устата на поток",
      description: "Събиране на боклук около потока Церова",
      location_lat: 42.689,
      location_lng: 23.31,
      status: "active",
      before_photo_url:
        "data:image/svg+xml,%3Csvg xmlns=%22http://www.w3.org/2000/svg%22 width=%22400%22 height=%22300%22%3E%3Crect fill=%22%234CAF50%22 width=%22400%22 height=%22300%22/%3E%3Ctext x=%2250%25%22 y=%2250%25%22 text-anchor=%22middle%22 dy=%22.3em%22 fill=%22white%22 font-size=%2220%22%3EBefore Photo 📷%3C/text%3E%3C/svg%3E",
      created_by: "demo-admin-001",
      neighborhood: "Musagenitsa",
      created_at: new Date("2024-01-13").toISOString(),
      updated_at: new Date("2024-01-13").toISOString(),
    },
  ];

  const demoParticipations = [
    {
      id: "part-001",
      campaign_id: "campaign-001",
      user_id: "user-demo-001",
      status: "approved",
      after_photo_url:
        "data:image/svg+xml,%3Csvg xmlns=%22http://www.w3.org/2000/svg%22 width=%22400%22 height=%22300%22%3E%3Crect fill=%2288C540%22 width=%22400%22 height=%22300%22/%3E%3Ctext x=%2250%25%22 y=%2250%25%22 text-anchor=%22middle%22 dy=%22.3em%22 fill=%22white%22 font-size=%2220%22%3EAfter Photo ✓%3C/text%3E%3C/svg%3E",
      points_earned: 150,
      created_at: new Date("2024-01-11").toISOString(),
      updated_at: new Date("2024-01-11").toISOString(),
    },
    {
      id: "part-002",
      campaign_id: "campaign-002",
      user_id: "user-demo-002",
      status: "pending",
      after_photo_url:
        "data:image/svg+xml,%3Csvg xmlns=%22http://www.w3.org/2000/svg%22 width=%22400%22 height=%22300%22%3E%3Crect fill=%2288C540%22 width=%22400%22 height=%22300%22/%3E%3Ctext x=%2250%25%22 y=%2250%25%22 text-anchor=%22middle%22 dy=%22.3em%22 fill=%22white%22 font-size=%2220%22%3EAfter Photo ✓%3C/text%3E%3C/svg%3E",
      points_earned: 0,
      created_at: new Date("2024-01-13").toISOString(),
      updated_at: new Date("2024-01-13").toISOString(),
    },
    {
      id: "part-003",
      campaign_id: "campaign-003",
      user_id: "user-demo-003",
      status: "approved",
      after_photo_url:
        "data:image/svg+xml,%3Csvg xmlns=%22http://www.w3.org/2000/svg%22 width=%22400%22 height=%22300%22%3E%3Crect fill=%2288C540%22 width=%22400%22 height=%22300%22/%3E%3Ctext x=%2250%25%22 y=%2250%25%22 text-anchor=%22middle%22 dy=%22.3em%22 fill=%22white%22 font-size=%2220%22%3EAfter Photo ✓%3C/text%3E%3C/svg%3E",
      points_earned: 200,
      created_at: new Date("2024-01-08").toISOString(),
      updated_at: new Date("2024-01-08").toISOString(),
    },
  ];

  const demoRewards = [
    {
      id: "reward-001",
      title: "Безплатен обяд от местна кетърингна фирма",
      description: "Цял пакет за един човек",
      cost: 300,
      category: "food",
      image_url:
        "data:image/svg+xml,%3Csvg xmlns=%22http://www.w3.org/2000/svg%22 width=%22150%22 height=%22150%22%3E%3Ccircle cx=%2275%22 cy=%2275%22 r=%2270%22 fill=%22%23FF6B6B%22/%3E%3Ctext x=%2275%22 y=%2275%22 text-anchor=%22middle%22 dy=%22.3em%22 fill=%22white%22 font-size=%2240%22%3E🍽️%3C/text%3E%3C/svg%3E",
      quantity_available: 10,
    },
    {
      id: "reward-002",
      title: "Месечна карта за фитнес",
      description: "Пълна месечна членуване в локално фитнес студио",
      cost: 500,
      category: "fitness",
      image_url:
        "data:image/svg+xml,%3Csvg xmlns=%22http://www.w3.org/2000/svg%22 width=%22150%22 height=%22150%22%3E%3Ccircle cx=%2275%22 cy=%2275%22 r=%2270%22 fill=%22%234ECDC4%22/%3E%3Ctext x=%2275%22 y=%2275%22 text-anchor=%22middle%22 dy=%22.3em%22 fill=%22white%22 font-size=%2240%22%3E💪%3C/text%3E%3C/svg%3E",
      quantity_available: 5,
    },
    {
      id: "reward-003",
      title: "Билет за кино",
      description: "Един билет за кино сеанс по избор",
      cost: 150,
      category: "entertainment",
      image_url:
        "data:image/svg+xml,%3Csvg xmlns=%22http://www.w3.org/2000/svg%22 width=%22150%22 height=%22150%22%3E%3Ccircle cx=%2275%22 cy=%2275%22 r=%2270%22 fill=%22%2345B7D1%22/%3E%3Ctext x=%2275%22 y=%2275%22 text-anchor=%22middle%22 dy=%22.3em%22 fill=%22white%22 font-size=%2240%22%3E🎬%3C/text%3E%3C/svg%3E",
      quantity_available: 20,
    },
    {
      id: "reward-004",
      title: "Сертификат за козметични услуги",
      description: "Сертификат за 100 лв. в локален козметичен салон",
      cost: 400,
      category: "beauty",
      image_url:
        "data:image/svg+xml,%3Csvg xmlns=%22http://www.w3.org/2000/svg%22 width=%22150%22 height=%22150%22%3E%3Ccircle cx=%2275%22 cy=%2275%22 r=%2270%22 fill=%22%23F39C12%22/%3E%3Ctext x=%2275%22 y=%2275%22 text-anchor=%22middle%22 dy=%22.3em%22 fill=%22white%22 font-size=%2240%22%3E💄%3C/text%3E%3C/svg%3E",
      quantity_available: 8,
    },
    {
      id: "reward-005",
      title: "Книга по избор",
      description: "Която и да е книга от местната книжарница",
      cost: 100,
      category: "culture",
      image_url:
        "data:image/svg+xml,%3Csvg xmlns=%22http://www.w3.org/2000/svg%22 width=%22150%22 height=%22150%22%3E%3Ccircle cx=%2275%22 cy=%2275%22 r=%2270%22 fill=%22%236C5CE7%22/%3E%3Ctext x=%2275%22 y=%2275%22 text-anchor=%22middle%22 dy=%22.3em%22 fill=%22white%22 font-size=%2240%22%3E📚%3C/text%3E%3C/svg%3E",
      quantity_available: 25,
    },
    {
      id: "reward-006",
      title: "Чай и десерт в кафе",
      description: "Комплимент - чай и сладкиш по избор",
      cost: 80,
      category: "food",
      image_url:
        "data:image/svg+xml,%3Csvg xmlns=%22http://www.w3.org/2000/svg%22 width=%22150%22 height=%22150%22%3E%3Ccircle cx=%2275%22 cy=%2275%22 r=%2270%22 fill=%22%238B4513%22/%3E%3Ctext x=%2275%22 y=%2275%22 text-anchor=%22middle%22 dy=%22.3em%22 fill=%22white%22 font-size=%2240%22%3E☕%3C/text%3E%3C/svg%3E",
      quantity_available: 15,
    },
    {
      id: "reward-007",
      title: "Парфюм образец",
      description: "Премиум парфюм образец (5ml)",
      cost: 120,
      category: "beauty",
      image_url:
        "data:image/svg+xml,%3Csvg xmlns=%22http://www.w3.org/2000/svg%22 width=%22150%22 height=%22150%22%3E%3Ccircle cx=%2275%22 cy=%2275%22 r=%2270%22 fill=%22%23E91E63%22/%3E%3Ctext x=%2275%22 y=%2275%22 text-anchor=%22middle%22 dy=%22.3em%22 fill=%22white%22 font-size=%2240%22%3E💐%3C/text%3E%3C/svg%3E",
      quantity_available: 30,
    },
    {
      id: "reward-008",
      title: "Пица на място",
      description: "Една голяма пица от популярна пицария",
      cost: 250,
      category: "food",
      image_url:
        "data:image/svg+xml,%3Csvg xmlns=%22http://www.w3.org/2000/svg%22 width=%22150%22 height=%22150%22%3E%3Ccircle cx=%2275%22 cy=%2275%22 r=%2270%22 fill=%22%23FFA500%22/%3E%3Ctext x=%2275%22 y=%2275%22 text-anchor=%22middle%22 dy=%22.3em%22 fill=%22white%22 font-size=%2240%22%3E🍕%3C/text%3E%3C/svg%3E",
      quantity_available: 12,
    },
    {
      id: "reward-009",
      title: "Билет за басейн",
      description: "Месячна карта за басейн Студентски",
      cost: 350,
      category: "fitness",
      image_url:
        "data:image/svg+xml,%3Csvg xmlns=%22http://www.w3.org/2000/svg%22 width=%22150%22 height=%22150%22%3E%3Ccircle cx=%2275%22 cy=%2275%22 r=%2270%22 fill=%223498DB%22/%3E%3Ctext x=%2275%22 y=%2275%22 text-anchor=%22middle%22 dy=%22.3em%22 fill=%22white%22 font-size=%2240%22%3E🏊%3C/text%3E%3C/svg%3E",
      quantity_available: 7,
    },
    {
      id: "reward-010",
      title: "Консултация с диетолог",
      description: "Еднократна консултация с лицензиран диетолог",
      cost: 450,
      category: "health",
      image_url:
        "data:image/svg+xml,%3Csvg xmlns=%22http://www.w3.org/2000/svg%22 width=%22150%22 height=%22150%22%3E%3Ccircle cx=%2275%22 cy=%2275%22 r=%2270%22 fill=%2227AE60%22/%3E%3Ctext x=%2275%22 y=%2275%22 text-anchor=%22middle%22 dy=%22.3em%22 fill=%22white%22 font-size=%2240%22%3E🥗%3C/text%3E%3C/svg%3E",
      quantity_available: 4,
    },
  ];

  const demoTransactions = [
    {
      id: "trans-001",
      user_id: "demo-admin-001",
      amount: 150,
      type: "earned",
      description: 'Почистване на парк "Студентски"',
      campaign_id: "campaign-001",
      created_at: new Date("2024-01-11").toISOString(),
    },
    {
      id: "trans-002",
      user_id: "demo-admin-001",
      amount: 300,
      type: "spent",
      description: "Използване на награда: Обяд",
      reward_id: "reward-001",
      created_at: new Date("2024-01-12").toISOString(),
    },
    {
      id: "trans-003",
      user_id: "demo-admin-001",
      amount: 200,
      type: "earned",
      description: 'Почистване на улица "Царица Йоанна"',
      campaign_id: "campaign-002",
      created_at: new Date("2024-01-13").toISOString(),
    },
    {
      id: "trans-004",
      user_id: "demo-admin-001",
      amount: 500,
      type: "earned",
      description: "Почистване на зелена площ",
      campaign_id: "campaign-003",
      created_at: new Date("2024-01-08").toISOString(),
    },
    {
      id: "trans-005",
      user_id: "demo-admin-001",
      amount: 100,
      type: "spent",
      description: "Използване на награда: Книга",
      reward_id: "reward-005",
      created_at: new Date("2024-01-14").toISOString(),
    },
  ];

  // Save to localStorage
  localStorage.setItem(DEMO_MODE_KEY, "true");
  localStorage.setItem(DEMO_USER_KEY, JSON.stringify(demoUser));
  localStorage.setItem(DEMO_CAMPAIGNS_KEY, JSON.stringify(demoCampaigns));
  localStorage.setItem(DEMO_PARTICIPATIONS_KEY, JSON.stringify(demoParticipations));
  localStorage.setItem(DEMO_REWARDS_KEY, JSON.stringify(demoRewards));
  localStorage.setItem(DEMO_TRANSACTIONS_KEY, JSON.stringify(demoTransactions));
}

/**
 * Check if we're in demo mode
 */
export function isDemoMode() {
  return localStorage.getItem(DEMO_MODE_KEY) === "true";
}

/**
 * Get demo user (admin)
 */
export function getDemoUser() {
  const user = localStorage.getItem(DEMO_USER_KEY);
  return user ? JSON.parse(user) : null;
}

/**
 * Get all demo campaigns
 */
export function getDemoCampaigns() {
  const campaigns = localStorage.getItem(DEMO_CAMPAIGNS_KEY);
  return campaigns ? JSON.parse(campaigns) : [];
}

/**
 * Get demo campaign by ID
 */
export function getDemoCampaignById(id) {
  const campaigns = getDemoCampaigns();
  return campaigns.find((c) => c.id === id);
}

/**
 * Get demo participations
 */
export function getDemoParticipations() {
  const participations = localStorage.getItem(DEMO_PARTICIPATIONS_KEY);
  return participations ? JSON.parse(participations) : [];
}
// When creating a new participation in demo mode, ensure the user is added
// Example usage: When creating a new participation in demo mode, call ensureDemoUser
// For example, in your participation creation logic:
// ensureDemoUser(currentUser);

/**
 * Get demo rewards
 */
export function getDemoRewards() {
  const rewards = localStorage.getItem(DEMO_REWARDS_KEY);
  return rewards ? JSON.parse(rewards) : [];
}

/**
 * Get demo transactions
 */
export function getDemoTransactions() {
  const transactions = localStorage.getItem(DEMO_TRANSACTIONS_KEY);
  return transactions ? JSON.parse(transactions) : [];
}

/**
 * Clear demo mode
 */
export function clearDemoMode() {
  localStorage.removeItem(DEMO_MODE_KEY);
  localStorage.removeItem(DEMO_USER_KEY);
  localStorage.removeItem(DEMO_CAMPAIGNS_KEY);
  localStorage.removeItem(DEMO_PARTICIPATIONS_KEY);
  localStorage.removeItem(DEMO_REWARDS_KEY);
  localStorage.removeItem(DEMO_TRANSACTIONS_KEY);
}
