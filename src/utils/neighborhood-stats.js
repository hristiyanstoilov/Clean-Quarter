/**
 * Neighborhood statistics utilities
 */

export const NEIGHBORHOODS = [
  "Studentski Grad",
  "Darvenitsa",
  "Musagenitsa",
  "Kv. Vitosha (VEC)",
  "Malinova Dolina",
];

export function calculateNeighborhoodStats(campaigns) {
  return NEIGHBORHOODS.map((neighborhood) => {
    const neighborhoodCampaigns = campaigns.filter((c) => c.neighborhood === neighborhood);

    return {
      neighborhood,
      total: neighborhoodCampaigns.length,
      active: neighborhoodCampaigns.filter((c) => c.status === "active").length,
      completed: neighborhoodCampaigns.filter((c) => c.status === "completed").length,
    };
  });
}
