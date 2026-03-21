import { buildCsv } from "../src/services/csvExport.js";

const BOM = "\uFEFF";

// ---------------------------------------------------------------------------
// buildCsv()
// ---------------------------------------------------------------------------
describe("buildCsv()", () => {
  const columns = [
    { header: "Name", key: "name" },
    { header: "Points", key: "points" },
    { header: "Role", key: "role" },
  ];

  it("includes UTF-8 BOM as the first character", () => {
    const csv = buildCsv([], columns);
    expect(csv.startsWith(BOM)).toBe(true);
  });

  it("produces correct header row", () => {
    const csv = buildCsv([], columns);
    const lines = csv.slice(BOM.length).split("\r\n");
    expect(lines[0]).toBe("Name,Points,Role");
  });

  it("produces correct data rows", () => {
    const rows = [{ name: "Alice", points: 100, role: "user" }];
    const csv = buildCsv(rows, columns);
    const lines = csv.slice(BOM.length).split("\r\n");
    expect(lines[1]).toBe("Alice,100,user");
  });

  it("uses \\r\\n line endings (Excel compatibility)", () => {
    const rows = [
      { name: "Alice", points: 100, role: "user" },
      { name: "Bob", points: 50, role: "admin" },
    ];
    const csv = buildCsv(rows, columns);
    expect(csv).toContain("\r\n");
  });

  it("wraps cell containing a comma in double quotes", () => {
    const rows = [{ name: "Smith, John", points: 0, role: "user" }];
    const csv = buildCsv(rows, columns);
    expect(csv).toContain('"Smith, John"');
  });

  it("escapes double quotes inside a cell value", () => {
    const rows = [{ name: 'He said "hello"', points: 0, role: "user" }];
    const csv = buildCsv(rows, columns);
    expect(csv).toContain('"He said ""hello"""');
  });

  it("wraps cell containing a newline in double quotes", () => {
    const rows = [{ name: "Line1\nLine2", points: 0, role: "user" }];
    const csv = buildCsv(rows, columns);
    expect(csv).toContain('"Line1\nLine2"');
  });

  it("renders null/undefined as empty string", () => {
    const rows = [{ name: null, points: undefined, role: "user" }];
    const csv = buildCsv(rows, columns);
    const lines = csv.slice(BOM.length).split("\r\n");
    expect(lines[1]).toBe(",,user");
  });

  it("supports format() function for computed columns", () => {
    const cols = [
      { header: "Full", key: "full", format: (r) => `${r.first} ${r.last}` },
    ];
    const rows = [{ first: "Ana", last: "Popova" }];
    const csv = buildCsv(rows, cols);
    expect(csv).toContain("Ana Popova");
  });

  it("produces empty body (only header) for empty rows array", () => {
    const csv = buildCsv([], columns);
    const lines = csv.slice(BOM.length).split("\r\n");
    expect(lines.length).toBe(2); // header + one empty trailing line
    expect(lines[1]).toBe("");
  });
});

// ---------------------------------------------------------------------------
// Users CSV column spec — mirrors exportUsersCsv() columns
// (downloadCsv requires DOM; tested via buildCsv with matching column spec)
// ---------------------------------------------------------------------------
describe("Users CSV column spec", () => {
  it("includes all expected headers and data", () => {
    const users = [
      { username: "ivan", email: "ivan@test.com", role: "user", points_balance: 120, neighborhood: "Darvenitsa" },
    ];
    const columns = [
      { header: "Username", key: "username" },
      { header: "Email", key: "email" },
      { header: "Role", key: "role" },
      { header: "Points", key: "points_balance" },
      { header: "Neighborhood", key: "neighborhood" },
    ];
    const csv = buildCsv(users, columns);
    expect(csv).toContain("Username,Email,Role,Points,Neighborhood");
    expect(csv).toContain("ivan,ivan@test.com,user,120,Darvenitsa");
  });
});

// ---------------------------------------------------------------------------
// Participations CSV column spec — mirrors exportParticipationsCsv() columns
// (downloadCsv requires DOM; tested via buildCsv with matching column spec)
// ---------------------------------------------------------------------------
describe("Participations CSV column spec", () => {
  it("includes all expected headers and formats nested fields", () => {
    const participations = [
      {
        profiles: { username: "maria" },
        campaigns: { title: "Park Cleanup" },
        status: "approved",
        created_at: "2026-03-15T10:00:00Z",
      },
    ];
    const columns = [
      { header: "User", key: "user", format: (r) => r.profiles?.username ?? "" },
      { header: "Campaign", key: "campaign", format: (r) => r.campaigns?.title ?? "" },
      { header: "Status", key: "status" },
      {
        header: "Submitted Date",
        key: "created_at",
        format: (r) => (r.created_at ? new Date(r.created_at).toLocaleDateString() : ""),
      },
    ];
    const csv = buildCsv(participations, columns);
    expect(csv).toContain("User,Campaign,Status,Submitted Date");
    expect(csv).toContain("maria");
    expect(csv).toContain("Park Cleanup");
    expect(csv).toContain("approved");
  });

  it("handles missing profiles or campaigns gracefully", () => {
    const participations = [
      { profiles: null, campaigns: null, status: "pending", created_at: null },
    ];
    const columns = [
      { header: "User", key: "user", format: (r) => r.profiles?.username ?? "" },
      { header: "Campaign", key: "campaign", format: (r) => r.campaigns?.title ?? "" },
      { header: "Status", key: "status" },
      { header: "Submitted Date", key: "created_at", format: (r) => (r.created_at ? new Date(r.created_at).toLocaleDateString() : "") },
    ];
    const csv = buildCsv(participations, columns);
    const lines = csv.slice(BOM.length).split("\r\n");
    // User and Campaign should be empty, Status = pending, Date = empty
    expect(lines[1]).toBe(",,pending,");
  });
});

// ---------------------------------------------------------------------------
// Export filter logic — mirrors the inline filter logic in admin.js handlers
// ---------------------------------------------------------------------------

// Helper: replicates exportUsersCsvHandler filter logic
function filterUsers(users, neighborhood) {
  return neighborhood ? users.filter((u) => u.neighborhood === neighborhood) : users;
}

// Helper: replicates exportParticipationsCsvHandler filter logic
function filterParticipations(data, { status = "", from = "", to = "" } = {}) {
  let result = data;
  if (status) result = result.filter((p) => p.status === status);
  if (from) result = result.filter((p) => p.created_at && p.created_at >= from);
  if (to) result = result.filter((p) => p.created_at && p.created_at <= to + "T23:59:59");
  return result;
}

const USERS = [
  { username: "ana", neighborhood: "Darvenitsa", role: "user", points_balance: 10 },
  { username: "ivan", neighborhood: "Studentski Grad", role: "admin", points_balance: 200 },
  { username: "maria", neighborhood: "Darvenitsa", role: "user", points_balance: 50 },
];

const PARTICIPATIONS = [
  { status: "approved", created_at: "2026-01-15T10:00:00Z", profiles: { username: "ana" }, campaigns: { title: "C1" } },
  { status: "rejected", created_at: "2026-02-20T09:00:00Z", profiles: { username: "ivan" }, campaigns: { title: "C2" } },
  { status: "pending",  created_at: "2026-03-10T14:00:00Z", profiles: { username: "maria" }, campaigns: { title: "C3" } },
  { status: "approved", created_at: "2026-03-18T08:00:00Z", profiles: { username: "ana" }, campaigns: { title: "C4" } },
];

describe("filterUsers() — neighborhood filter", () => {
  it("returns all users when neighborhood is empty string", () => {
    expect(filterUsers(USERS, "")).toHaveLength(3);
  });

  it("filters by exact neighborhood match", () => {
    const result = filterUsers(USERS, "Darvenitsa");
    expect(result).toHaveLength(2);
    expect(result.every((u) => u.neighborhood === "Darvenitsa")).toBe(true);
  });

  it("returns empty array when no users match neighborhood", () => {
    expect(filterUsers(USERS, "Musagenitsa")).toHaveLength(0);
  });

  it("does not mutate original array", () => {
    filterUsers(USERS, "Darvenitsa");
    expect(USERS).toHaveLength(3);
  });
});

describe("filterParticipations() — status + date range filter", () => {
  it("returns all when no filters set", () => {
    expect(filterParticipations(PARTICIPATIONS)).toHaveLength(4);
  });

  it("filters by status: approved", () => {
    const result = filterParticipations(PARTICIPATIONS, { status: "approved" });
    expect(result).toHaveLength(2);
    expect(result.every((p) => p.status === "approved")).toBe(true);
  });

  it("filters by status: rejected", () => {
    const result = filterParticipations(PARTICIPATIONS, { status: "rejected" });
    expect(result).toHaveLength(1);
    expect(result[0].campaigns.title).toBe("C2");
  });

  it("filters by status: pending", () => {
    const result = filterParticipations(PARTICIPATIONS, { status: "pending" });
    expect(result).toHaveLength(1);
    expect(result[0].campaigns.title).toBe("C3");
  });

  it("filters by from date (inclusive)", () => {
    const result = filterParticipations(PARTICIPATIONS, { from: "2026-03-01" });
    expect(result).toHaveLength(2); // C3 and C4
    expect(result.map((p) => p.campaigns.title)).toEqual(["C3", "C4"]);
  });

  it("filters by to date (inclusive — full last day)", () => {
    const result = filterParticipations(PARTICIPATIONS, { to: "2026-01-31" });
    expect(result).toHaveLength(1); // only C1 (Jan)
    expect(result[0].campaigns.title).toBe("C1");
  });

  it("filters by date range (from + to)", () => {
    const result = filterParticipations(PARTICIPATIONS, { from: "2026-02-01", to: "2026-02-28" });
    expect(result).toHaveLength(1); // only C2 (Feb)
    expect(result[0].campaigns.title).toBe("C2");
  });

  it("combines status + date range", () => {
    const result = filterParticipations(PARTICIPATIONS, { status: "approved", from: "2026-03-01" });
    expect(result).toHaveLength(1); // C4 only (C1 is approved but in Jan)
    expect(result[0].campaigns.title).toBe("C4");
  });

  it("returns empty array when filters match nothing", () => {
    const result = filterParticipations(PARTICIPATIONS, { status: "pending", to: "2026-01-31" });
    expect(result).toHaveLength(0);
  });

  it("excludes participation with null created_at when date filter is set", () => {
    const withNull = [...PARTICIPATIONS, { status: "approved", created_at: null, profiles: null, campaigns: null }];
    const result = filterParticipations(withNull, { from: "2026-01-01" });
    expect(result.every((p) => p.created_at !== null)).toBe(true);
  });
});
