import supabase from "./supabase.js";

/**
 * Fetch aggregated public stats via SECURITY DEFINER function (no auth required).
 * Uses RPC because views are SECURITY INVOKER and would be blocked by RLS for anon.
 * @returns {{ total_campaigns, total_volunteers, total_cleanups, total_points }}
 */
export async function getPublicStats() {
  const { data, error } = await supabase.rpc("get_public_stats");
  if (error) throw error;
  return data?.[0] ?? null;
}

/**
 * Fetch neighborhood leaderboard (top 5) via SECURITY DEFINER function.
 * @returns {{ neighborhood, total_points, participant_count }[]}
 */
export async function getNeighborhoodStats() {
  const { data, error } = await supabase.rpc("get_public_neighborhood_stats");
  if (error) throw error;
  return data || [];
}

/**
 * Fetch campaign count grouped by category via SECURITY DEFINER function.
 * @returns {{ category, campaign_count }[]}
 */
export async function getCategoryStats() {
  const { data, error } = await supabase.rpc("get_public_category_stats");
  if (error) throw error;
  return data || [];
}
