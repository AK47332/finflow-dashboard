import { createContext, useCallback, useContext, useEffect, useState, ReactNode } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "./AuthContext";

export type Organization = {
  id: string;
  name: string;
  slug: string | null;
  currency: string;
  logo_url: string | null;
  created_by: string;
};

export type OrgRole = "owner" | "admin" | "member";

type OrgContextValue = {
  orgs: Organization[];
  currentOrg: Organization | null;
  currentOrgId: string | null;
  role: OrgRole | null;
  loading: boolean;
  switchOrg: (orgId: string) => Promise<void>;
  refresh: () => Promise<void>;
};

const OrgContext = createContext<OrgContextValue | undefined>(undefined);

export function OrgProvider({ children }: { children: ReactNode }) {
  const { user, loading: authLoading } = useAuth();
  const [orgs, setOrgs] = useState<Organization[]>([]);
  const [currentOrgId, setCurrentOrgId] = useState<string | null>(null);
  const [role, setRole] = useState<OrgRole | null>(null);
  const [loading, setLoading] = useState(true);

  const refresh = useCallback(async () => {
    if (!user) {
      setOrgs([]);
      setCurrentOrgId(null);
      setRole(null);
      setLoading(false);
      return;
    }
    setLoading(true);

    // Get profile (current org id)
    const { data: profile } = await supabase
      .from("profiles")
      .select("current_org_id")
      .eq("user_id", user.id)
      .maybeSingle();

    // Get memberships with org details
    const { data: memberships } = await supabase
      .from("organization_members")
      .select("role, organization:organizations(*)")
      .eq("user_id", user.id);

    const orgList: Organization[] =
      (memberships ?? [])
        .map((m: any) => m.organization)
        .filter(Boolean) as Organization[];

    setOrgs(orgList);

    let activeId = profile?.current_org_id ?? null;
    if (activeId && !orgList.find((o) => o.id === activeId)) activeId = null;
    if (!activeId && orgList.length > 0) {
      activeId = orgList[0].id;
      // persist default
      await supabase.from("profiles").update({ current_org_id: activeId }).eq("user_id", user.id);
    }
    setCurrentOrgId(activeId);

    if (activeId) {
      const m = (memberships ?? []).find((mm: any) => mm.organization?.id === activeId);
      setRole((m?.role as OrgRole) ?? null);
    } else {
      setRole(null);
    }

    setLoading(false);
  }, [user]);

  useEffect(() => {
    if (!authLoading) void refresh();
  }, [authLoading, refresh]);

  const switchOrg = async (orgId: string) => {
    if (!user) return;
    await supabase.from("profiles").update({ current_org_id: orgId }).eq("user_id", user.id);
    setCurrentOrgId(orgId);
    const found = orgs.find((o) => o.id === orgId);
    if (found) {
      const { data: m } = await supabase
        .from("organization_members")
        .select("role")
        .eq("organization_id", orgId)
        .eq("user_id", user.id)
        .maybeSingle();
      setRole((m?.role as OrgRole) ?? null);
    }
  };

  const currentOrg = orgs.find((o) => o.id === currentOrgId) ?? null;

  return (
    <OrgContext.Provider
      value={{ orgs, currentOrg, currentOrgId, role, loading, switchOrg, refresh }}
    >
      {children}
    </OrgContext.Provider>
  );
}

export function useOrg() {
  const ctx = useContext(OrgContext);
  if (!ctx) throw new Error("useOrg must be used within OrgProvider");
  return ctx;
}