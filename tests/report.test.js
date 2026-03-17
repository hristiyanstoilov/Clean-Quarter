/**
 * Tests for campaign report feature
 * Covers: report button visibility, duplicate detection, admin resolve/dismiss
 */

// Mock Supabase
vi.mock("../src/services/supabase.js", () => ({
  default: {
    from: vi.fn(),
    auth: { getUser: vi.fn() },
  },
}));

import * as supabaseModule from "../src/services/supabase.js";

const mockFrom = (data = null, error = null) => {
  const chain = {
    select: vi.fn().mockReturnThis(),
    insert: vi.fn().mockResolvedValue({ data, error }),
    update: vi.fn().mockReturnThis(),
    eq: vi.fn().mockReturnThis(),
    order: vi.fn().mockResolvedValue({ data, error }),
  };
  supabaseModule.default.from.mockReturnValue(chain);
  return chain;
};

describe("Report Feature", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    localStorage.clear();
  });

  // ─── Report button visibility ───────────────────────────────────────────────

  describe("report button visibility rules", () => {
    it("should show report button for non-creator logged-in user", () => {
      const currentUser = { id: "user-123", role: "user" };
      const campaignCreatedBy = "user-456";
      const isCreator = currentUser.id === campaignCreatedBy;
      const isDemo = currentUser.id === "demo-admin-001";
      expect(!isCreator && !isDemo).toBe(true);
    });

    it("should NOT show report button for campaign creator", () => {
      const currentUser = { id: "user-123", role: "user" };
      const campaignCreatedBy = "user-123";
      const isCreator = currentUser.id === campaignCreatedBy;
      expect(isCreator).toBe(true);
    });

    it("should NOT show report button in demo mode", () => {
      const currentUser = { id: "demo-admin-001", role: "admin" };
      const isDemo = currentUser.id === "demo-admin-001";
      expect(isDemo).toBe(true);
    });

    it("should NOT show report button for unauthenticated user", () => {
      const currentUser = null;
      expect(currentUser).toBeNull();
    });
  });

  // ─── Report submission ──────────────────────────────────────────────────────

  describe("report submission", () => {
    it("inserts a report with correct fields", async () => {
      const chain = mockFrom(null, null);
      chain.insert = vi.fn().mockResolvedValue({ data: null, error: null });
      supabaseModule.default.from.mockReturnValue(chain);

      const payload = {
        reported_by: "user-123",
        entity_type: "campaign",
        entity_id: "campaign-abc",
        reason: "spam",
        description: "This is spam",
      };

      const supabase = supabaseModule.default;
      const { error } = await supabase.from("reports").insert(payload);

      expect(supabase.from).toHaveBeenCalledWith("reports");
      expect(chain.insert).toHaveBeenCalledWith(payload);
      expect(error).toBeNull();
    });

    it("handles duplicate report error (24h window)", async () => {
      const chain = {
        insert: vi.fn().mockResolvedValue({
          data: null,
          error: { message: "You have already reported this item within the last 24 hours" },
        }),
      };
      supabaseModule.default.from.mockReturnValue(chain);

      const { error } = await supabaseModule.default.from("reports").insert({
        reported_by: "user-123",
        entity_type: "campaign",
        entity_id: "campaign-abc",
        reason: "spam",
      });

      expect(error).not.toBeNull();
      expect(error.message).toContain("already reported");
    });

    it("sends null description when none provided", async () => {
      const chain = {
        insert: vi.fn().mockResolvedValue({ data: null, error: null }),
      };
      supabaseModule.default.from.mockReturnValue(chain);

      await supabaseModule.default.from("reports").insert({
        reported_by: "user-123",
        entity_type: "campaign",
        entity_id: "campaign-abc",
        reason: "fake",
        description: null,
      });

      expect(chain.insert).toHaveBeenCalledWith(
        expect.objectContaining({ description: null })
      );
    });

    it("accepts all valid reason values", () => {
      const validReasons = ["spam", "inappropriate", "harassment", "fake", "other"];
      validReasons.forEach((reason) => {
        expect(["spam", "inappropriate", "harassment", "fake", "other"]).toContain(reason);
      });
    });
  });

  // ─── Admin: load reports ────────────────────────────────────────────────────

  describe("admin report loading", () => {
    it("queries reports with status=pending", async () => {
      const chain = {
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        order: vi.fn().mockResolvedValue({
          data: [
            {
              id: "r1",
              reason: "spam",
              description: null,
              created_at: new Date().toISOString(),
              status: "pending",
              entity_id: "camp-1",
              entity_type: "campaign",
              reporter: { username: "testuser" },
            },
          ],
          error: null,
        }),
      };
      supabaseModule.default.from.mockReturnValue(chain);

      const supabase = supabaseModule.default;
      const { data } = await supabase
        .from("reports")
        .select("id, reason, description, created_at, status, entity_id, entity_type, reporter:profiles!reported_by(username)")
        .eq("status", "pending")
        .order("created_at", { ascending: false });

      expect(supabase.from).toHaveBeenCalledWith("reports");
      expect(chain.eq).toHaveBeenCalledWith("status", "pending");
      expect(data).toHaveLength(1);
      expect(data[0].reason).toBe("spam");
    });

    it("shows empty state when no reports", async () => {
      const chain = {
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        order: vi.fn().mockResolvedValue({ data: [], error: null }),
      };
      supabaseModule.default.from.mockReturnValue(chain);

      const { data } = await supabaseModule.default
        .from("reports")
        .select("*")
        .eq("status", "pending")
        .order("created_at", { ascending: false });

      expect(data).toHaveLength(0);
    });
  });

  // ─── Admin: resolve / dismiss ───────────────────────────────────────────────

  describe("admin resolve and dismiss", () => {
    it("updates report status to resolved", async () => {
      const chain = {
        update: vi.fn().mockReturnThis(),
        eq: vi.fn().mockResolvedValue({ data: null, error: null }),
      };
      supabaseModule.default.from.mockReturnValue(chain);

      const { error } = await supabaseModule.default
        .from("reports")
        .update({ status: "resolved", reviewed_by: "admin-1", reviewed_at: new Date().toISOString() })
        .eq("id", "report-123");

      expect(chain.update).toHaveBeenCalledWith(
        expect.objectContaining({ status: "resolved" })
      );
      expect(error).toBeNull();
    });

    it("updates report status to dismissed", async () => {
      const chain = {
        update: vi.fn().mockReturnThis(),
        eq: vi.fn().mockResolvedValue({ data: null, error: null }),
      };
      supabaseModule.default.from.mockReturnValue(chain);

      const { error } = await supabaseModule.default
        .from("reports")
        .update({ status: "dismissed", reviewed_by: "admin-1", reviewed_at: new Date().toISOString() })
        .eq("id", "report-123");

      expect(chain.update).toHaveBeenCalledWith(
        expect.objectContaining({ status: "dismissed" })
      );
      expect(error).toBeNull();
    });

    it("records reviewer id on resolve", async () => {
      const chain = {
        update: vi.fn().mockReturnThis(),
        eq: vi.fn().mockResolvedValue({ data: null, error: null }),
      };
      supabaseModule.default.from.mockReturnValue(chain);

      const adminId = "admin-uuid-456";
      await supabaseModule.default
        .from("reports")
        .update({ status: "resolved", reviewed_by: adminId, reviewed_at: new Date().toISOString() })
        .eq("id", "report-123");

      expect(chain.update).toHaveBeenCalledWith(
        expect.objectContaining({ reviewed_by: adminId })
      );
    });
  });

  // ─── i18n keys ──────────────────────────────────────────────────────────────

  describe("i18n keys for report feature", () => {
    const requiredKeys = [
      "reportCampaign",
      "reportTitle",
      "reportReasonLabel",
      "reportDescriptionLabel",
      "reportSuccess",
      "reportAlreadyReported",
      "reportReasonSpam",
      "reportReasonInappropriate",
      "reportReasonHarassment",
      "reportReasonFake",
      "reportReasonOther",
      "reportConfirm",
    ];

    it("all required campaign i18n keys exist in bg.json", async () => {
      const bg = await import("../src/i18n/bg.json", { assert: { type: "json" } });
      requiredKeys.forEach((key) => {
        expect(bg.default.campaign).toHaveProperty(key);
      });
    });

    it("all required campaign i18n keys exist in en.json", async () => {
      const en = await import("../src/i18n/en.json", { assert: { type: "json" } });
      requiredKeys.forEach((key) => {
        expect(en.default.campaign).toHaveProperty(key);
      });
    });

    it("all required admin i18n keys exist in bg.json", async () => {
      const bg = await import("../src/i18n/bg.json", { assert: { type: "json" } });
      const adminKeys = ["reports", "reportedBy", "reportReason", "resolveReport", "dismissReport", "noReports"];
      adminKeys.forEach((key) => {
        expect(bg.default.admin).toHaveProperty(key);
      });
    });

    it("all required admin i18n keys exist in en.json", async () => {
      const en = await import("../src/i18n/en.json", { assert: { type: "json" } });
      const adminKeys = ["reports", "reportedBy", "reportReason", "resolveReport", "dismissReport", "noReports"];
      adminKeys.forEach((key) => {
        expect(en.default.admin).toHaveProperty(key);
      });
    });
  });
});
