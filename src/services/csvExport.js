/**
 * Escapes a single CSV cell value.
 * Wraps in quotes if the value contains commas, quotes, or newlines.
 * @param {any} value
 * @returns {string}
 */
function escapeCell(value) {
  if (value === null || value === undefined || value === "") return "";
  const str = String(value);
  if (str.includes(",") || str.includes('"') || str.includes("\n") || str.includes("\r")) {
    return '"' + str.replace(/"/g, '""') + '"';
  }
  return str;
}

/**
 * Build a CSV string from an array of row objects and a column spec.
 * Includes UTF-8 BOM so Excel on Windows renders Cyrillic correctly.
 * @param {Object[]} rows
 * @param {{ header: string, key: string, format?: (row: Object) => string }[]} columns
 * @returns {string}
 */
export function buildCsv(rows, columns) {
  const BOM = "\uFEFF";
  const header = columns.map((c) => escapeCell(c.header)).join(",");
  const body = rows
    .map((row) =>
      columns
        .map((c) => {
          const val = c.format ? c.format(row) : row[c.key];
          return escapeCell(val ?? "");
        })
        .join(",")
    )
    .join("\r\n");
  return BOM + header + "\r\n" + body;
}

/**
 * Trigger a browser file download for the given CSV string.
 * @param {string} filename
 * @param {string} csvString
 */
export function downloadCsv(filename, csvString) {
  const blob = new Blob([csvString], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  a.style.display = "none";
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

/**
 * Export an array of user profile objects as a CSV file.
 * @param {Object[]} users
 */
export function exportUsersCsv(users) {
  const columns = [
    { header: "Username", key: "username" },
    { header: "Email", key: "email" },
    { header: "Role", key: "role" },
    { header: "Points", key: "points_balance" },
    { header: "Neighborhood", key: "neighborhood" },
  ];
  const csv = buildCsv(users, columns);
  const date = new Date().toISOString().slice(0, 10);
  downloadCsv(`users_${date}.csv`, csv);
}

/**
 * Export an array of participation objects (with joined campaign + profile) as CSV.
 * @param {Object[]} participations
 */
export function exportParticipationsCsv(participations) {
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
  const date = new Date().toISOString().slice(0, 10);
  downloadCsv(`participations_${date}.csv`, csv);
}
