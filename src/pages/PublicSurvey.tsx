import { useState, useEffect, useMemo, useCallback } from "react";
import { useParams } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { PROART_QUESTIONS, OPEN_QUESTIONS, LIKERT_OPTIONS, DEMOGRAPHIC_OPTIONS, getQuestionsByScale } from "@/lib/proartQuestions";
import { CheckCircle2, ChevronLeft, ChevronRight, Clock, FileText, Loader2, Lock, Save, Shield, AlertCircle } from "lucide-react";
import { cn } from "@/lib/utils";
import { Progress } from "@/components/ui/progress";

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
  cargo: string;
  tempo_empresa: string;
  sector: string;
  ghe: string;
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
    sex: "", age: "", escolaridade: "", estado_civil: "", cargo: "",
    tempo_empresa: "", sector: "", ghe: "", respondent_name: "",
  });
  const [answers, setAnswers] = useState<Record<string, number>>({});
  const [openAnswers, setOpenAnswers] = useState<Record<string, string>>({});
  const [submitting, setSubmitting] = useState(false);
  const [sectors, setSectors] = useState<string[]>([]);
  const [cargos, setCargos] = useState<string[]>([]);
  const [ghes, setGhes] = useState<string[]>([]);

  const scales = useMemo(() => getQuestionsByScale(), []);
  const totalQuestions = PROART_QUESTIONS.length;
  const answeredCount = Object.keys(answers).length;
  const progress = totalQuestions > 0 ? Math.round((answeredCount / totalQuestions) * 100) : 0;

  // Load form config
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

      // Load sectors/cargos/ghes from existing responses for this company
      const { data: responses } = await supabase
        .from("survey_responses")
        .select("sector, cargo, ghe")
        .eq("config_id", id);
      if (responses) {
        const s = new Set<string>(), c = new Set<string>(), g = new Set<string>();
        responses.forEach((r: any) => { if (r.sector) s.add(r.sector); if (r.cargo) c.add(r.cargo); if (r.ghe) g.add(r.ghe); });
        setSectors(Array.from(s));
        setCargos(Array.from(c));
        setGhes(Array.from(g));
      }

      // Restore saved progress
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

  // Auto-save progress
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
        cargo: demographics.cargo || null,
        tempo_empresa: demographics.tempo_empresa || null,
        ghe: demographics.ghe || null,
        answers: answers as any,
        open_answers: openAnswers as any,
        response_timestamp: new Date().toISOString(),
      }] as any);
      if (err) throw err;
      localStorage.removeItem(STORAGE_KEY_PREFIX + id);
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

  if (loading) return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 flex items-center justify-center">
      <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
    </div>
  );

  if (error) return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-xl p-8 max-w-md text-center">
        <AlertCircle className="h-12 w-12 text-red-500 mx-auto mb-4" />
        <h1 className="text-xl font-bold text-gray-900 mb-2">Pesquisa Indisponível</h1>
        <p className="text-gray-600">{error}</p>
      </div>
    </div>
  );

  if (step === "submitted") return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-xl p-8 max-w-md text-center">
        <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
          <CheckCircle2 className="h-8 w-8 text-green-600" />
        </div>
        <h1 className="text-2xl font-bold text-gray-900 mb-2">Obrigado!</h1>
        <p className="text-gray-600 mb-4">Suas respostas foram enviadas com sucesso. Agradecemos sua participação.</p>
        <p className="text-sm text-gray-400">Você já pode fechar esta página.</p>
      </div>
    </div>
  );

  const steps = buildSteps();
  const currentStepIdx = steps.indexOf(step);
  const totalSteps = steps.length;

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50">
      {/* Header */}
      <header className="sticky top-0 z-50 bg-white/90 backdrop-blur border-b border-gray-200 px-4 py-3">
        <div className="max-w-3xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-blue-600 flex items-center justify-center text-white font-bold text-sm">P</div>
            <div>
              <p className="text-sm font-semibold text-gray-900">proativa</p>
              <p className="text-[10px] text-gray-500">Avaliação de Riscos Psicossociais</p>
            </div>
          </div>
          <span className="text-xs text-gray-500">{answeredCount} de {totalQuestions}</span>
        </div>
      </header>

      {/* Progress bar */}
      {step !== "welcome" && (
        <div className="bg-white border-b border-gray-100 px-4 py-2">
          <div className="max-w-3xl mx-auto">
            <Progress value={progress} className="h-1.5" />
            <div className="flex justify-between mt-1">
              <span className="text-[10px] text-gray-400">Etapa {currentStepIdx + 1} de {totalSteps}</span>
              <span className="text-[10px] text-gray-400">{progress}% concluído</span>
            </div>
          </div>
        </div>
      )}

      {/* Content */}
      <main className="max-w-3xl mx-auto px-4 py-6 pb-32">
        {/* Welcome */}
        {step === "welcome" && (
          <div className="text-center space-y-6">
            <div className="w-20 h-20 bg-blue-100 rounded-2xl flex items-center justify-center mx-auto">
              <FileText className="h-10 w-10 text-blue-600" />
            </div>
            <h1 className="text-2xl font-bold text-gray-900">{config?.form_title || "Avaliação PROART"}</h1>
            <p className="text-gray-600">{config?.description || "Esta pesquisa avalia fatores de risco psicossocial no ambiente de trabalho. Suas respostas são anônimas e confidenciais."}</p>
            <div className="flex justify-center gap-6">
              <div className="text-center p-4 bg-white rounded-xl shadow-sm border border-gray-100">
                <FileText className="h-5 w-5 text-blue-600 mx-auto mb-1" />
                <p className="text-xl font-bold text-gray-900">91</p>
                <p className="text-[10px] text-gray-500 uppercase tracking-wider">Questões</p>
              </div>
              <div className="text-center p-4 bg-white rounded-xl shadow-sm border border-gray-100">
                <Clock className="h-5 w-5 text-blue-600 mx-auto mb-1" />
                <p className="text-xl font-bold text-gray-900">15-20</p>
                <p className="text-[10px] text-gray-500 uppercase tracking-wider">Minutos</p>
              </div>
              <div className="text-center p-4 bg-white rounded-xl shadow-sm border border-gray-100">
                <Save className="h-5 w-5 text-blue-600 mx-auto mb-1" />
                <p className="text-xl font-bold text-gray-900">Auto</p>
                <p className="text-[10px] text-gray-500 uppercase tracking-wider">Salvamento</p>
              </div>
            </div>
            {config?.instructions && (
              <div className="bg-blue-50 border border-blue-200 rounded-xl p-4 text-left">
                <p className="text-sm font-semibold text-blue-800 mb-1 flex items-center gap-1"><AlertCircle className="h-4 w-4" /> Instruções</p>
                <p className="text-sm text-blue-700">{config.instructions}</p>
              </div>
            )}
            <div className="bg-green-50 border border-green-200 rounded-xl p-4 text-left">
              <p className="text-sm font-medium text-green-800 flex items-center gap-1"><Save className="h-4 w-4" /> Suas respostas são salvas automaticamente.</p>
              <p className="text-xs text-green-700 mt-1">Se precisar interromper, você pode voltar depois e continuar de onde parou.</p>
            </div>
          </div>
        )}

        {/* Consent */}
        {step === "consent" && (
          <div className="space-y-6">
            <h2 className="text-xl font-bold text-gray-900 flex items-center gap-2"><Shield className="h-5 w-5 text-blue-600" /> Termo de Consentimento</h2>
            <div className="bg-white rounded-xl border border-gray-200 p-6 space-y-4 text-sm text-gray-700">
              <p>De acordo com a Lei Geral de Proteção de Dados (LGPD - Lei nº 13.709/2018), informamos que:</p>
              <ul className="list-disc pl-5 space-y-2">
                <li>Seus dados serão utilizados exclusivamente para fins de pesquisa organizacional</li>
                <li>As respostas são {config?.is_anonymous ? "anônimas e " : ""}confidenciais</li>
                <li>Os resultados serão apresentados de forma agregada, sem identificação individual</li>
                <li>Você pode interromper a pesquisa a qualquer momento</li>
                <li>Os dados serão armazenados de forma segura e por tempo determinado</li>
              </ul>
            </div>
            <label className="flex items-start gap-3 p-4 bg-white rounded-xl border border-gray-200 cursor-pointer hover:border-blue-300 transition-colors">
              <input type="checkbox" checked={consentAccepted} onChange={e => setConsentAccepted(e.target.checked)}
                className="mt-0.5 h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500" />
              <span className="text-sm text-gray-700">Li e concordo com os termos acima e autorizo o tratamento dos meus dados para os fins descritos.</span>
            </label>
          </div>
        )}

        {/* Password */}
        {step === "password" && (
          <div className="space-y-6">
            <h2 className="text-xl font-bold text-gray-900 flex items-center gap-2"><Lock className="h-5 w-5 text-blue-600" /> Acesso Protegido</h2>
            <p className="text-sm text-gray-600">Esta pesquisa é protegida por senha. Solicite a senha ao responsável.</p>
            <div className="space-y-2">
              <input type="password" value={passwordInput}
                onChange={e => { setPasswordInput(e.target.value); setPasswordError(false); }}
                placeholder="Digite a senha"
                className={cn("w-full rounded-xl border px-4 py-3 text-sm focus:outline-none focus:ring-2 transition",
                  passwordError ? "border-red-300 focus:ring-red-500" : "border-gray-200 focus:ring-blue-500")} />
              {passwordError && <p className="text-xs text-red-500">Senha incorreta</p>}
            </div>
          </div>
        )}

        {/* Demographics */}
        {step === "demographics" && (
          <div className="space-y-6">
            <div>
              <h2 className="text-xl font-bold text-gray-900">Seus Dados</h2>
              <p className="text-sm text-gray-500 mt-1">Informações para identificação e análise</p>
            </div>

            {!config?.is_anonymous && (
              <div className="space-y-1">
                <label className="text-xs font-medium text-gray-700">Nome Completo</label>
                <input value={demographics.respondent_name} onChange={e => setDemographics({ ...demographics, respondent_name: e.target.value })}
                  className="w-full rounded-xl border border-gray-200 px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" placeholder="Seu nome" />
              </div>
            )}

            <div>
              <h3 className="text-sm font-semibold text-gray-800 mb-3">Informações Pessoais</h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <SelectField label="Gênero" required value={demographics.sex} onChange={v => setDemographics({ ...demographics, sex: v })} options={DEMOGRAPHIC_OPTIONS.genero} />
                <SelectField label="Faixa Etária" required value={demographics.age} onChange={v => setDemographics({ ...demographics, age: v })} options={DEMOGRAPHIC_OPTIONS.faixa_etaria} />
                <SelectField label="Escolaridade" required value={demographics.escolaridade} onChange={v => setDemographics({ ...demographics, escolaridade: v })} options={DEMOGRAPHIC_OPTIONS.escolaridade} />
                <SelectField label="Estado Civil" value={demographics.estado_civil} onChange={v => setDemographics({ ...demographics, estado_civil: v })} options={DEMOGRAPHIC_OPTIONS.estado_civil} />
              </div>
            </div>

            <div>
              <h3 className="text-sm font-semibold text-gray-800 mb-3">Informações Profissionais</h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <ComboField label="Cargo" value={demographics.cargo} onChange={v => setDemographics({ ...demographics, cargo: v })} suggestions={cargos} />
                <SelectField label="Tempo na empresa" required value={demographics.tempo_empresa} onChange={v => setDemographics({ ...demographics, tempo_empresa: v })} options={DEMOGRAPHIC_OPTIONS.tempo_empresa} />
                <ComboField label="Setor" required value={demographics.sector} onChange={v => setDemographics({ ...demographics, sector: v })} suggestions={sectors} />
                <ComboField label="Grupo de Trabalho (GHE)" value={demographics.ghe} onChange={v => setDemographics({ ...demographics, ghe: v })} suggestions={ghes} />
              </div>
            </div>
          </div>
        )}

        {/* Scale questions */}
        {step.startsWith("scale-") && (() => {
          const scaleIdx = parseInt(step.split("-")[1]);
          const scale = scales[scaleIdx];
          const scaleAnswered = scale.questions.filter(q => answers[q.id] !== undefined).length;
          return (
            <div className="space-y-6">
              <div>
                <h2 className="text-lg font-bold text-gray-900">{scale.name}</h2>
                <p className="text-sm text-gray-500">{scale.fullName}</p>
                <p className="text-xs text-gray-400 mt-1">{scaleAnswered} de {scale.questions.length} questões respondidas</p>
              </div>
              <div className="space-y-4">
                {scale.questions.map(q => (
                  <QuestionCard key={q.id} question={q} value={answers[q.id]} onChange={v => setAnswer(q.id, v)} />
                ))}
              </div>
            </div>
          );
        })()}

        {/* Open questions */}
        {step === "open" && (
          <div className="space-y-6">
            <div>
              <h2 className="text-xl font-bold text-gray-900">Sua Percepção</h2>
              <p className="text-sm text-gray-500">Respostas livres (opcional, mas muito valiosas)</p>
            </div>
            {OPEN_QUESTIONS.map((q, i) => (
              <div key={q.id} className="bg-white rounded-xl border border-gray-200 p-4 space-y-2">
                <p className="text-sm font-medium text-gray-800">{i + 1}. {q.text}</p>
                {q.hint && <p className="text-xs text-gray-400">{q.hint}</p>}
                <textarea value={openAnswers[q.id] || ""}
                  onChange={e => setOpenAnswers(prev => ({ ...prev, [q.id]: e.target.value }))}
                  className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 min-h-[80px] resize-y"
                  placeholder="Digite sua resposta..." />
              </div>
            ))}
          </div>
        )}

        {/* Review */}
        {step === "review" && (
          <div className="space-y-6">
            <div>
              <h2 className="text-xl font-bold text-gray-900">Revisão</h2>
              <p className="text-sm text-gray-500">Confira suas respostas antes de enviar</p>
            </div>
            <div className="bg-white rounded-xl border border-gray-200 p-4 space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-700">Questões respondidas</span>
                <span className={cn("text-sm font-bold", answeredCount === totalQuestions ? "text-green-600" : "text-red-500")}>{answeredCount}/{totalQuestions}</span>
              </div>
              <Progress value={progress} className="h-2" />
              {answeredCount < totalQuestions && (
                <div className="bg-red-50 border border-red-200 rounded-lg p-3">
                  <p className="text-xs text-red-700 font-medium">Você precisa responder todas as {totalQuestions} questões para enviar.</p>
                  <div className="mt-2 flex flex-wrap gap-1">
                    {PROART_QUESTIONS.filter(q => answers[q.id] === undefined).map(q => (
                      <button key={q.id} onClick={() => {
                        const scaleIdx = scales.findIndex(s => s.id === q.scaleId);
                        setStep(`scale-${scaleIdx}` as Step);
                      }} className="px-2 py-0.5 rounded bg-red-100 text-red-700 text-[10px] font-medium hover:bg-red-200 transition">{q.number}</button>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {scales.map((scale, idx) => {
              const scaleAnswered = scale.questions.filter(q => answers[q.id] !== undefined).length;
              const complete = scaleAnswered === scale.questions.length;
              return (
                <div key={scale.id} className={cn("rounded-xl border p-4 flex items-center justify-between cursor-pointer hover:bg-gray-50 transition",
                  complete ? "border-green-200 bg-green-50/50" : "border-red-200 bg-red-50/50")}
                  onClick={() => setStep(`scale-${idx}` as Step)}>
                  <div>
                    <p className="text-sm font-medium text-gray-800">{scale.name}</p>
                    <p className="text-xs text-gray-500">{scaleAnswered}/{scale.questions.length} questões</p>
                  </div>
                  {complete ? <CheckCircle2 className="h-5 w-5 text-green-500" /> : <AlertCircle className="h-5 w-5 text-red-400" />}
                </div>
              );
            })}
          </div>
        )}
      </main>

      {/* Bottom navigation */}
      {step !== "submitted" && (
        <div className="fixed bottom-0 left-0 right-0 bg-white/95 backdrop-blur border-t border-gray-200 px-4 py-3 z-50">
          <div className="max-w-3xl mx-auto flex items-center justify-between gap-3">
            {step !== "welcome" ? (
              <button onClick={goPrev} className="flex items-center gap-1 px-4 py-2.5 rounded-xl border border-gray-200 text-sm font-medium text-gray-700 hover:bg-gray-50 transition">
                <ChevronLeft className="h-4 w-4" /> Voltar
              </button>
            ) : <div />}

            {step === "review" ? (
              <button onClick={handleSubmit} disabled={submitting || answeredCount < totalQuestions}
                className="flex items-center gap-2 px-6 py-2.5 rounded-xl bg-blue-600 text-white text-sm font-medium hover:bg-blue-700 disabled:opacity-50 transition">
                {submitting ? <Loader2 className="h-4 w-4 animate-spin" /> : <CheckCircle2 className="h-4 w-4" />}
                Enviar Respostas
              </button>
            ) : (
              <button onClick={() => {
                if (step === "password" && passwordInput !== config?.survey_password) {
                  setPasswordError(true);
                  return;
                }
                goNext();
              }} disabled={!canProceed()}
                className="flex items-center gap-1 px-6 py-2.5 rounded-xl bg-blue-600 text-white text-sm font-medium hover:bg-blue-700 disabled:opacity-50 transition">
                {step === "welcome" ? "Começar Pesquisa" : "Continuar"} <ChevronRight className="h-4 w-4" />
              </button>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

// ---- Sub-components ----

function SelectField({ label, value, onChange, options, required }: {
  label: string; value: string; onChange: (v: string) => void; options: string[]; required?: boolean;
}) {
  return (
    <div className="space-y-1">
      <label className="text-xs font-medium text-gray-700">{label} {required && <span className="text-red-500">*</span>}</label>
      <select value={value} onChange={e => onChange(e.target.value)}
        className="w-full rounded-xl border border-gray-200 bg-white px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 transition">
        <option value="">Selecione...</option>
        {options.map(o => <option key={o} value={o}>{o}</option>)}
      </select>
    </div>
  );
}

function ComboField({ label, value, onChange, suggestions, required }: {
  label: string; value: string; onChange: (v: string) => void; suggestions: string[]; required?: boolean;
}) {
  const [focused, setFocused] = useState(false);
  const filtered = suggestions.filter(s => s.toLowerCase().includes(value.toLowerCase()));
  return (
    <div className="space-y-1 relative">
      <label className="text-xs font-medium text-gray-700">{label} {required && <span className="text-red-500">*</span>}</label>
      <input value={value} onChange={e => onChange(e.target.value)}
        onFocus={() => setFocused(true)} onBlur={() => setTimeout(() => setFocused(false), 200)}
        className="w-full rounded-xl border border-gray-200 bg-white px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 transition"
        placeholder={`Selecione seu ${label.toLowerCase()}...`} />
      {focused && filtered.length > 0 && (
        <div className="absolute z-10 top-full left-0 right-0 mt-1 bg-white border border-gray-200 rounded-xl shadow-lg max-h-32 overflow-auto">
          {filtered.map(s => (
            <button key={s} onMouseDown={() => onChange(s)} className="w-full text-left px-3 py-2 text-sm hover:bg-blue-50 transition">{s}</button>
          ))}
        </div>
      )}
    </div>
  );
}

function QuestionCard({ question, value, onChange }: {
  question: { id: string; number: number; text: string }; value: number | undefined; onChange: (v: number) => void;
}) {
  return (
    <div className={cn("bg-white rounded-xl border p-4 transition-all",
      value !== undefined ? "border-blue-200 shadow-sm" : "border-gray-200")}>
      <div className="flex gap-3 mb-3">
        <span className={cn("shrink-0 w-7 h-7 rounded-lg flex items-center justify-center text-xs font-bold",
          value !== undefined ? "bg-blue-600 text-white" : "bg-gray-100 text-gray-500")}>{question.number}</span>
        <p className="text-sm text-gray-800 pt-1">{question.text}</p>
      </div>
      <div className="flex gap-1.5 sm:gap-2">
        {LIKERT_OPTIONS.map(opt => (
          <button key={opt.value} onClick={() => onChange(opt.value)}
            className={cn("flex-1 flex flex-col items-center gap-0.5 rounded-lg py-2 px-1 text-center transition-all border",
              value === opt.value
                ? "bg-blue-600 text-white border-blue-600 shadow-md scale-[1.02]"
                : "bg-gray-50 text-gray-600 border-gray-200 hover:border-blue-300 hover:bg-blue-50")}>
            <span className="text-[10px] sm:text-xs font-medium leading-tight">{opt.label}</span>
            <span className="text-[9px] sm:text-[10px] opacity-70">{opt.percent}</span>
          </button>
        ))}
      </div>
    </div>
  );
}
