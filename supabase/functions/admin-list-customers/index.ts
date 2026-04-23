import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }
  try {
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      return new Response(JSON.stringify({ error: "Missing authorization" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const anonKey = Deno.env.get("SUPABASE_PUBLISHABLE_KEY") ??
      Deno.env.get("SUPABASE_ANON_KEY")!;

    const userClient = createClient(supabaseUrl, anonKey, {
      global: { headers: { Authorization: authHeader } },
    });
    const { data: userData, error: userErr } = await userClient.auth.getUser();
    if (userErr || !userData.user) {
      return new Response(JSON.stringify({ error: "Invalid session" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }
    const admin = createClient(supabaseUrl, serviceKey);
    const { data: sa } = await admin
      .from("super_admins")
      .select("id")
      .eq("user_id", userData.user.id)
      .maybeSingle();
    if (!sa) {
      return new Response(JSON.stringify({ error: "Forbidden" }), {
        status: 403,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const { data: subs, error } = await admin
      .from("customer_subscriptions")
      .select("user_id, expires_at, notes, created_at, updated_at")
      .order("created_at", { ascending: false });
    if (error) {
      return new Response(JSON.stringify({ error: error.message }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Hydrate with email + full_name from auth.users via profiles
    const ids = (subs ?? []).map((s) => s.user_id);
    const { data: profiles } = await admin
      .from("profiles")
      .select("user_id, email, full_name")
      .in("user_id", ids.length ? ids : ["00000000-0000-0000-0000-000000000000"]);

    const profileMap = new Map(
      (profiles ?? []).map((p) => [p.user_id, p]),
    );

    // Hydrate phone from auth.users user_metadata
    const phoneMap = new Map<string, string | null>();
    await Promise.all(
      ids.map(async (uid) => {
        const { data } = await admin.auth.admin.getUserById(uid);
        const meta = (data?.user?.user_metadata ?? {}) as Record<string, unknown>;
        const phone = (meta.phone as string | undefined) ?? data?.user?.phone ?? null;
        phoneMap.set(uid, phone ?? null);
      }),
    );

    // Pull org info per user (first owned org)
    const orgMap = new Map<string, { id: string; name: string } | null>();
    if (ids.length) {
      const { data: members } = await admin
        .from("organization_members")
        .select("user_id, organization_id, role, created_at, organizations(name)")
        .in("user_id", ids)
        .eq("role", "owner")
        .order("created_at", { ascending: true });
      (members ?? []).forEach((m: { user_id: string; organization_id: string; organizations: { name: string } | null }) => {
        if (!orgMap.has(m.user_id)) {
          orgMap.set(m.user_id, {
            id: m.organization_id,
            name: m.organizations?.name ?? "—",
          });
        }
      });
    }

    const customers = (subs ?? []).map((s) => ({
      ...s,
      email: profileMap.get(s.user_id)?.email ?? null,
      full_name: profileMap.get(s.user_id)?.full_name ?? null,
      phone: phoneMap.get(s.user_id) ?? null,
      organization_id: orgMap.get(s.user_id)?.id ?? null,
      organization_name: orgMap.get(s.user_id)?.name ?? null,
    }));

    return new Response(JSON.stringify({ customers }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    return new Response(JSON.stringify({ error: String(e) }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});