// Supabase is dynamically imported to allow mocking in tests

/**
 * RSVP the current user to a campaign event.
 * @param {string} campaignId
 * @param {string} userId
 * @returns {Promise<Object>} inserted rsvp row
 */
export async function rsvpToCampaign(campaignId, userId) {
  const supabaseModule = await import("./supabase.js");
  const supabase = supabaseModule.default || supabaseModule;
  const { data, error } = await supabase
    .from("event_rsvps")
    .insert({ campaign_id: campaignId, user_id: userId })
    .select()
    .single();
  if (error) throw error;
  return data;
}

/**
 * Cancel the current user's RSVP for a campaign.
 * @param {string} campaignId
 * @param {string} userId
 */
export async function cancelRsvp(campaignId, userId) {
  const supabaseModule = await import("./supabase.js");
  const supabase = supabaseModule.default || supabaseModule;
  const { error } = await supabase
    .from("event_rsvps")
    .delete()
    .eq("campaign_id", campaignId)
    .eq("user_id", userId);
  if (error) throw error;
}

/**
 * Get the total RSVP count for a campaign.
 * @param {string} campaignId
 * @returns {Promise<number>}
 */
export async function getRsvpCount(campaignId) {
  const supabaseModule = await import("./supabase.js");
  const supabase = supabaseModule.default || supabaseModule;
  const { count, error } = await supabase
    .from("event_rsvps")
    .select("id", { count: "exact", head: true })
    .eq("campaign_id", campaignId);
  if (error) throw error;
  return count ?? 0;
}

/**
 * Get the current user's RSVP row for a campaign, or null if not RSVP'd.
 * @param {string} campaignId
 * @param {string} userId
 * @returns {Promise<Object|null>}
 */
export async function getUserRsvp(campaignId, userId) {
  const supabaseModule = await import("./supabase.js");
  const supabase = supabaseModule.default || supabaseModule;
  const { data, error } = await supabase
    .from("event_rsvps")
    .select("id")
    .eq("campaign_id", campaignId)
    .eq("user_id", userId)
    .maybeSingle();
  if (error) throw error;
  return data;
}

/**
 * Fetch RSVP counts for multiple campaigns in a single query.
 * Returns a map of { campaign_id: count }.
 * @param {string[]} campaignIds
 * @returns {Promise<Object>}
 */
export async function getRsvpCountsForCampaigns(campaignIds) {
  if (!campaignIds.length) return {};
  const supabaseModule = await import("./supabase.js");
  const supabase = supabaseModule.default || supabaseModule;
  const { data, error } = await supabase
    .from("event_rsvps")
    .select("campaign_id")
    .in("campaign_id", campaignIds);
  if (error) throw error;
  const counts = {};
  (data || []).forEach(({ campaign_id }) => {
    counts[campaign_id] = (counts[campaign_id] || 0) + 1;
  });
  return counts;
}
