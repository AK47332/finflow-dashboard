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
    const customers = (subs ?? []).map((s) => ({
      ...s,
      email: profileMap.get(s.user_id)?.email ?? null,
      full_name: profileMap.get(s.user_id)?.full_name ?? null,
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