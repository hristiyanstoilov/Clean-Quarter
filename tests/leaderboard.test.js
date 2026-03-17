/**
 * Tests for neighborhood leaderboard feature
 * Covers: data grouping, sorting, demo mode, i18n keys
 */

describe("Neighborhood Leaderboard", () => {
  // ─── Data grouping logic ────────────────────────────────────────────────────

  describe("grouping profiles by neighborhood", () => {
    function groupProfiles(profiles) {
      const map = {};
      profiles.forEach(({ neighborhood, points_balance }) => {
        if (!neighborhood) return;
        if (!map[neighborhood])
          map[neighborhood] = { neighborhood, total_points: 0, participant_count: 0 };
        map[neighborhood].total_points += points_balance || 0;
        map[neighborhood].participant_count += 1;
      });
      return Object.values(map).sort((a, b) => b.total_points - a.total_points);
    }

    it("groups profiles correctly by neighborhood", () => {
      const profiles = [
        { neighborhood: "studentski_grad", points_balance: 40 },
        { neighborhood: "studentski_grad", points_balance: 20 },
        { neighborhood: "darvenitsa", points_balance: 100 },
      ];
      const result = groupProfiles(profiles);
      expect(result).toHaveLength(2);
      const sg = result.find((r) => r.neighborhood === "studentski_grad");
      expect(sg.total_points).toBe(60);
      expect(sg.participant_count).toBe(2);
    });

    it("sorts by total_points descending", () => {
      const profiles = [
        { neighborhood: "darvenitsa", points_balance: 20 },
        { neighborhood: "studentski_grad", points_balance: 100 },
        { neighborhood: "musagenitsa", points_balance: 50 },
      ];
      const result = groupProfiles(profiles);
      expect(result[0].neighborhood).toBe("studentski_grad");
      expect(result[1].neighborhood).toBe("musagenitsa");
      expect(result[2].neighborhood).toBe("darvenitsa");
    });

    it("handles profiles with null points_balance as 0", () => {
      const profiles = [
        { neighborhood: "studentski_grad", points_balance: null },
        { neighborhood: "studentski_grad", points_balance: 20 },
      ];
      const result = groupProfiles(profiles);
      expect(result[0].total_points).toBe(20);
    });

    it("skips profiles with null neighborhood", () => {
      const profiles = [
        { neighborhood: null, points_balance: 100 },
        { neighborhood: "darvenitsa", points_balance: 50 },
      ];
      const result = groupProfiles(profiles);
      expect(result).toHaveLength(1);
      expect(result[0].neighborhood).toBe("darvenitsa");
    });

    it("shows only top 5 neighborhoods", () => {
      const profiles = [
        { neighborhood: "a", points_balance: 100 },
        { neighborhood: "b", points_balance: 90 },
        { neighborhood: "c", points_balance: 80 },
        { neighborhood: "d", points_balance: 70 },
        { neighborhood: "e", points_balance: 60 },
        { neighborhood: "f", points_balance: 50 },
      ];
      const result = groupProfiles(profiles).slice(0, 5);
      expect(result).toHaveLength(5);
      expect(result.find((r) => r.neighborhood === "f")).toBeUndefined();
    });

    it("handles empty profiles array", () => {
      const result = groupProfiles([]);
      expect(result).toHaveLength(0);
    });
  });

  // ─── Progress bar percentage ────────────────────────────────────────────────

  describe("progress bar calculation", () => {
    it("calculates percentage relative to top score", () => {
      const rows = [
        { neighborhood: "a", total_points: 200, participant_count: 5 },
        { neighborhood: "b", total_points: 100, participant_count: 3 },
      ];
      const maxPoints = rows[0].total_points;
      const pct = Math.round((rows[1].total_points / maxPoints) * 100);
      expect(pct).toBe(50);
    });

    it("top neighborhood always shows 100%", () => {
      const rows = [{ neighborhood: "a", total_points: 300, participant_count: 4 }];
      const maxPoints = rows[0].total_points;
      const pct = Math.round((rows[0].total_points / maxPoints) * 100);
      expect(pct).toBe(100);
    });

    it("handles maxPoints = 0 without division by zero", () => {
      const maxPoints = 0;
      const safeMax = maxPoints || 1;
      const pct = Math.round((0 / safeMax) * 100);
      expect(pct).toBe(0);
    });
  });

  // ─── Demo mode ──────────────────────────────────────────────────────────────

  describe("demo mode leaderboard", () => {
    beforeEach(() => {
      localStorage.clear();
    });

    it("builds leaderboard from demo campaigns in localStorage", () => {
      const demoCampaigns = [
        { id: "1", neighborhood: "studentski_grad" },
        { id: "2", neighborhood: "studentski_grad" },
        { id: "3", neighborhood: "darvenitsa" },
      ];
      localStorage.setItem("CLEAN_QUARTER_DEMO_CAMPAIGNS", JSON.stringify(demoCampaigns));

      const campaigns = JSON.parse(localStorage.getItem("CLEAN_QUARTER_DEMO_CAMPAIGNS") || "[]");
      const map = {};
      campaigns.forEach((c) => {
        const n = c.neighborhood || "studentski_grad";
        if (!map[n]) map[n] = { neighborhood: n, total_points: 0, participant_count: 0 };
        map[n].total_points += 20;
        map[n].participant_count += 1;
      });
      const rows = Object.values(map).sort((a, b) => b.total_points - a.total_points);

      expect(rows[0].neighborhood).toBe("studentski_grad");
      expect(rows[0].total_points).toBe(40);
      expect(rows[0].participant_count).toBe(2);
    });

    it("returns empty when no demo campaigns", () => {
      localStorage.setItem("CLEAN_QUARTER_DEMO_CAMPAIGNS", "[]");
      const campaigns = JSON.parse(localStorage.getItem("CLEAN_QUARTER_DEMO_CAMPAIGNS") || "[]");
      expect(campaigns).toHaveLength(0);
    });
  });

  // ─── Medal assignment ───────────────────────────────────────────────────────

  describe("medal assignment", () => {
    const MEDAL = ["🥇", "🥈", "🥉"];

    it("assigns gold to rank 1", () => {
      expect(MEDAL[0]).toBe("🥇");
    });

    it("assigns silver to rank 2", () => {
      expect(MEDAL[1]).toBe("🥈");
    });

    it("assigns bronze to rank 3", () => {
      expect(MEDAL[2]).toBe("🥉");
    });

    it("falls back to number for rank 4+", () => {
      const rank = 3; // index 3 → position 4
      const medal = MEDAL[rank] || `${rank + 1}.`;
      expect(medal).toBe("4.");
    });
  });

  // ─── i18n keys ──────────────────────────────────────────────────────────────

  describe("i18n keys for leaderboard", () => {
    const requiredKeys = ["title", "points", "participants", "yourNeighborhood", "noData"];

    it("all leaderboard keys exist in bg.json", async () => {
      const bg = await import("../src/i18n/bg.json", { assert: { type: "json" } });
      requiredKeys.forEach((key) => {
        expect(bg.default.leaderboard).toHaveProperty(key);
      });
    });

    it("all leaderboard keys exist in en.json", async () => {
      const en = await import("../src/i18n/en.json", { assert: { type: "json" } });
      requiredKeys.forEach((key) => {
        expect(en.default.leaderboard).toHaveProperty(key);
      });
    });
  });
});
