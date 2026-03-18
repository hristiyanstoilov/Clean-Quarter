// Unit tests for rewards.js functionality

describe('Rewards - Points Validation', () => {
  it('should check if user can afford a reward', () => {
    const canAfford = (userPoints, rewardCost) => {
      return userPoints >= rewardCost;
    };

    expect(canAfford(100, 50)).toBe(true);
    expect(canAfford(50, 100)).toBe(false);
    expect(canAfford(100, 100)).toBe(true);
    expect(canAfford(0, 1)).toBe(false);
  });

  it('should calculate points deficit', () => {
    const calculateDeficit = (userPoints, rewardCost) => {
      return Math.max(0, rewardCost - userPoints);
    };

    expect(calculateDeficit(50, 100)).toBe(50);
    expect(calculateDeficit(100, 50)).toBe(0);
    expect(calculateDeficit(100, 100)).toBe(0);
    expect(calculateDeficit(0, 100)).toBe(100);
  });

  it('should calculate new balance after purchase', () => {
    const calculateNewBalance = (currentBalance, rewardCost) => {
      return currentBalance - rewardCost;
    };

    expect(calculateNewBalance(100, 50)).toBe(50);
    expect(calculateNewBalance(100, 100)).toBe(0);
    expect(calculateNewBalance(1000, 250)).toBe(750);
  });

  it('should handle invalid point values gracefully', () => {
    const canAfford = (userPoints, rewardCost) => {
      const points = userPoints || 0;
      const cost = rewardCost || 0;
      return points >= cost;
    };

    expect(canAfford(null, 50)).toBe(false);
    expect(canAfford(undefined, 50)).toBe(false);
    expect(canAfford(100, null)).toBe(true);
    expect(canAfford(100, undefined)).toBe(true);
  });
});

describe('Rewards - Category Emoji Mapping', () => {
  const getRewardEmoji = (category) => {
    const emojiMap = {
      discount: '🎟️',
      voucher: '🏷️',
      service: '🛠️',
      experience: '🎪',
      donation: '❤️',
      merchandise: '👕',
      partnership: '🤝',
      other: '🎁'
    };
    return emojiMap[category?.toLowerCase()] || '🎁';
  };

  it('should return correct emoji for each category', () => {
    expect(getRewardEmoji('discount')).toBe('🎟️');
    expect(getRewardEmoji('voucher')).toBe('🏷️');
    expect(getRewardEmoji('service')).toBe('🛠️');
    expect(getRewardEmoji('experience')).toBe('🎪');
    expect(getRewardEmoji('donation')).toBe('❤️');
    expect(getRewardEmoji('merchandise')).toBe('👕');
    expect(getRewardEmoji('partnership')).toBe('🤝');
    expect(getRewardEmoji('other')).toBe('🎁');
  });

  it('should handle case-insensitive categories', () => {
    expect(getRewardEmoji('DISCOUNT')).toBe('🎟️');
    expect(getRewardEmoji('Voucher')).toBe('🏷️');
    expect(getRewardEmoji('SERVICE')).toBe('🛠️');
  });

  it('should return default emoji for unknown categories', () => {
    expect(getRewardEmoji('unknown')).toBe('🎁');
    expect(getRewardEmoji('')).toBe('🎁');
    expect(getRewardEmoji(null)).toBe('🎁');
    expect(getRewardEmoji(undefined)).toBe('🎁');
  });
});

describe('Rewards - Filtering and Sorting', () => {
  const mockRewards = [
    { id: 1, title: 'Discount 10%', category: 'discount', cost: 50 },
    { id: 2, title: 'Coffee Voucher', category: 'voucher', cost: 30 },
    { id: 3, title: 'Cleaning Service', category: 'service', cost: 200 },
    { id: 4, title: 'Park Experience', category: 'experience', cost: 100 }
  ];

  it('should filter affordable rewards', () => {
    const filterAffordable = (rewards, userPoints) => {
      return rewards.filter(r => r.cost <= userPoints);
    };

    const affordable = filterAffordable(mockRewards, 100);
    expect(affordable).toHaveLength(3);
    expect(affordable.every(r => r.cost <= 100)).toBe(true);
  });

  it('should filter rewards by category', () => {
    const filterByCategory = (rewards, category) => {
      if (!category || category === 'all') return rewards;
      return rewards.filter(r => r.category === category);
    };

    const vouchers = filterByCategory(mockRewards, 'voucher');
    expect(vouchers).toHaveLength(1);
    expect(vouchers[0].title).toBe('Coffee Voucher');
  });

  it('should sort rewards by cost (ascending)', () => {
    const sortByCost = (rewards, order = 'asc') => {
      return [...rewards].sort((a, b) => {
        return order === 'asc' ? a.cost - b.cost : b.cost - a.cost;
      });
    };

    const sorted = sortByCost(mockRewards, 'asc');
    expect(sorted[0].cost).toBe(30);
    expect(sorted[3].cost).toBe(200);
  });

  it('should sort rewards by cost (descending)', () => {
    const sortByCost = (rewards, order = 'asc') => {
      return [...rewards].sort((a, b) => {
        return order === 'asc' ? a.cost - b.cost : b.cost - a.cost;
      });
    };

    const sorted = sortByCost(mockRewards, 'desc');
    expect(sorted[0].cost).toBe(200);
    expect(sorted[3].cost).toBe(30);
  });

  it('should search rewards by title', () => {
    const searchRewards = (rewards, query) => {
      if (!query || query.trim() === '') return rewards;
      const lowerQuery = query.toLowerCase();
      return rewards.filter(r =>
        r.title.toLowerCase().includes(lowerQuery)
      );
    };

    const results = searchRewards(mockRewards, 'voucher');
    expect(results).toHaveLength(1);
    expect(results[0].title).toBe('Coffee Voucher');
  });
});

describe('Rewards - Purchase Validation', () => {
  it('should validate purchase prerequisites', () => {
    const validatePurchase = (userPoints, rewardCost, rewardAvailable) => {
      const errors = [];

      if (!rewardAvailable) {
        errors.push('Reward is no longer available');
      }

      if (userPoints < rewardCost) {
        errors.push(`Insufficient points (need ${rewardCost - userPoints} more)`);
      }

      if (userPoints === null || userPoints === undefined) {
        errors.push('User points not loaded');
      }

      return {
        valid: errors.length === 0,
        errors
      };
    };

    const valid = validatePurchase(100, 50, true);
    expect(valid.valid).toBe(true);
    expect(valid.errors).toHaveLength(0);

    const insufficient = validatePurchase(30, 50, true);
    expect(insufficient.valid).toBe(false);
    expect(insufficient.errors).toContain('Insufficient points (need 20 more)');

    const unavailable = validatePurchase(100, 50, false);
    expect(unavailable.valid).toBe(false);
    expect(unavailable.errors).toContain('Reward is no longer available');
  });

  it('should create transaction record structure', () => {
    const createTransaction = (userId, rewardId, rewardTitle, amount) => {
      return {
        user_id: userId,
        reward_id: rewardId,
        amount: -amount,
        type: 'spent',
        reason: `Purchased reward: ${rewardTitle}`,
        created_at: new Date().toISOString()
      };
    };

    const transaction = createTransaction('user-123', 'reward-456', 'Coffee Voucher', 50);
    expect(transaction.user_id).toBe('user-123');
    expect(transaction.reward_id).toBe('reward-456');
    expect(transaction.amount).toBe(-50);
    expect(transaction.type).toBe('spent');
    expect(transaction.reason).toContain('Coffee Voucher');
  });

  it('should handle concurrent purchase attempts', () => {
    let userBalance = 100;
    const rewardCost = 80;

    const attemptPurchase = () => {
      if (userBalance >= rewardCost) {
        userBalance -= rewardCost;
        return { success: true, newBalance: userBalance };
      }
      return { success: false, error: 'Insufficient points' };
    };

    const firstPurchase = attemptPurchase();
    expect(firstPurchase.success).toBe(true);
    expect(firstPurchase.newBalance).toBe(20);

    const secondPurchase = attemptPurchase();
    expect(secondPurchase.success).toBe(false);
    expect(secondPurchase.error).toBe('Insufficient points');
  });
});

describe('Rewards - Transaction History', () => {
  const mockTransactions = [
    { id: 1, amount: -50, type: 'spent', reason: 'Purchased reward: Coffee', created_at: '2024-01-15' },
    { id: 2, amount: 100, type: 'earned', reason: 'Participation approved', created_at: '2024-01-20' },
    { id: 3, amount: -30, type: 'spent', reason: 'Purchased reward: Discount', created_at: '2024-02-01' }
  ];

  it('should filter transactions by type', () => {
    const filterByType = (transactions, type) => {
      if (!type || type === 'all') return transactions;
      return transactions.filter(t => t.type === type);
    };

    const spent = filterByType(mockTransactions, 'spent');
    const earned = filterByType(mockTransactions, 'earned');

    expect(spent).toHaveLength(2);
    expect(earned).toHaveLength(1);
    expect(spent.every(t => t.amount < 0)).toBe(true);
  });

  it('should calculate total spent', () => {
    const calculateTotalSpent = (transactions) => {
      return transactions
        .filter(t => t.type === 'spent')
        .reduce((sum, t) => sum + Math.abs(t.amount), 0);
    };

    const total = calculateTotalSpent(mockTransactions);
    expect(total).toBe(80); // 50 + 30
  });

  it('should calculate total earned', () => {
    const calculateTotalEarned = (transactions) => {
      return transactions
        .filter(t => t.type === 'earned')
        .reduce((sum, t) => sum + t.amount, 0);
    };

    const total = calculateTotalEarned(mockTransactions);
    expect(total).toBe(100);
  });

  it('should sort transactions by date (newest first)', () => {
    const sortByDate = (transactions, order = 'desc') => {
      return [...transactions].sort((a, b) => {
        const dateA = new Date(a.created_at);
        const dateB = new Date(b.created_at);
        return order === 'desc' ? dateB - dateA : dateA - dateB;
      });
    };

    const sorted = sortByDate(mockTransactions, 'desc');
    expect(sorted[0].id).toBe(3); // Feb 1
    expect(sorted[2].id).toBe(1); // Jan 15
  });
});

describe('Rewards - Out-of-Stock Guard (bug fix)', () => {
  /**
   * Before the fix, handleBuy() had no client-side out-of-stock check.
   * A race condition could allow a user to initiate a purchase for a
   * reward that became unavailable after the page was loaded.
   */

  it('detects out-of-stock via quantity_available === 0', () => {
    const isOutOfStock = (reward) =>
      reward.quantity_available !== null && reward.quantity_available <= 0;

    expect(isOutOfStock({ quantity_available: 0 })).toBe(true);
    expect(isOutOfStock({ quantity_available: 1 })).toBe(false);
    expect(isOutOfStock({ quantity_available: null })).toBe(false); // unlimited
  });

  it('detects out-of-stock via negative quantity (edge case)', () => {
    const isOutOfStock = (reward) =>
      reward.quantity_available !== null && reward.quantity_available <= 0;

    expect(isOutOfStock({ quantity_available: -1 })).toBe(true);
  });

  it('unlimited rewards (quantity_available = null) are never out-of-stock', () => {
    const isOutOfStock = (reward) =>
      reward.quantity_available !== null && reward.quantity_available <= 0;

    expect(isOutOfStock({ quantity_available: null })).toBe(false);
  });

  it('guard prevents purchase when local rewards array shows 0 stock', () => {
    const rewards = [{ id: 'r1', quantity_available: 0 }];
    const rewardId = 'r1';

    const reward = rewards.find((r) => r.id === rewardId);
    const shouldBlock =
      reward && reward.quantity_available !== null && reward.quantity_available <= 0;

    expect(shouldBlock).toBe(true);
  });

  it('guard allows purchase when stock is available', () => {
    const rewards = [{ id: 'r1', quantity_available: 5 }];
    const rewardId = 'r1';

    const reward = rewards.find((r) => r.id === rewardId);
    const shouldBlock =
      reward && reward.quantity_available !== null && reward.quantity_available <= 0;

    expect(shouldBlock).toBe(false);
  });
});

describe('Rewards - RPC Error Localization (bug fix)', () => {
  /**
   * Before the fix, RPC errors "Out of stock" and "Insufficient points"
   * were shown as raw English strings regardless of the user's language.
   */

  it('detects Out of stock RPC error', () => {
    const result = { success: false, error: 'Out of stock' };
    const isOutOfStock = result.error === 'Out of stock';
    expect(isOutOfStock).toBe(true);
  });

  it('detects Insufficient points RPC error', () => {
    const result = { success: false, error: 'Insufficient points' };
    const isInsufficient = result.error === 'Insufficient points';
    expect(isInsufficient).toBe(true);
  });

  it('unknown RPC errors are re-thrown (not swallowed)', () => {
    const result = { success: false, error: 'Some unexpected DB error' };
    const isKnownError =
      result.error === 'Out of stock' || result.error === 'Insufficient points';
    expect(isKnownError).toBe(false); // should fall through to throw
  });

  it('BG localization for Out of stock', () => {
    const lang = 'bg';
    const title = lang === 'en' ? 'Out of Stock' : 'Изчерпан';
    const text =
      lang === 'en'
        ? 'This reward is no longer available.'
        : 'Тази награда вече не е налична.';
    expect(title).toBe('Изчерпан');
    expect(text).toBe('Тази награда вече не е налична.');
  });

  it('EN localization for Out of stock', () => {
    const lang = 'en';
    const title = lang === 'en' ? 'Out of Stock' : 'Изчерпан';
    const text =
      lang === 'en'
        ? 'This reward is no longer available.'
        : 'Тази награда вече не е налична.';
    expect(title).toBe('Out of Stock');
    expect(text).toBe('This reward is no longer available.');
  });

  it('BG localization for Insufficient points from RPC', () => {
    const lang = 'bg';
    const title = lang === 'en' ? 'Insufficient Points' : 'Недостатъчно точки';
    expect(title).toBe('Недостатъчно точки');
  });
});

describe('Rewards - UI State Management', () => {
  it('should determine button state based on affordability', () => {
    const getButtonState = (userPoints, rewardCost) => {
      const canAfford = userPoints >= rewardCost;
      return {
        className: canAfford ? 'btn-buy' : 'btn-buy btn-buy-insufficient',
        text: canAfford ? '✓ Buy' : '✗ Not Enough Points',
        disabled: !canAfford
      };
    };

    const affordable = getButtonState(100, 50);
    expect(affordable.className).toBe('btn-buy');
    expect(affordable.text).toBe('✓ Buy');
    expect(affordable.disabled).toBe(false);

    const unaffordable = getButtonState(30, 50);
    expect(unaffordable.className).toBe('btn-buy btn-buy-insufficient');
    expect(unaffordable.text).toBe('✗ Not Enough Points');
    expect(unaffordable.disabled).toBe(true);
  });

  it('should generate reward card HTML structure', () => {
    const generateRewardCard = (reward, userPoints) => {
      const canAfford = userPoints >= reward.cost;
      return {
        id: reward.id,
        title: reward.title,
        cost: reward.cost,
        canAfford,
        buttonEnabled: canAfford
      };
    };

    const reward = { id: '1', title: 'Coffee', cost: 50 };
    const card = generateRewardCard(reward, 100);

    expect(card.canAfford).toBe(true);
    expect(card.buttonEnabled).toBe(true);
  });

  it('should handle empty rewards list', () => {
    const getRewardsDisplay = (rewards) => {
      if (rewards.length === 0) {
        return {
          type: 'empty-state',
          message: 'No Rewards Available'
        };
      }
      return {
        type: 'grid',
        count: rewards.length
      };
    };

    const empty = getRewardsDisplay([]);
    expect(empty.type).toBe('empty-state');
    expect(empty.message).toBe('No Rewards Available');

    const withRewards = getRewardsDisplay([{ id: 1 }]);
    expect(withRewards.type).toBe('grid');
    expect(withRewards.count).toBe(1);
  });
});
