/**
 * Participation approval workflow
 */

export const APPROVAL_STATUSES = {
  PENDING: "pending",
  APPROVED: "approved",
  REJECTED: "rejected",
};

export function validateParticipationForApproval(participation) {
  const errors = [];

  if (!participation.after_photo_url) {
    errors.push("After photo is required");
  }

  if (!participation.campaign_id) {
    errors.push("Campaign ID is missing");
  }

  if (!participation.user_id) {
    errors.push("User ID is missing");
  }

  return {
    valid: errors.length === 0,
    errors,
  };
}

export async function approveParticipation(participationId, adminUserId, supabase) {
  // Update participation status
  const { data, error } = await supabase
    .from("participations")
    .update({
      status: APPROVAL_STATUSES.APPROVED,
      approved_by: adminUserId,
      approved_at: new Date().toISOString(),
    })
    .eq("id", participationId)
    .select()
    .single();

  if (error) throw error;

  // Award points (handled by DB trigger in production)
  return data;
}

export async function rejectParticipation(participationId, reason, adminUserId, supabase) {
  const { data, error } = await supabase
    .from("participations")
    .update({
      status: APPROVAL_STATUSES.REJECTED,
      rejection_reason: reason,
      reviewed_by: adminUserId,
      reviewed_at: new Date().toISOString(),
    })
    .eq("id", participationId)
    .select()
    .single();

  if (error) throw error;
  return data;
}
