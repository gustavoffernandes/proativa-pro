/* eslint-disable react-hooks/rules-of-hooks */
import { useState, useEffect, useMemo, useCallback } from "react";
import { useParams } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { PROART_QUESTIONS, OPEN_QUESTIONS, LIKERT_OPTIONS, DEMOGRAPHIC_OPTIONS, getQuestionsByScale } from "@/lib/proartQuestions";
import { CheckCircle2, ChevronLeft, ChevronRight, Clock, FileText, Loader2, Lock, Save, Shield, AlertCircle, User, Briefcase } from "lucide-react";
import { cn } from "@/lib/utils";

type Step = "welcome" | "consent" | "password" | "demographics" | "scale-0" | "scale-1" | "scale-2" | "scale-3" | "open" | "review" | "submitted";

interface FormConfig {
  id: string;
  company_name: string;
  form_title: string | null;
  description: string | null;
  instructions: string | null;
  is_active: boolean;
  is_anonymous: boolean | null;
  require_consent: boolean | null;
  require_password: boolean | null;
  survey_password: string | null;
  start_date: string | null;
  end_date: string | null;
  sector: string | null;
}

interface Demographics {
  sex: string;
  age: string;
  escolaridade: string;
  estado_civil: string;
  tempo_empresa: string;
  sector: string;
  respondent_name: string;
}

const STORAGE_KEY_PREFIX = "proativa_survey_";

export default function PublicSurvey() {
  const { id } = useParams<{ id: string }>();
  const [config, setConfig] = useState<FormConfig | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [step, setStep] = useState<Step>("welcome");
  const [consentAccepted, setConsentAccepted] = useState(false);
  const [passwordInput, setPasswordInput] = useState("");
  const [passwordError, setPasswordError] = useState(false);
  const [demographics, setDemographics] = useState<Demographics>({
    sex: "", age: "", escolaridade: "", estado_civil: "",
    tempo_empresa: "", sector: "", respondent_name: "",
  });
  const [answers, setAnswers] = useState<Record<string, number>>({});
  const [openAnswers, setOpenAnswers] = useState<Record<string, string>>({});
  const [submitting, setSubmitting] = useState(false);
  const [sectors, setSectors] = useState<string[]>([]);
  const [sessionId, setSessionId] = useState<string | null>(null);

  const scales = useMemo(() => getQuestionsByScale(), []);
  const totalQuestions = PROART_QUESTIONS.length;
  const answeredCount = Object.keys(answers).length;
  const progress = totalQuestions > 0 ? Math.round((answeredCount / totalQuestions) * 100) : 0;

  useEffect(() => {
    if (!id) { setError("Link inválido"); setLoading(false); return; }
    (async () => {
      const { data, error: err } = await supabase
        .from("google_forms_config")
        .select("*")
        .eq("id", id)
        .maybeSingle();
      if (err || !data) { setError("Pesquisa não encontrada"); setLoading(false); return; }
      const cfg = data as any as FormConfig;
      if (!cfg.is_active) { setError("Esta pesquisa não está mais ativa"); setLoading(false); return; }
      if (cfg.end_date && new Date(cfg.end_date) < new Date()) { setError("O prazo desta pesquisa encerrou"); setLoading(false); return; }
      if (cfg.start_date && new Date(cfg.start_date) > new Date()) { setError("Esta pesquisa ainda não começou"); setLoading(false); return; }
      setConfig(cfg);

      const configSectors: string[] = [];
      if (Array.isArray((data as any).sectors)) {
        (data as any).sectors.forEach((s: any) => {
          if (s.name) configSectors.push(s.name);
        });
      }
      setSectors([...new Set(configSectors)]);

      const sessionToken = localStorage.getItem(STORAGE_KEY_PREFIX + id + "_token") || crypto.randomUUID();
      localStorage.setItem(STORAGE_KEY_PREFIX + id + "_token", sessionToken);

      const { data: existingSession } = await (supabase.from("survey_sessions") as any)
        .select("id, status")
        .eq("config_id", id)
        .eq("session_token", sessionToken)
        .maybeSingle();

      if (existingSession) {
        if (existingSession.status === "completed") {
          setError("Você já respondeu esta pesquisa");
          setLoading(false);
          return;
        }
        setSessionId(existingSession.id);
        await (supabase.from("survey_sessions") as any)
          .update({ last_activity_at: new Date().toISOString() })
          .eq("id", existingSession.id);
      } else {
        const { data: newSession } = await (supabase.from("survey_sessions") as any)
          .insert([{ config_id: id, session_token: sessionToken, status: "in_progress" }])
          .select("id")
          .single();
        if (newSession) setSessionId(newSession.id);
      }

      try {
        const saved = localStorage.getItem(STORAGE_KEY_PREFIX + id);
        if (saved) {
          const parsed = JSON.parse(saved);
          if (parsed.answers) setAnswers(parsed.answers);
          if (parsed.openAnswers) setOpenAnswers(parsed.openAnswers);
          if (parsed.demographics) setDemographics(parsed.demographics);
        }
      } catch {}

      setLoading(false);
    })();
  }, [id]);

  useEffect(() => {
    if (!id || step === "submitted") return;
    const timeout = setTimeout(() => {
      localStorage.setItem(STORAGE_KEY_PREFIX + id, JSON.stringify({ answers, openAnswers, demographics }));
    }, 1000);
    return () => clearTimeout(timeout);
  }, [answers, openAnswers, demographics, id, step]);

  const setAnswer = useCallback((qId: string, value: number) => {
    setAnswers(prev => ({ ...prev, [qId]: value }));
  }, []);

  const handleSubmit = async () => {
    if (answeredCount < totalQuestions) return;
    setSubmitting(true);
    try {
      const ageMap: Record<string, number> = { "18 a 25 anos": 21, "26 a 35 anos": 30, "36 a 45 anos": 40, "46 a 55 anos": 50, "Acima de 55 anos": 60 };
      const { error: err } = await supabase.from("survey_responses").insert([{
        config_id: id,
        respondent_name: config?.is_anonymous ? null : demographics.respondent_name || null,
        sex: demographics.sex || null,
        age: ageMap[demographics.age] || null,
        sector: demographics.sector || null,
        escolaridade: demographics.escolaridade || null,
        estado_civil: demographics.estado_civil || null,
        tempo_empresa: demographics.tempo_empresa || null,
        answers: answers as any,
        open_answers: openAnswers as any,
        response_timestamp: new Date().toISOString(),
      }] as any);
      if (err) throw err;

      if (sessionId) {
        await (supabase.from("survey_sessions") as any)
          .update({ status: "completed", completed_at: new Date().toISOString() })
          .eq("id", sessionId);
      }

      localStorage.removeItem(STORAGE_KEY_PREFIX + id);
      localStorage.removeItem(STORAGE_KEY_PREFIX + id + "_token");
      setStep("submitted");
    } catch (e: any) {
      alert("Erro ao enviar: " + (e.message || "Tente novamente"));
    } finally {
      setSubmitting(false);
    }
  };

  const goNext = () => {
    const steps: Step[] = buildSteps();
    const idx = steps.indexOf(step);
    if (idx < steps.length - 1) setStep(steps[idx + 1]);
  };

  const goPrev = () => {
    const steps: Step[] = buildSteps();
    const idx = steps.indexOf(step);
    if (idx > 0) setStep(steps[idx - 1]);
  };

  const buildSteps = (): Step[] => {
    const s: Step[] = ["welcome"];
    if (config?.require_consent) s.push("consent");
    if (config?.require_password) s.push("password");
    s.push("demographics", "scale-0", "scale-1", "scale-2", "scale-3", "open", "review");
    return s;
  };

  const canProceed = (): boolean => {
    if (step === "consent") return consentAccepted;
    if (step === "password") return passwordInput === config?.survey_password;
    if (step === "demographics") return !!(demographics.sex && demographics.age && demographics.escolaridade && demographics.tempo_empresa && demographics.sector);
    if (step.startsWith("scale-")) {
      const scaleIdx = parseInt(step.split("-")[1]);
      const scale = scales[scaleIdx];
      return scale.questions.every(q => answers[q.id] !== undefined);
    }
    return true;
  };

  // --- Color palette derived from dashboard tokens ---
  const primaryHsl = "217 71% 45%";
  const accentHsl = "170 60% 45%";

  if (loading) return (
    <div className="min-h-screen flex items-center justify-center" style={{ background: `linear-gradient(135deg, hsl(${primaryHsl} / 0.06) 0%, hsl(0 0% 100%) 50%, hsl(${accentHsl} / 0.06) 100%)` }}>
      <div className="flex flex-col items-center gap-3">
        <div className="w-12 h-12 rounded-2xl flex items-center justify-center" style={{ background: `hsl(${primaryHsl})` }}>
          <Loader2 className="h-6 w-6 animate-spin text-white" />
        </div>
        <p className="text-sm font-medium" style={{ color: `hsl(220 30% 40%)` }}>Carregando pesquisa...</p>
      </div>
    </div>
  );

  if (error) return (
    <div className="min-h-screen flex items-center justify-center p-4" style={{ background: `linear-gradient(135deg, hsl(${primaryHsl} / 0.06) 0%, hsl(0 0% 100%) 50%, hsl(${accentHsl} / 0.06) 100%)` }}>
      <div className="bg-white rounded-2xl p-8 max-w-md text-center" style={{ boxShadow: '0 20px 60px -15px rgba(0,0,0,0.1), 0 0 0 1px rgba(0,0,0,0.04)' }}>
        <div className="w-14 h-14 rounded-full flex items-center justify-center mx-auto mb-4" style={{ background: 'hsl(0 72% 55% / 0.1)' }}>
          <AlertCircle className="h-7 w-7" style={{ color: 'hsl(0 72% 55%)' }} />
        </div>
        <h1 className="text-xl font-bold mb-2" style={{ color: `hsl(220 30% 12%)` }}>Pesquisa Indisponível</h1>
        <p className="text-sm" style={{ color: `hsl(220 10% 50%)` }}>{error}</p>
      </div>
    </div>
  );

  if (step === "submitted") return (
    <div className="min-h-screen flex items-center justify-center p-4" style={{ background: `linear-gradient(135deg, hsl(${primaryHsl} / 0.06) 0%, hsl(0 0% 100%) 50%, hsl(${accentHsl} / 0.06) 100%)` }}>
      <div className="bg-white rounded-2xl p-8 max-w-md text-center" style={{ boxShadow: '0 20px 60px -15px rgba(0,0,0,0.1), 0 0 0 1px rgba(0,0,0,0.04)' }}>
        <div className="w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-5" style={{ background: 'hsl(152 60% 42% / 0.12)' }}>
          <CheckCircle2 className="h-8 w-8" style={{ color: 'hsl(152 60% 42%)' }} />
        </div>
        <h1 className="text-2xl font-bold mb-2" style={{ color: `hsl(220 30% 12%)` }}>Obrigado!</h1>
        <p className="text-sm mb-6" style={{ color: `hsl(220 10% 50%)` }}>Suas respostas foram enviadas com sucesso. Agradecemos sua participação nesta pesquisa.</p>
        <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full text-xs font-medium" style={{ background: 'hsl(152 60% 42% / 0.1)', color: 'hsl(152 60% 42%)' }}>
          <Shield className="h-3.5 w-3.5" /> Dados protegidos pela LGPD
        </div>
      </div>
    </div>
  );

  const steps = buildSteps();
  const currentStepIdx = steps.indexOf(step);
  const totalSteps = steps.length;

  const stepLabels: Record<string, string> = {
    welcome: "Início",
    consent: "Consentimento",
    password: "Senha",
    demographics: "Seus Dados",
    "scale-0": scales[0]?.name || "Escala 1",
    "scale-1": scales[1]?.name || "Escala 2",
    "scale-2": scales[2]?.name || "Escala 3",
    "scale-3": scales[3]?.name || "Escala 4",
    open: "Percepção",
    review: "Revisão",
  };

  return (
    <div className="min-h-screen" style={{ background: `linear-gradient(160deg, hsl(${primaryHsl} / 0.04) 0%, hsl(0 0% 99%) 40%, hsl(${accentHsl} / 0.04) 100%)` }}>
      {/* Header */}
      <header className="sticky top-0 z-50 backdrop-blur-xl border-b" style={{ background: 'hsla(0,0%,100%,0.92)', borderColor: 'hsl(220 15% 92%)' }}>
        <div className="max-w-3xl mx-auto flex items-center justify-between px-4 py-3">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl flex items-center justify-center text-white font-bold text-sm" style={{ background: `hsl(${primaryHsl})` }}>P</div>
            <div>
              <p className="text-sm font-bold tracking-tight" style={{ color: `hsl(220 30% 12%)` }}>PROATIVA</p>
              <p className="text-[10px] font-medium" style={{ color: `hsl(220 10% 50%)` }}>Avaliação de Riscos Psicossociais</p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <div className="hidden sm:flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold" style={{ background: `hsl(${primaryHsl} / 0.08)`, color: `hsl(${primaryHsl})` }}>
              <Save className="h-3 w-3" /> Auto-save
            </div>
            <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold" style={{ background: progress === 100 ? 'hsl(152 60% 42% / 0.1)' : 'hsl(220 15% 95%)', color: progress === 100 ? 'hsl(152 60% 42%)' : `hsl(220 10% 50%)` }}>
              {answeredCount}/{totalQuestions}
            </div>
          </div>
        </div>
      </header>

      {/* Step indicator */}
      {step !== "welcome" && (
        <div className="border-b" style={{ borderColor: 'hsl(220 15% 95%)', background: 'hsl(0 0% 100%)' }}>
          <div className="max-w-3xl mx-auto px-4 py-3">
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-semibold" style={{ color: `hsl(${primaryHsl})` }}>{stepLabels[step] || step}</span>
              <span className="text-xs font-medium" style={{ color: 'hsl(220 10% 55%)' }}>Etapa {currentStepIdx + 1} de {totalSteps}</span>
            </div>
            <div className="w-full h-1.5 rounded-full overflow-hidden" style={{ background: 'hsl(220 15% 93%)' }}>
              <div className="h-full rounded-full transition-all duration-500 ease-out" style={{ width: `${progress}%`, background: `linear-gradient(90deg, hsl(${primaryHsl}), hsl(${accentHsl}))` }} />
            </div>
          </div>
        </div>
      )}

      {/* Content */}
      <main className="max-w-3xl mx-auto px-4 py-8 pb-28">
        {/* Welcome */}
        {step === "welcome" && (
          <div className="text-center space-y-8">
            <div className="w-20 h-20 rounded-2xl flex items-center justify-center mx-auto" style={{ background: `linear-gradient(135deg, hsl(${primaryHsl}), hsl(${primaryHsl} / 0.8))`, boxShadow: `0 12px 40px -10px hsl(${primaryHsl} / 0.35)` }}>
              <FileText className="h-10 w-10 text-white" />
            </div>
            <div>
              <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight mb-2" style={{ color: 'hsl(220 30% 12%)' }}>{config?.form_title || "Avaliação PROART"}</h1>
              <p className="text-sm max-w-md mx-auto" style={{ color: 'hsl(220 10% 50%)' }}>{config?.description || "Esta pesquisa avalia fatores de risco psicossocial no ambiente de trabalho."}</p>
              {config?.company_name && (
                <div className="mt-3 inline-flex items-center gap-2 px-4 py-1.5 rounded-full text-xs font-semibold" style={{ background: `hsl(${primaryHsl} / 0.08)`, color: `hsl(${primaryHsl})` }}>
                  <Briefcase className="h-3.5 w-3.5" /> {config.company_name}
                </div>
              )}
            </div>

            <div className="grid grid-cols-3 gap-3 max-w-sm mx-auto">
              {[
                { icon: FileText, value: "91", label: "Questões" },
                { icon: Clock, value: "15-20", label: "Minutos" },
                { icon: Save, value: "Auto", label: "Salvamento" },
              ].map(({ icon: Icon, value, label }) => (
                <div key={label} className="p-4 rounded-2xl border" style={{ background: 'hsl(0 0% 100%)', borderColor: 'hsl(220 15% 92%)', boxShadow: '0 2px 8px -2px rgba(0,0,0,0.06)' }}>
                  <Icon className="h-5 w-5 mx-auto mb-2" style={{ color: `hsl(${primaryHsl})` }} />
                  <p className="text-lg font-extrabold" style={{ color: 'hsl(220 30% 12%)' }}>{value}</p>
                  <p className="text-[10px] font-semibold uppercase tracking-widest mt-0.5" style={{ color: 'hsl(220 10% 55%)' }}>{label}</p>
                </div>
              ))}
            </div>

            {config?.instructions && (
              <div className="rounded-2xl p-5 text-left" style={{ background: `hsl(${primaryHsl} / 0.05)`, border: `1px solid hsl(${primaryHsl} / 0.12)` }}>
                <p className="text-sm font-bold flex items-center gap-2 mb-2" style={{ color: `hsl(${primaryHsl})` }}><AlertCircle className="h-4 w-4" /> Instruções</p>
                <p className="text-sm leading-relaxed" style={{ color: 'hsl(220 20% 35%)' }}>{config.instructions}</p>
              </div>
            )}

            <div className="rounded-2xl p-4 text-left" style={{ background: 'hsl(152 60% 42% / 0.06)', border: '1px solid hsl(152 60% 42% / 0.15)' }}>
              <p className="text-sm font-semibold flex items-center gap-2" style={{ color: 'hsl(152 55% 32%)' }}><Save className="h-4 w-4" /> Suas respostas são salvas automaticamente</p>
              <p className="text-xs mt-1" style={{ color: 'hsl(152 30% 40%)' }}>Se precisar interromper, você pode voltar depois e continuar de onde parou.</p>
            </div>
          </div>
        )}

        {/* Consent */}
        {step === "consent" && (
          <div className="space-y-6">
            <SectionHeader icon={Shield} title="Termo de Consentimento" subtitle="Leia atentamente antes de prosseguir" primaryHsl={primaryHsl} />
            <div className="rounded-2xl border p-6 space-y-4 text-sm leading-relaxed" style={{ background: 'hsl(0 0% 100%)', borderColor: 'hsl(220 15% 92%)', color: 'hsl(220 15% 35%)' }}>
              <p>De acordo com a Lei Geral de Proteção de Dados (LGPD - Lei nº 13.709/2018), informamos que:</p>
              <ul className="list-disc pl-5 space-y-2">
                <li>Seus dados serão utilizados exclusivamente para fins de pesquisa organizacional</li>
                <li>As respostas são {config?.is_anonymous ? "anônimas e " : ""}confidenciais</li>
                <li>Os resultados serão apresentados de forma agregada, sem identificação individual</li>
                <li>Você pode interromper a pesquisa a qualquer momento</li>
                <li>Os dados serão armazenados de forma segura e por tempo determinado</li>
              </ul>
            </div>
            <label className="flex items-start gap-3 p-4 rounded-2xl border cursor-pointer transition-all" style={{ background: consentAccepted ? `hsl(${primaryHsl} / 0.04)` : 'hsl(0 0% 100%)', borderColor: consentAccepted ? `hsl(${primaryHsl} / 0.3)` : 'hsl(220 15% 90%)' }}>
              <input type="checkbox" checked={consentAccepted} onChange={e => setConsentAccepted(e.target.checked)}
                className="mt-0.5 h-4 w-4 rounded" style={{ accentColor: `hsl(${primaryHsl})` }} />
              <span className="text-sm" style={{ color: 'hsl(220 15% 30%)' }}>Li e concordo com os termos acima e autorizo o tratamento dos meus dados para os fins descritos.</span>
            </label>
          </div>
        )}

        {/* Password */}
        {step === "password" && (
          <div className="space-y-6">
            <SectionHeader icon={Lock} title="Acesso Protegido" subtitle="Esta pesquisa é protegida por senha" primaryHsl={primaryHsl} />
            <div className="rounded-2xl border p-6" style={{ background: 'hsl(0 0% 100%)', borderColor: 'hsl(220 15% 92%)' }}>
              <label className="text-xs font-semibold block mb-2" style={{ color: 'hsl(220 15% 40%)' }}>Senha de Acesso</label>
              <input type="password" value={passwordInput}
                onChange={e => { setPasswordInput(e.target.value); setPasswordError(false); }}
                placeholder="Digite a senha fornecida"
                className={cn("w-full rounded-xl border px-4 py-3 text-sm focus:outline-none focus:ring-2 transition-all")}
                style={{ borderColor: passwordError ? 'hsl(0 72% 55%)' : 'hsl(220 15% 90%)', background: 'hsl(220 20% 98%)' }} />
              {passwordError && <p className="text-xs mt-2 font-medium" style={{ color: 'hsl(0 72% 55%)' }}>Senha incorreta. Tente novamente.</p>}
            </div>
          </div>
        )}

        {/* Demographics */}
        {step === "demographics" && (
          <div className="space-y-6">
            <SectionHeader icon={User} title="Seus Dados" subtitle="Informações para análise demográfica" primaryHsl={primaryHsl} />

            {!config?.is_anonymous && (
              <FormCard>
                <FieldLabel label="Nome Completo" />
                <StyledInput value={demographics.respondent_name} onChange={v => setDemographics({ ...demographics, respondent_name: v })} placeholder="Seu nome completo" />
              </FormCard>
            )}

            <FormCard title="Informações Pessoais" icon={User}>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <StyledSelect label="Gênero" required value={demographics.sex} onChange={v => setDemographics({ ...demographics, sex: v })} options={DEMOGRAPHIC_OPTIONS.genero} />
                <StyledSelect label="Faixa Etária" required value={demographics.age} onChange={v => setDemographics({ ...demographics, age: v })} options={DEMOGRAPHIC_OPTIONS.faixa_etaria} />
                <StyledSelect label="Escolaridade" required value={demographics.escolaridade} onChange={v => setDemographics({ ...demographics, escolaridade: v })} options={DEMOGRAPHIC_OPTIONS.escolaridade} />
                <StyledSelect label="Estado Civil" value={demographics.estado_civil} onChange={v => setDemographics({ ...demographics, estado_civil: v })} options={DEMOGRAPHIC_OPTIONS.estado_civil} />
              </div>
            </FormCard>

            <FormCard title="Informações Profissionais" icon={Briefcase}>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <StyledSelect label="Tempo na Empresa" required value={demographics.tempo_empresa} onChange={v => setDemographics({ ...demographics, tempo_empresa: v })} options={DEMOGRAPHIC_OPTIONS.tempo_empresa} />
                {sectors.length > 0 ? (
                  <StyledSelect label="Setor" required value={demographics.sector} onChange={v => setDemographics({ ...demographics, sector: v })} options={sectors} />
                ) : (
                  <div className="space-y-1.5">
                    <FieldLabel label="Setor" required />
                    <StyledInput value={demographics.sector} onChange={v => setDemographics({ ...demographics, sector: v })} placeholder="Digite seu setor" />
                  </div>
                )}
              </div>
            </FormCard>
          </div>
        )}

        {/* Scale questions */}
        {step.startsWith("scale-") && (() => {
          const scaleIdx = parseInt(step.split("-")[1]);
          const scale = scales[scaleIdx];
          const scaleAnswered = scale.questions.filter(q => answers[q.id] !== undefined).length;
          return (
            <div className="space-y-5">
              <div>
                <div className="flex items-center gap-3 mb-1">
                  <div className="w-8 h-8 rounded-lg flex items-center justify-center text-white text-xs font-bold" style={{ background: `hsl(${primaryHsl})` }}>{scaleIdx + 1}</div>
                  <div>
                    <h2 className="text-lg font-bold" style={{ color: 'hsl(220 30% 12%)' }}>{scale.name}</h2>
                    <p className="text-xs" style={{ color: 'hsl(220 10% 55%)' }}>{scale.fullName}</p>
                  </div>
                </div>
                <div className="flex items-center gap-2 mt-3">
                  <div className="flex-1 h-1 rounded-full overflow-hidden" style={{ background: 'hsl(220 15% 93%)' }}>
                    <div className="h-full rounded-full transition-all duration-300" style={{ width: `${(scaleAnswered / scale.questions.length) * 100}%`, background: scaleAnswered === scale.questions.length ? 'hsl(152 60% 42%)' : `hsl(${primaryHsl})` }} />
                  </div>
                  <span className="text-xs font-semibold tabular-nums" style={{ color: scaleAnswered === scale.questions.length ? 'hsl(152 60% 42%)' : 'hsl(220 10% 55%)' }}>{scaleAnswered}/{scale.questions.length}</span>
                </div>
              </div>

              {/* Likert legend */}
              <div className="rounded-xl p-3 flex flex-wrap items-center justify-center gap-x-4 gap-y-1" style={{ background: 'hsl(220 20% 97%)', border: '1px solid hsl(220 15% 93%)' }}>
                {LIKERT_OPTIONS.map(opt => (
                  <span key={opt.value} className="text-[11px] font-medium" style={{ color: 'hsl(220 15% 40%)' }}>
                    <strong className="font-bold" style={{ color: `hsl(${primaryHsl})` }}>{opt.value}</strong> = {opt.label}
                  </span>
                ))}
              </div>

              <div className="space-y-3">
                {scale.questions.map(q => (
                  <QuestionCard key={q.id} question={q} value={answers[q.id]} onChange={v => setAnswer(q.id, v)} primaryHsl={primaryHsl} accentHsl={accentHsl} />
                ))}
              </div>
            </div>
          );
        })()}

        {/* Open questions */}
        {step === "open" && (
          <div className="space-y-5">
            <SectionHeader icon={FileText} title="Sua Percepção" subtitle="Respostas livres (opcional, mas muito valiosas)" primaryHsl={primaryHsl} />
            {OPEN_QUESTIONS.map((q, i) => (
              <div key={q.id} className="rounded-2xl border p-5 space-y-3" style={{ background: 'hsl(0 0% 100%)', borderColor: 'hsl(220 15% 92%)' }}>
                <p className="text-sm font-semibold" style={{ color: 'hsl(220 30% 15%)' }}>
                  <span className="inline-flex items-center justify-center w-6 h-6 rounded-full text-xs font-bold text-white mr-2" style={{ background: `hsl(${primaryHsl})` }}>{i + 1}</span>
                  {q.text}
                </p>
                {q.hint && <p className="text-xs pl-8" style={{ color: 'hsl(220 10% 55%)' }}>{q.hint}</p>}
                <textarea value={openAnswers[q.id] || ""}
                  onChange={e => setOpenAnswers(prev => ({ ...prev, [q.id]: e.target.value }))}
                  className="w-full rounded-xl border px-4 py-3 text-sm focus:outline-none focus:ring-2 min-h-[100px] resize-y transition-all"
                  style={{ borderColor: 'hsl(220 15% 90%)', background: 'hsl(220 20% 98%)' }}
                  placeholder="Compartilhe sua perspectiva..." />
              </div>
            ))}
          </div>
        )}

        {/* Review */}
        {step === "review" && (
          <div className="space-y-6">
            <SectionHeader icon={CheckCircle2} title="Revisão Final" subtitle="Verifique suas respostas antes de enviar" primaryHsl={primaryHsl} />
            <div className="rounded-2xl border p-6 space-y-5" style={{ background: 'hsl(0 0% 100%)', borderColor: 'hsl(220 15% 92%)' }}>
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium" style={{ color: 'hsl(220 10% 45%)' }}>Questões respondidas</span>
                <span className="text-lg font-extrabold" style={{ color: 'hsl(220 30% 12%)' }}>{answeredCount}/{totalQuestions}</span>
              </div>
              <div className="w-full h-2 rounded-full overflow-hidden" style={{ background: 'hsl(220 15% 93%)' }}>
                <div className="h-full rounded-full transition-all duration-500" style={{ width: `${progress}%`, background: progress === 100 ? 'hsl(152 60% 42%)' : `linear-gradient(90deg, hsl(${primaryHsl}), hsl(${accentHsl}))` }} />
              </div>
              {answeredCount < totalQuestions && (
                <div className="rounded-xl p-3" style={{ background: 'hsl(38 92% 55% / 0.08)', border: '1px solid hsl(38 92% 55% / 0.2)' }}>
                  <p className="text-xs font-semibold" style={{ color: 'hsl(38 70% 35%)' }}>⚠️ Faltam {totalQuestions - answeredCount} questões para completar.</p>
                </div>
              )}
              <div className="space-y-1">
                {scales.map((scale, i) => {
                  const scaleAnswered = scale.questions.filter(q => answers[q.id] !== undefined).length;
                  const isComplete = scaleAnswered === scale.questions.length;
                  return (
                    <div key={i} className="flex items-center justify-between py-2.5 border-t" style={{ borderColor: 'hsl(220 15% 95%)' }}>
                      <span className="text-sm font-medium" style={{ color: 'hsl(220 15% 30%)' }}>{scale.name}</span>
                      <span className={cn("text-xs font-bold px-2.5 py-1 rounded-full")}
                        style={{ background: isComplete ? 'hsl(152 60% 42% / 0.1)' : 'hsl(38 92% 55% / 0.1)', color: isComplete ? 'hsl(152 55% 32%)' : 'hsl(38 70% 35%)' }}>
                        {scaleAnswered}/{scale.questions.length}
                      </span>
                    </div>
                  );
                })}
              </div>
            </div>
            <button onClick={handleSubmit} disabled={submitting || answeredCount < totalQuestions}
              className="w-full flex items-center justify-center gap-2 rounded-2xl text-white py-4 text-sm font-bold transition-all disabled:opacity-40 disabled:cursor-not-allowed"
              style={{ background: answeredCount >= totalQuestions ? `linear-gradient(135deg, hsl(${primaryHsl}), hsl(${primaryHsl} / 0.85))` : 'hsl(220 15% 70%)', boxShadow: answeredCount >= totalQuestions ? `0 8px 30px -8px hsl(${primaryHsl} / 0.4)` : 'none' }}>
              {submitting ? <><Loader2 className="h-4 w-4 animate-spin" /> Enviando...</> : <><CheckCircle2 className="h-4 w-4" /> Enviar Respostas</>}
            </button>
          </div>
        )}
      </main>

      {/* Navigation footer */}
      {step !== "review" && (
        <div className="fixed bottom-0 left-0 right-0 z-40 backdrop-blur-xl border-t" style={{ background: 'hsla(0,0%,100%,0.92)', borderColor: 'hsl(220 15% 92%)' }}>
          <div className="max-w-3xl mx-auto flex items-center justify-between px-4 py-3">
            <button onClick={goPrev} disabled={currentStepIdx === 0}
              className="flex items-center gap-1.5 rounded-xl px-5 py-2.5 text-sm font-semibold transition-all disabled:opacity-25 disabled:cursor-not-allowed"
              style={{ color: 'hsl(220 15% 40%)', background: 'hsl(220 15% 95%)' }}>
              <ChevronLeft className="h-4 w-4" /> Anterior
            </button>
            <button onClick={() => {
              if (step === "password" && passwordInput !== config?.survey_password) {
                setPasswordError(true);
                return;
              }
              goNext();
            }} disabled={!canProceed()}
              className="flex items-center gap-1.5 rounded-xl text-white px-6 py-2.5 text-sm font-bold transition-all disabled:opacity-40 disabled:cursor-not-allowed"
              style={{ background: `hsl(${primaryHsl})`, boxShadow: `0 4px 14px -4px hsl(${primaryHsl} / 0.4)` }}>
              Próximo <ChevronRight className="h-4 w-4" />
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

// ====== Sub-components ======

function SectionHeader({ icon: Icon, title, subtitle, primaryHsl }: { icon: any; title: string; subtitle: string; primaryHsl: string }) {
  return (
    <div className="flex items-start gap-3">
      <div className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0" style={{ background: `hsl(${primaryHsl} / 0.1)` }}>
        <Icon className="h-5 w-5" style={{ color: `hsl(${primaryHsl})` }} />
      </div>
      <div>
        <h2 className="text-xl font-bold" style={{ color: 'hsl(220 30% 12%)' }}>{title}</h2>
        <p className="text-sm mt-0.5" style={{ color: 'hsl(220 10% 55%)' }}>{subtitle}</p>
      </div>
    </div>
  );
}

function FormCard({ title, icon: Icon, children }: { title?: string; icon?: any; children: React.ReactNode }) {
  return (
    <div className="rounded-2xl border p-5 space-y-4" style={{ background: 'hsl(0 0% 100%)', borderColor: 'hsl(220 15% 92%)' }}>
      {title && (
        <div className="flex items-center gap-2 pb-3 border-b" style={{ borderColor: 'hsl(220 15% 95%)' }}>
          {Icon && <Icon className="h-4 w-4" style={{ color: 'hsl(217 71% 45%)' }} />}
          <h3 className="text-sm font-bold" style={{ color: 'hsl(220 30% 15%)' }}>{title}</h3>
        </div>
      )}
      {children}
    </div>
  );
}

function FieldLabel({ label, required }: { label: string; required?: boolean }) {
  return <label className="text-xs font-semibold block" style={{ color: 'hsl(220 15% 40%)' }}>{label}{required && <span style={{ color: 'hsl(0 72% 55%)' }}> *</span>}</label>;
}

function StyledInput({ value, onChange, placeholder }: { value: string; onChange: (v: string) => void; placeholder?: string }) {
  return (
    <input value={value} onChange={e => onChange(e.target.value)} placeholder={placeholder}
      className="w-full rounded-xl border px-4 py-2.5 text-sm focus:outline-none focus:ring-2 transition-all"
      style={{ borderColor: 'hsl(220 15% 90%)', background: 'hsl(220 20% 98%)', color: 'hsl(220 30% 12%)' }} />
  );
}

function StyledSelect({ label, value, onChange, options, required }: { label: string; value: string; onChange: (v: string) => void; options: string[]; required?: boolean }) {
  return (
    <div className="space-y-1.5">
      <FieldLabel label={label} required={required} />
      <select value={value} onChange={e => onChange(e.target.value)}
        className="w-full rounded-xl border px-4 py-2.5 text-sm focus:outline-none focus:ring-2 appearance-none transition-all"
        style={{ borderColor: 'hsl(220 15% 90%)', background: 'hsl(220 20% 98%)', color: value ? 'hsl(220 30% 12%)' : 'hsl(220 10% 60%)' }}>
        <option value="">Selecione...</option>
        {options.map(o => <option key={o} value={o}>{o}</option>)}
      </select>
    </div>
  );
}

function QuestionCard({ question, value, onChange, primaryHsl, accentHsl }: { question: { id: string; number: number; text: string }; value?: number; onChange: (v: number) => void; primaryHsl: string; accentHsl: string }) {
  const isAnswered = value !== undefined;
  return (
    <div className="rounded-2xl border p-4 transition-all duration-200"
      style={{ background: isAnswered ? `hsl(${primaryHsl} / 0.03)` : 'hsl(0 0% 100%)', borderColor: isAnswered ? `hsl(${primaryHsl} / 0.2)` : 'hsl(220 15% 92%)' }}>
      <p className="text-sm mb-3" style={{ color: 'hsl(220 25% 18%)' }}>
        <span className="inline-flex items-center justify-center w-6 h-6 rounded-lg text-xs font-bold text-white mr-2" style={{ background: isAnswered ? `hsl(${accentHsl})` : `hsl(${primaryHsl} / 0.6)` }}>{question.number}</span>
        {question.text}
      </p>
      <div className="flex flex-wrap gap-2">
        {LIKERT_OPTIONS.map(opt => {
          const isSelected = value === opt.value;
          return (
            <button key={opt.value} onClick={() => onChange(opt.value)}
              className="flex-1 min-w-[56px] rounded-xl px-2 py-2 text-center transition-all duration-200 border"
              style={{
                background: isSelected ? `hsl(${primaryHsl})` : 'hsl(220 20% 98%)',
                color: isSelected ? 'white' : 'hsl(220 15% 40%)',
                borderColor: isSelected ? `hsl(${primaryHsl})` : 'hsl(220 15% 90%)',
                boxShadow: isSelected ? `0 4px 12px -4px hsl(${primaryHsl} / 0.35)` : 'none',
                transform: isSelected ? 'scale(1.05)' : 'scale(1)',
              }}>
              <span className="block text-sm font-extrabold">{opt.value}</span>
              <span className="block text-[9px] leading-tight mt-0.5 opacity-80 font-medium">{opt.label}</span>
            </button>
          );
        })}
      </div>
    </div>
  );
}
