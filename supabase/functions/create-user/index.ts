import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      return new Response(
        JSON.stringify({ error: "Não autorizado" }),
        { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const anonKey = Deno.env.get("SUPABASE_ANON_KEY")!;

    const callerClient = createClient(supabaseUrl, anonKey, {
      global: { headers: { Authorization: authHeader } },
    });
    
    const { data: { user: callerUser }, error: callerError } = await callerClient.auth.getUser();
    if (callerError || !callerUser) {
      return new Response(
        JSON.stringify({ error: "Não autorizado" }),
        { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const adminClient = createClient(supabaseUrl, serviceRoleKey);
    const { data: roleData } = await adminClient
      .from("user_roles")
      .select("role")
      .eq("user_id", callerUser.id)
      .eq("role", "admin")
      .maybeSingle();

    if (!roleData) {
      return new Response(
        JSON.stringify({ error: "Acesso negado. Apenas administradores podem gerenciar usuários." }),
        { status: 403, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const body = await req.json();

    // ==========================================
    // ROTA PARA LISTAR USUÁRIOS
    // ==========================================
    if (body.action === "list") {
      const { data: { users }, error: listError } = await adminClient.auth.admin.listUsers({ perPage: 1000 });
      if (listError) {
        return new Response(JSON.stringify({ error: listError.message }), { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } });
      }
      const { data: rolesData } = await adminClient.from("user_roles").select("*").order("role");
      return new Response(
        JSON.stringify({ users: users.map((u: any) => ({ id: u.id, email: u.email })), roles: rolesData || [] }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // ==========================================
    // ROTA PARA ATUALIZAR (EDITAR) USUÁRIO
    // ==========================================
    if (body.action === "update") {
      const { role_id, role, company_id } = body;
      
      const updateData: any = { role };
      if (role === "company_user") updateData.company_id = company_id || null;
      else updateData.company_id = null;

      const { error } = await adminClient.from("user_roles").update(updateData).eq("id", role_id);
      
      if (error) {
        return new Response(JSON.stringify({ error: error.message }), { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } });
      }
      return new Response(JSON.stringify({ success: true }), { headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }

    // ==========================================
    // ROTA PARA EXCLUIR USUÁRIO DEFINITIVAMENTE
    // ==========================================
    if (body.action === "delete") {
      const { user_id, role_id } = body;
      
      // Apaga o usuário do sistema de autenticação (auth.users)
      const { error: authError } = await adminClient.auth.admin.deleteUser(user_id);
      if (authError) {
        return new Response(JSON.stringify({ error: authError.message }), { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } });
      }
      
      // Tenta apagar a role por precaução, caso o banco não tenha feito a cascata automática
      if (role_id) {
        await adminClient.from("user_roles").delete().eq("id", role_id);
      }
      return new Response(JSON.stringify({ success: true }), { headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }

    // ==========================================
    // ROTA PADRÃO (CRIAR NOVO USUÁRIO)
    // ==========================================
    const { email, password, role = "user", company_id = null } = body;

    if (!email || !password) return new Response(JSON.stringify({ error: "E-mail e senha são obrigatórios" }), { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } });
    if (password.length < 8) return new Response(JSON.stringify({ error: "A senha deve ter pelo menos 8 caracteres" }), { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } });

    const allowedRoles = ["admin", "user", "company_user"];
    if (!allowedRoles.includes(role)) return new Response(JSON.stringify({ error: "Role inválido" }), { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } });
    if (role === "company_user" && !company_id) return new Response(JSON.stringify({ error: "Para 'Usuário Empresa', selecione uma empresa." }), { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } });

    const { data, error } = await adminClient.auth.admin.createUser({ email, password, email_confirm: true });
    if (error) return new Response(JSON.stringify({ error: error.message }), { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } });

    const roleInsert: Record<string, unknown> = { user_id: data.user.id, role };
    if (role === "company_user" && company_id) roleInsert.company_id = company_id;

    const { error: roleError } = await adminClient.from("user_roles").insert(roleInsert);
    if (roleError) {
      await adminClient.auth.admin.deleteUser(data.user.id);
      return new Response(JSON.stringify({ error: "Erro ao atribuir role ao usuário." }), { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }

    // Audit log (Ignora falhas)
    try {
      await adminClient.from("audit_logs").insert({
        actor_user_id: callerUser.id, action: "create_user", target_type: "auth.user", target_id: data.user.id,
        details: { email, role, company_id: role === "company_user" ? company_id : null },
      });
    } catch (_) {}

    return new Response(
      JSON.stringify({ success: true, user: { id: data.user.id, email: data.user.email, role, company_id: role === "company_user" ? company_id : null } }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error) {
    return new Response(JSON.stringify({ error: (error as Error).message }), { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } });
  }
});