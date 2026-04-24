import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";
import { z } from "https://esm.sh/zod@3.23.8";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

const ItemSchema = z.object({
  product_id: z.string().uuid().nullable().optional(),
  product_name: z.string().min(1).max(200),
  product_sku: z.string().max(80).nullable().optional(),
  unit_price: z.number().nonnegative(),
  quantity: z.number().positive(),
});

const BodySchema = z.object({
  organization_id: z.string().uuid(),
  full_name: z.string().trim().min(1).max(120),
  email: z.string().trim().email().max(255),
  phone: z.string().trim().min(3).max(40),
  line1: z.string().trim().min(1).max(300),
  notes: z.string().trim().max(1000).optional().nullable(),
  items: z.array(ItemSchema).min(1),
});

function genPassword(len = 16) {
  const chars =
    "ABCDEFGHJKLMNPQRSTUVWXYZabcdefghjkmnpqrstuvwxyz23456789!@#$%";
  const arr = new Uint32Array(len);
  crypto.getRandomValues(arr);
  let out = "";
  for (let i = 0; i < len; i++) out += chars[arr[i] % chars.length];
  return out;
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const admin = createClient(supabaseUrl, serviceKey);

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

    // 1) Find or create an auth user for this email so the order is tied to a customer account.
    let userId: string | null = null;
    {
      // Look for existing auth user with that email
      const { data: list } = await admin.auth.admin.listUsers({
        page: 1,
        perPage: 200,
      });
      const existing = list.users.find(
        (u) => (u.email ?? "").toLowerCase() === body.email.toLowerCase(),
      );
      if (existing) {
        userId = existing.id;
      } else {
        const { data: created, error: createErr } = await admin.auth.admin
          .createUser({
            email: body.email,
            password: genPassword(),
            email_confirm: true,
            user_metadata: {
              full_name: body.full_name,
              phone: body.phone,
              guest_signup: true,
            },
          });
        if (createErr || !created.user) {
          return new Response(
            JSON.stringify({
              error: createErr?.message ?? "Failed to create account",
            }),
            {
              status: 500,
              headers: { ...corsHeaders, "Content-Type": "application/json" },
            },
          );
        }
        userId = created.user.id;
      }
    }

    // 2) Find or create the ecom_customer record scoped to this organization.
    let customerId: string;
    {
      const { data: existingCust } = await admin
        .from("ecom_customers")
        .select("id")
        .eq("user_id", userId)
        .eq("organization_id", body.organization_id)
        .maybeSingle();
      if (existingCust) {
        customerId = existingCust.id;
        // Refresh contact details so the latest checkout info wins
        await admin
          .from("ecom_customers")
          .update({
            full_name: body.full_name,
            email: body.email,
            phone: body.phone,
          })
          .eq("id", existingCust.id);
      } else {
        const { data: createdCust, error: custErr } = await admin
          .from("ecom_customers")
          .insert({
            user_id: userId,
            organization_id: body.organization_id,
            full_name: body.full_name,
            email: body.email,
            phone: body.phone,
          })
          .select("id")
          .single();
        if (custErr || !createdCust) {
          return new Response(
            JSON.stringify({
              error: custErr?.message ?? "Failed to create customer",
            }),
            {
              status: 500,
              headers: { ...corsHeaders, "Content-Type": "application/json" },
            },
          );
        }
        customerId = createdCust.id;
      }
    }

    // 3) Create order + line items.
    const subtotal = body.items.reduce(
      (s, it) => s + it.unit_price * it.quantity,
      0,
    );
    const orderNumber = `ORD-${Date.now().toString(36).toUpperCase()}`;
    const { data: order, error: orderErr } = await admin
      .from("ecom_orders")
      .insert({
        organization_id: body.organization_id,
        customer_id: customerId,
        order_number: orderNumber,
        status: "pending",
        payment_status: "unpaid",
        payment_method: "cod",
        contact_email: body.email,
        contact_phone: body.phone,
        shipping_full_name: body.full_name,
        shipping_line1: body.line1,
        shipping_line2: null,
        shipping_city: "",
        shipping_state: null,
        shipping_postal_code: null,
        shipping_country: "",
        subtotal,
        shipping_fee: 0,
        tax: 0,
        total: subtotal,
        notes: body.notes ?? null,
      })
      .select("id, order_number")
      .single();
    if (orderErr || !order) {
      return new Response(
        JSON.stringify({ error: orderErr?.message ?? "Order failed" }),
        {
          status: 500,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        },
      );
    }

    const lines = body.items.map((it) => ({
      order_id: order.id,
      product_id: it.product_id ?? null,
      product_name: it.product_name,
      product_sku: it.product_sku ?? null,
      unit_price: it.unit_price,
      quantity: it.quantity,
      line_total: it.unit_price * it.quantity,
    }));
    const { error: itemsErr } = await admin
      .from("ecom_order_items")
      .insert(lines);
    if (itemsErr) {
      return new Response(
        JSON.stringify({ error: itemsErr.message }),
        {
          status: 500,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        },
      );
    }

    return new Response(
      JSON.stringify({
        order_id: order.id,
        order_number: order.order_number,
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