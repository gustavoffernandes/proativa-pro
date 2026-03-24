import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  // ========== AUTH: Require secret token or admin JWT ==========
  const autoSyncSecret = Deno.env.get("AUTO_SYNC_SECRET");
  const authHeader = req.headers.get("Authorization");
  const providedToken = req.headers.get("X-Auto-Sync-Token");

  const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
  const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
  const anonKey = Deno.env.get("SUPABASE_ANON_KEY")!;
  const googleApiKey = Deno.env.get("GOOGLE_SHEETS_API_KEY");

  let isAuthorized = false;

  // Option 1: Secret token for cron jobs
  if (autoSyncSecret && providedToken === autoSyncSecret) {
    isAuthorized = true;
  }

  // Option 2: Admin JWT
  if (!isAuthorized && authHeader) {
    const callerClient = createClient(supabaseUrl, anonKey, {
      global: { headers: { Authorization: authHeader } },
    });
    const { data: { user } } = await callerClient.auth.getUser();
    if (user) {
      const adminCheck = createClient(supabaseUrl, supabaseKey);
      const { data: roleData } = await adminCheck
        .from("user_roles")
        .select("role")
        .eq("user_id", user.id)
        .eq("role", "admin")
        .maybeSingle();
      if (roleData) isAuthorized = true;
    }
  }

  if (!isAuthorized) {
    return new Response(
      JSON.stringify({ error: "Não autorizado. Forneça um token válido ou autentique como administrador." }),
      { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
  // ========== END AUTH ==========

  const supabase = createClient(supabaseUrl, supabaseKey);

  if (!googleApiKey) {
    console.error("GOOGLE_SHEETS_API_KEY não configurada");
    return new Response(
      JSON.stringify({ error: "GOOGLE_SHEETS_API_KEY não configurada." }),
      { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }

  // Buscar todas as configs ativas
  const { data: configs, error: configsError } = await supabase
    .from("google_forms_config")
    .select("*")
    .eq("is_active", true);

  if (configsError || !configs) {
    return new Response(
      JSON.stringify({ error: "Erro ao buscar configurações" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }

  if (configs.length === 0) {
    return new Response(
      JSON.stringify({ message: "Nenhuma configuração ativa encontrada." }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }

  const QUESTION_IDS = [
    "c1","c2","c3","c4","c5","c6","c7","c8","c9","c10","c11","c12","c13","c14","c15","c16","c17","c18","c19",
    "g1","g2","g3","g4","g5","g6","g7","g8","g9","g10","g11","g12","g13","g14","g15","g16","g17","g18","g19","g20","g21",
    "v1","v2","v3","v4","v5","v6","v7","v8","v9","v10","v11","v12","v13","v14","v15","v16","v17","v18","v19","v20","v21","v22","v23","v24","v25","v26","v27","v28",
    "s1","s2","s3","s4","s5","s6","s7","s8","s9","s10","s11","s12","s13","s14","s15","s16","s17","s18","s19","s20","s21","s22","s23",
  ];
  const METADATA_COLUMNS = 5;

  function parseDate(dateStr: string): string | null {
    if (!dateStr) return null;
    const match = dateStr.match(/(\d{2})\/(\d{2})\/(\d{4})\s*(\d{2}):(\d{2}):(\d{2})/);
    if (match) {
      const [, day, month, year, hour, min, sec] = match;
      return `${year}-${month}-${day}T${hour}:${min}:${sec}`;
    }
    return null;
  }

  const results: Record<string, unknown>[] = [];

  for (const config of configs) {
    const { data: log } = await supabase.from("sync_logs").insert({
      config_id: config.id,
      status: "running",
    }).select().single();

    try {
      const sheetUrl = `https://sheets.googleapis.com/v4/spreadsheets/${config.spreadsheet_id}/values/${encodeURIComponent(config.sheet_name)}?key=${googleApiKey}`;
      const sheetRes = await fetch(sheetUrl);

      if (!sheetRes.ok) {
        const errBody = await sheetRes.text();
        throw new Error(`Google Sheets API error: ${sheetRes.status} - ${errBody}`);
      }

      const sheetData = await sheetRes.json();
      const rows = sheetData.values || [];

      if (rows.length < 2) {
        throw new Error("Planilha vazia ou sem dados de resposta.");
      }

      const dataRows = rows.slice(1);

      // Delete existing and re-insert (full replace)
      await supabase.from("survey_responses").delete().eq("config_id", config.id);

      const responses = dataRows.map((row: string[], idx: number) => {
        const answers: Record<string, number> = {};
        const numQuestionCols = Math.min(row.length - METADATA_COLUMNS, QUESTION_IDS.length);
        for (let i = 0; i < numQuestionCols; i++) {
          const val = parseInt(row[METADATA_COLUMNS + i], 10);
          if (!isNaN(val) && val >= 1 && val <= 5) {
            answers[QUESTION_IDS[i]] = val;
          }
        }
        return {
          config_id: config.id,
          response_timestamp: parseDate(row[0]),
          respondent_name: row[1] || null,
          sex: row[2] || null,
          age: row[3] ? parseInt(row[3], 10) || null : null,
          sector: row[4] || null,
          answers,
          raw_row_index: idx,
        };
      });

      const batchSize = 50;
      for (let i = 0; i < responses.length; i += batchSize) {
        const batch = responses.slice(i, i + batchSize);
        const { error: insertError } = await supabase.from("survey_responses").insert(batch);
        if (insertError) throw new Error(`Erro ao inserir: ${insertError.message}`);
      }

      await supabase.from("sync_logs").update({
        status: "success",
        rows_synced: responses.length,
        finished_at: new Date().toISOString(),
      }).eq("id", log?.id);

      await supabase.from("google_forms_config").update({
        last_sync_at: new Date().toISOString(),
      }).eq("id", config.id);

      results.push({ company: config.company_name, rows_synced: responses.length, status: "success" });
      console.log(`✅ ${config.company_name}: ${responses.length} respostas sincronizadas`);
    } catch (err) {
      const msg = (err as Error).message;
      await supabase.from("sync_logs").update({
        status: "error",
        error_message: msg,
        finished_at: new Date().toISOString(),
      }).eq("id", log?.id);
      results.push({ company: config.company_name, status: "error", error: msg });
      console.error(`❌ ${config.company_name}: ${msg}`);
    }
  }

  return new Response(
    JSON.stringify({ synced_at: new Date().toISOString(), results }),
    { headers: { ...corsHeaders, "Content-Type": "application/json" } }
  );
});
