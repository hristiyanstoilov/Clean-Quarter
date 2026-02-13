/**
 * Campaign filtering utilities
 */

export const NEIGHBORHOODS = [
  "Studentski Grad",
  "Darvenitsa",
  "Musagenitsa",
  "Kv. Vitosha (VEC)",
  "Malinova Dolina",
];

export const STATUSES = ["active", "completed", "cancelled"];

export function filterCampaigns(campaigns, filters = {}) {
  let filtered = [...campaigns];

  if (filters.neighborhood) {
    filtered = filtered.filter((c) => c.neighborhood === filters.neighborhood);
  }

  if (filters.status) {
    filtered = filtered.filter((c) => c.status === filters.status);
  }

  if (filters.searchTerm) {
    const term = filters.searchTerm.toLowerCase();
    filtered = filtered.filter(
      (c) => c.title.toLowerCase().includes(term) || c.description?.toLowerCase().includes(term)
    );
  }

  return filtered;
}

export function sortCampaigns(campaigns, sortBy = "created_at", order = "desc") {
  const sorted = [...campaigns];

  sorted.sort((a, b) => {
    const aVal = a[sortBy];
    const bVal = b[sortBy];

    if (order === "asc") {
      return aVal > bVal ? 1 : -1;
    }
    return aVal < bVal ? 1 : -1;
  });

  return sorted;
}
