import { useEffect, useState, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { useOrg } from "@/contexts/OrgContext";
import { toast } from "sonner";

/**
 * Generic hook for any org-scoped table.
 * Lists/creates/updates/deletes rows scoped to the current organization.
 */
export function useOrgTable<T extends { id: string }>(
  table:
    | "clients"
    | "products"
    | "services"
    | "receivables"
    | "payables"
    | "capital_movements",
  orderBy: { column: string; ascending?: boolean } = { column: "created_at", ascending: false },
) {
  const { user } = useAuth();
  const { currentOrgId } = useOrg();
  const [rows, setRows] = useState<T[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchAll = useCallback(async () => {
    if (!currentOrgId) {
      setRows([]);
      setLoading(false);
      return;
    }
    setLoading(true);
    const { data, error } = await supabase
      .from(table)
      .select("*")
      .eq("organization_id", currentOrgId)
      .order(orderBy.column, { ascending: orderBy.ascending ?? false });
    setLoading(false);
    if (error) {
      toast.error(error.message);
      return;
    }
    setRows((data ?? []) as T[]);
  }, [currentOrgId, table, orderBy.column, orderBy.ascending]);

  useEffect(() => {
    void fetchAll();
  }, [fetchAll]);

  const create = async (values: Record<string, any>) => {
    if (!currentOrgId || !user) return;
    const { data, error } = await supabase
      .from(table)
      .insert({ ...values, organization_id: currentOrgId, created_by: user.id })
      .select()
      .single();
    if (error) throw error;
    setRows((s) => [data as T, ...s]);
    return data as T;
  };

  const update = async (id: string, patch: Record<string, any>) => {
    const { data, error } = await supabase
      .from(table)
      .update(patch)
      .eq("id", id)
      .select()
      .single();
    if (error) throw error;
    setRows((s) => s.map((r) => (r.id === id ? (data as T) : r)));
    return data as T;
  };

  const remove = async (id: string) => {
    const { error } = await supabase.from(table).delete().eq("id", id);
    if (error) throw error;
    setRows((s) => s.filter((r) => r.id !== id));
  };

  return { rows, loading, create, update, remove, refetch: fetchAll };
}