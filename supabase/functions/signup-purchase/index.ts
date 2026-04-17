import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

function json(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const body = await req.json();
    const { email, password, plan_slug, full_name } = body ?? {};

    if (!email || !password || !plan_slug) {
      return json({ error: "email, password e plan_slug são obrigatórios" }, 400);
    }
    if (typeof password !== "string" || password.length < 8) {
      return json({ error: "A senha deve ter pelo menos 8 caracteres" }, 400);
    }

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const admin = createClient(supabaseUrl, serviceRoleKey);

    // 1) Buscar plano pelo slug
    const { data: plan, error: planError } = await admin
      .from("plans")
      .select("*")
      .eq("slug", plan_slug)
      .eq("is_active", true)
      .maybeSingle();

    if (planError || !plan) {
      return json({ error: "Plano inválido ou inativo" }, 400);
    }

    // 2) Criar usuário no Auth (e-mail confirmado para liberar login imediato)
    const { data: created, error: createError } = await admin.auth.admin.createUser({
      email,
      password,
      email_confirm: true,
      user_metadata: full_name ? { full_name } : {},
    });
    if (createError || !created?.user) {
      return json({ error: createError?.message || "Falha ao criar usuário" }, 400);
    }
    const userId = created.user.id;

    // 3) Atribuir role admin (sem parent_admin_id — é o comprador)
    const { error: roleError } = await admin
      .from("user_roles")
      .insert({ user_id: userId, role: "admin", parent_admin_id: null });
    if (roleError) {
      await admin.auth.admin.deleteUser(userId);
      return json({ error: "Falha ao atribuir role: " + roleError.message }, 500);
    }

    // 4) Criar subscription vinculada ao plano
    const { data: sub, error: subError } = await admin
      .from("subscriptions")
      .insert({
        user_id: userId,
        plan_id: plan.id,
        plan_name: plan.name,
        status: "active",
        max_companies: plan.max_companies,
        max_surveys: plan.max_surveys,
        max_users: plan.max_users,
        max_responses_per_month: plan.max_respondents,
        features: plan.features,
      })
      .select()
      .single();

    if (subError) {
      await admin.from("user_roles").delete().eq("user_id", userId);
      await admin.auth.admin.deleteUser(userId);
      return json({ error: "Falha ao criar assinatura: " + subError.message }, 500);
    }

    // 5) Audit log (best-effort)
    try {
      await admin.from("audit_logs").insert({
        user_id: userId,
        action: "signup_purchase",
        entity: "subscriptions",
        entity_id: sub.id,
        metadata: { plan_slug, plan_id: plan.id, email },
      });
    } catch (_) {}

    return json({
      success: true,
      user: { id: userId, email },
      subscription: sub,
      plan: { slug: plan.slug, name: plan.name },
    });
  } catch (err) {
    return json({ error: (err as Error).message }, 500);
  }
});
