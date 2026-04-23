import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";
import { z } from "https://esm.sh/zod@3.23.8";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

const BodySchema = z.object({
  email: z.string().trim().email().max(255),
  password: z.string().min(8).max(128),
  full_name: z.string().trim().max(120).optional().nullable(),
  phone: z.string().trim().max(32).optional().nullable(),
  organization_name: z.string().trim().max(120).optional().nullable(),
  expiry_days: z.number().int().min(1).max(3650),
  notes: z.string().trim().max(1000).optional().nullable(),
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

    // Verify caller is super admin
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

    // Create user
    const { data: created, error: createErr } = await admin.auth.admin
      .createUser({
        email: body.email,
        password: body.password,
        email_confirm: true,
        user_metadata: {
          full_name: body.full_name ?? undefined,
          phone: body.phone ?? undefined,
        },
      });
    if (createErr || !created.user) {
      return new Response(
        JSON.stringify({ error: createErr?.message ?? "Create user failed" }),
        {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        },
      );
    }

    const userId = created.user.id;
    const expiresAt = new Date(
      Date.now() + body.expiry_days * 24 * 60 * 60 * 1000,
    ).toISOString();

    const { error: subErr } = await admin
      .from("customer_subscriptions")
      .insert({
        user_id: userId,
        expires_at: expiresAt,
        notes: body.notes ?? null,
        created_by: userData.user.id,
      });
    if (subErr) {
      return new Response(JSON.stringify({ error: subErr.message }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // ALWAYS create an organization for new admin accounts so they land on
    // the admin dashboard (not the e-commerce customer storefront).
    const fallbackName = (body.full_name && body.full_name.trim().length > 0
      ? body.full_name.trim()
      : body.email.split("@")[0]) + "'s Workspace";
    const orgName = body.organization_name && body.organization_name.trim().length > 0
      ? body.organization_name.trim()
      : fallbackName;

    const { data: orgRow, error: orgErr } = await admin
      .from("organizations")
      .insert({ name: orgName, created_by: userId })
      .select("id")
      .single();

    if (orgErr || !orgRow) {
      return new Response(
        JSON.stringify({
          user_id: userId,
          expires_at: expiresAt,
          org_warning: orgErr?.message ?? "Failed to create workspace",
        }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } },
      );
    }

    // Defensive: ensure the user is owner even if the trigger didn't fire.
    await admin
      .from("organization_members")
      .upsert(
        { organization_id: orgRow.id, user_id: userId, role: "owner" },
        { onConflict: "organization_id,user_id" },
      );

    // Make sure their current_org_id is set so they land in the right place.
    await admin
      .from("profiles")
      .update({ current_org_id: orgRow.id })
      .eq("user_id", userId);

    return new Response(
      JSON.stringify({
        user_id: userId,
        expires_at: expiresAt,
        organization_id: orgRow.id,
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } },
    );
  } catch (e) {
    return new Response(JSON.stringify({ error: String(e) }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});