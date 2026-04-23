import { supabase } from "@/integrations/supabase/client";

export type ActivityAction = "created" | "updated" | "deleted" | "invited" | "joined" | "removed" | "role_changed" | "password_changed";

export async function logActivity(params: {
  orgId: string;
  userId: string;
  action: ActivityAction;
  entityType: string;
  entityId?: string | null;
  summary: string;
  metadata?: Record<string, any>;
}) {
  try {
    await supabase.from("activity_logs").insert({
      organization_id: params.orgId,
      user_id: params.userId,
      action: params.action,
      entity_type: params.entityType,
      entity_id: params.entityId ?? null,
      summary: params.summary,
      metadata: params.metadata ?? null,
    });
  } catch {
    // Don't break the UI if logging fails
  }
}
