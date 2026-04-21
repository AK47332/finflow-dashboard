import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";
import { z } from "https://esm.sh/zod@3.23.8";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

const BodySchema = z.object({
  user_id: z.string().uuid(),
  expires_at: z.string().datetime().optional(),
  add_days: z.number().int().min(-3650).max(3650).optional(),
}).refine((b) => b.expires_at || typeof b.add_days === "number", {
  message: "Provide expires_at or add_days",
});

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

    const parsed = BodySchema.safeParse(await req.json());
    if (!parsed.success) {
      return new Response(
        JSON.stringify({ error: parsed.error.flatten().fieldErrors }),
        {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        },
      );
    }
    const body = parsed.data;

    let newExpiresAt: string;
    if (body.expires_at) {
      newExpiresAt = body.expires_at;
    } else {
      const { data: existing } = await admin
        .from("customer_subscriptions")
        .select("expires_at")
        .eq("user_id", body.user_id)
        .maybeSingle();
      const base = existing?.expires_at && new Date(existing.expires_at) > new Date()
        ? new Date(existing.expires_at)
        : new Date();
      base.setDate(base.getDate() + (body.add_days as number));
      newExpiresAt = base.toISOString();
    }

    const { data: existing } = await admin
      .from("customer_subscriptions")
      .select("id")
      .eq("user_id", body.user_id)
      .maybeSingle();

    if (existing) {
      const { error } = await admin
        .from("customer_subscriptions")
        .update({ expires_at: newExpiresAt })
        .eq("user_id", body.user_id);
      if (error) {
        return new Response(JSON.stringify({ error: error.message }), {
          status: 500,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
    } else {
      const { error } = await admin.from("customer_subscriptions").insert({
        user_id: body.user_id,
        expires_at: newExpiresAt,
        created_by: userData.user.id,
      });
      if (error) {
        return new Response(JSON.stringify({ error: error.message }), {
          status: 500,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
    }

    return new Response(
      JSON.stringify({ user_id: body.user_id, expires_at: newExpiresAt }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } },
    );
  } catch (e) {
    return new Response(JSON.stringify({ error: String(e) }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});