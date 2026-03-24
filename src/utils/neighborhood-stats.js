/**
 * Neighborhood statistics utilities
 */

import { NEIGHBORHOODS } from "./constants.js";
export { NEIGHBORHOODS };

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
