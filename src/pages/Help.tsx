import { useState } from "react";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { HelpCircle, Rocket, Building2, FileText, BarChart3, Settings, Info, ChevronDown, ChevronRight, AlertCircle, CheckCircle2 } from "lucide-react";
import { cn } from "@/lib/utils";

type TabId = "inicio" | "empresas" | "pesquisas" | "relatorios" | "configuracoes" | "sobre" | "faq";

const tabs: { id: TabId; label: string; icon: React.ElementType }[] = [
  { id: "inicio", label: "Início Rápido", icon: Rocket },
  { id: "empresas", label: "Empresas", icon: Building2 },
  { id: "pesquisas", label: "Pesquisas", icon: FileText },
  { id: "relatorios", label: "Relatórios", icon: BarChart3 },
  { id: "configuracoes", label: "Configurações", icon: Settings },
  { id: "sobre", label: "Sobre o PROART", icon: Info },
  { id: "faq", label: "FAQ", icon: HelpCircle },
];

interface StepItem {
  num: number;
  title: string;
  desc: string;
}

function StepList({ steps, tip }: { steps: StepItem[]; tip?: { title: string; text: string } }) {
  return (
    <div className="space-y-6">
      <div className="space-y-4">
        {steps.map(s => (
          <div key={s.num} className="flex items-start gap-4">
            <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary text-primary-foreground text-sm font-bold shrink-0">{s.num}</div>
            <div>
              <h4 className="text-sm font-semibold text-foreground">{s.title}</h4>
              <p className="text-xs text-muted-foreground mt-0.5">{s.desc}</p>
            </div>
          </div>
        ))}
      </div>
      {tip && (
        <div className="rounded-lg bg-primary/5 border border-primary/20 p-4 flex items-start gap-3">
          <AlertCircle className="h-5 w-5 text-primary shrink-0 mt-0.5" />
          <div>
            <p className="text-sm font-medium text-foreground">{tip.title}</p>
            <p className="text-xs text-muted-foreground">{tip.text}</p>
          </div>
        </div>
      )}
    </div>
  );
}

const faqItems = [
  { q: "Quantas respostas são necessárias para ter resultados confiáveis?", a: "Recomendamos um mínimo de 10 respondentes para que os resultados sejam estatisticamente significativos. Quanto maior a amostra, mais precisa será a análise dos fatores de risco psicossocial." },
  { q: "As respostas são realmente anônimas?", a: "Sim. Quando a opção de pesquisa anônima está ativada, nenhuma informação que permita identificar o respondente é armazenada. Os dados demográficos são utilizados apenas para análise estatística agregada." },
  { q: "Posso ter mais de uma pesquisa ativa por empresa?", a: "Sim. Cada empresa pode ter múltiplas pesquisas ativas simultaneamente, o que permite avaliar diferentes unidades, turnos ou períodos. Isso é útil para acompanhar a evolução temporal dos indicadores." },
  { q: "Como funciona a classificação de risco do PROART?", a: "O PROART classifica os riscos em 4 níveis: PR1 (Risco Baixo), PR2 (Risco Médio-Baixo), PR3 (Risco Médio-Alto) e PR4 (Risco Alto). A classificação é baseada nas médias das respostas em cada escala e fator avaliado." },
  { q: "Posso exportar os dados?", a: "Sim. Na aba Relatórios, você pode gerar um relatório completo em PDF contendo todas as análises, gráficos e classificações de risco. Os dados também podem ser visualizados em diferentes formatos dentro do sistema." },
  { q: "O que é o PROART?", a: "O PROART (Protocolo de Avaliação dos Riscos Psicossociais no Trabalho) é um instrumento científico validado, desenvolvido para avaliar os fatores de risco psicossocial nas organizações. Ele é composto por 4 escalas com 91 itens que medem diferentes dimensões do ambiente de trabalho." },
  { q: "Como funciona o Plano de Ação?", a: "Após identificar os fatores de risco, o sistema permite criar planos de ação com tarefas, responsáveis e prazos. Cada plano é vinculado a um fator de risco específico, facilitando o acompanhamento das medidas corretivas." },
  { q: "O que significa cada escala do PROART?", a: "EOT (Escala de Organização do Trabalho): avalia ritmo, pressão e divisão de tarefas. EEG (Escala de Estilo de Gestão): avalia liderança e comunicação. EIST (Escala de Indicadores de Sofrimento no Trabalho): avalia esgotamento e insatisfação. EDT (Escala de Danos e Consequências do Trabalho): avalia impactos físicos e psicológicos." },
  { q: "Como os setores são utilizados nas pesquisas?", a: "Os setores cadastrados na empresa aparecem como opção no formulário de pesquisa. Isso permite segmentar os resultados por área, identificando quais setores apresentam maiores riscos e necessitam de atenção prioritária." },
  { q: "Posso acompanhar quem já respondeu a pesquisa?", a: "Sim. Na aba Respondentes, você visualiza em tempo real o status de cada participante: concluído (já finalizou a pesquisa) ou em andamento (abriu o formulário mas ainda não concluiu)." },
];

export default function Help() {
  const [activeTab, setActiveTab] = useState<TabId>("inicio");
  const [openFaq, setOpenFaq] = useState<number | null>(null);

  return (
    <DashboardLayout>
      <div className="animate-fade-in space-y-6">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold text-foreground">Central de Ajuda</h1>
          <p className="text-xs sm:text-sm text-muted-foreground mt-1">Aprenda a usar todas as funcionalidades do SSTudo com nossos guias passo a passo</p>
        </div>

        <div className="flex flex-col md:flex-row gap-6">
          <div className="md:w-56 shrink-0">
            <nav className="flex md:flex-col gap-1 overflow-x-auto md:overflow-visible pb-2 md:pb-0">
              {tabs.map(t => (
                <button key={t.id} onClick={() => setActiveTab(t.id)}
                  className={cn("flex items-center gap-2 rounded-lg px-3 py-2 text-sm font-medium transition-colors whitespace-nowrap",
                    activeTab === t.id ? "bg-primary text-primary-foreground" : "text-muted-foreground hover:bg-muted hover:text-foreground")}>
                  <t.icon className="h-4 w-4" /> {t.label}
                </button>
              ))}
            </nav>
          </div>

          <div className="flex-1 rounded-xl border border-border bg-card p-5 sm:p-6 shadow-card">
            {activeTab === "inicio" && (
              <div className="space-y-6">
                <div>
                  <h3 className="text-lg font-semibold text-card-foreground">Primeiros Passos</h3>
                  <p className="text-sm text-muted-foreground mt-1">Configure o SSTudo em 5 passos simples</p>
                </div>
                <p className="text-sm text-muted-foreground">O SSTudo é uma plataforma completa para diagnóstico e gestão de riscos psicossociais no trabalho, baseada no protocolo PROART. Siga os passos abaixo para começar:</p>
                <StepList
                  steps={[
                    { num: 1, title: "Cadastre uma empresa", desc: "No menu Empresas, clique em 'Nova Empresa' e preencha os dados cadastrais: razão social, CNPJ, contato e endereço. Adicione os setores da empresa para segmentar as respostas." },
                    { num: 2, title: "Crie uma pesquisa", desc: "Acesse Formulários → Novo Formulário. Selecione a empresa, defina o título, período de coleta, instruções e configurações de privacidade (anonimato, senha, LGPD)." },
                    { num: 3, title: "Distribua o link", desc: "Copie o link único gerado pelo sistema e envie aos colaboradores. A pesquisa contém 91 questões do protocolo PROART, acessíveis de qualquer dispositivo sem necessidade de login." },
                    { num: 4, title: "Acompanhe as respostas", desc: "Na aba Respondentes, acompanhe em tempo real quem já respondeu e quem está em andamento. Na Visão Geral, veja os resultados consolidados." },
                    { num: 5, title: "Gere os relatórios", desc: "Após coletar as respostas, acesse Relatórios para gerar o PDF completo com análises estatísticas, classificação de risco e recomendações de ação." },
                  ]}
                  tip={{ title: "Dica importante", text: "Recomendamos ter pelo menos 10 respondentes para que os resultados sejam estatisticamente significativos." }}
                />
              </div>
            )}

            {activeTab === "empresas" && (
              <div className="space-y-6">
                <div>
                  <h3 className="text-lg font-semibold text-card-foreground">Gestão de Empresas</h3>
                  <p className="text-sm text-muted-foreground mt-1">Cadastre e gerencie as empresas avaliadas</p>
                </div>
                <p className="text-sm text-muted-foreground">Na aba Empresas, você gerencia todas as empresas que serão avaliadas pelo sistema SSTudo. Cada empresa pode ter múltiplos formulários e setores cadastrados.</p>
                <StepList
                  steps={[
                    { num: 1, title: "Cadastrar nova empresa", desc: "Clique em 'Nova Empresa' e preencha: Nome Fantasia, CNPJ, Setor de Atuação, Nº de Funcionários, dados de Contato (responsável, e-mail, telefone) e Endereço completo." },
                    { num: 2, title: "Adicionar setores", desc: "Durante o cadastro ou na edição, adicione os setores da empresa (ex: Produção, RH, Administrativo). Esses setores aparecerão como opção de resposta no formulário." },
                    { num: 3, title: "Editar dados", desc: "Clique no ícone de edição ao lado da empresa para alterar qualquer informação: dados básicos, contato, endereço e setores." },
                    { num: 4, title: "Excluir empresa", desc: "Ao excluir uma empresa, todos os formulários e respostas vinculados serão removidos permanentemente." },
                  ]}
                  tip={{ title: "Atenção", text: "Os setores cadastrados são fundamentais para a segmentação dos resultados. Certifique-se de cadastrá-los antes de criar a pesquisa." }}
                />
              </div>
            )}

            {activeTab === "pesquisas" && (
              <div className="space-y-6">
                <div>
                  <h3 className="text-lg font-semibold text-card-foreground">Pesquisas e Formulários</h3>
                  <p className="text-sm text-muted-foreground mt-1">Crie e distribua pesquisas baseadas no PROART</p>
                </div>
                <p className="text-sm text-muted-foreground">O SSTudo utiliza o protocolo PROART com 91 questões distribuídas em 4 escalas. O formulário é preenchido online pelos colaboradores, sem necessidade de login.</p>
                <StepList
                  steps={[
                    { num: 1, title: "Criar formulário", desc: "Acesse Formulários → Novo Formulário. Selecione a empresa, defina título, descrição e instruções personalizadas para os respondentes." },
                    { num: 2, title: "Configurar período e privacidade", desc: "Defina as datas de início e fim da pesquisa. Configure se será anônima, se exigirá senha de acesso e se requer consentimento LGPD." },
                    { num: 3, title: "Copiar e distribuir o link", desc: "Após criar o formulário, copie o link gerado. Envie por e-mail, WhatsApp ou qualquer canal de comunicação da empresa." },
                    { num: 4, title: "Acompanhar respondentes", desc: "Na aba Respondentes, acompanhe em tempo real: quem já concluiu e quem abriu o formulário mas ainda não finalizou." },
                    { num: 5, title: "Gerenciar formulários", desc: "Desative formulários encerrados, baixe relatórios em PDF ou visualize as respostas detalhadas de cada pesquisa." },
                  ]}
                  tip={{ title: "Sobre o formulário", text: "O formulário contém 91 questões do PROART em escala Likert (1 a 5), além de dados demográficos e questões abertas opcionais." }}
                />
              </div>
            )}

            {activeTab === "relatorios" && (
              <div className="space-y-6">
                <div>
                  <h3 className="text-lg font-semibold text-card-foreground">Relatórios e Análises</h3>
                  <p className="text-sm text-muted-foreground mt-1">Gere relatórios completos com classificação de risco</p>
                </div>
                <p className="text-sm text-muted-foreground">O SSTudo oferece diversas visualizações e análises para interpretar os resultados das pesquisas de forma clara e objetiva.</p>
                <StepList
                  steps={[
                    { num: 1, title: "Visão Geral", desc: "Painel principal com KPIs, total de empresas, formulários, respondentes e indicadores de risco consolidados." },
                    { num: 2, title: "Análise por Pergunta", desc: "Visualize a distribuição das respostas por pergunta individual, com gráficos detalhados e filtros por empresa e formulário." },
                    { num: 3, title: "Heatmap de Satisfação", desc: "Mapa de calor que cruza fatores e setores, facilitando a identificação visual de áreas críticas." },
                    { num: 4, title: "Evolução Temporal", desc: "Compare os resultados de diferentes formulários ao longo do tempo para acompanhar a evolução dos indicadores." },
                    { num: 5, title: "Relatório PDF", desc: "Gere um relatório completo em PDF contendo todas as análises, gráficos, classificações de risco e recomendações." },
                  ]}
                  tip={{ title: "Dica", text: "Use os filtros por empresa e formulário para análises mais detalhadas. O Heatmap e a Evolução Temporal são especialmente úteis para identificar tendências." }}
                />
              </div>
            )}

            {activeTab === "configuracoes" && (
              <div className="space-y-6">
                <div>
                  <h3 className="text-lg font-semibold text-card-foreground">Configurações do Sistema</h3>
                  <p className="text-sm text-muted-foreground mt-1">Personalize o SSTudo conforme suas necessidades</p>
                </div>
                <p className="text-sm text-muted-foreground">Gerencie seu perfil, aparência do sistema e configurações gerais.</p>
                <StepList
                  steps={[
                    { num: 1, title: "Perfil", desc: "Atualize seu nome de exibição, cargo e empresa. Altere sua senha de acesso de forma segura." },
                    { num: 2, title: "Aparência", desc: "Escolha entre tema claro, escuro ou automático (segue as configurações do seu sistema operacional)." },
                    { num: 3, title: "Usuários", desc: "Administradores podem gerenciar os usuários do sistema, definindo permissões de acesso por empresa." },
                    { num: 4, title: "Assinatura", desc: "Visualize seu plano atual, limites de uso e recursos disponíveis. Faça upgrade para acessar funcionalidades avançadas." },
                  ]}
                  tip={{ title: "Segurança", text: "Altere sua senha periodicamente e utilize senhas fortes com pelo menos 6 caracteres." }}
                />
              </div>
            )}

            {activeTab === "sobre" && (
              <div className="space-y-6">
                <div>
                  <h3 className="text-lg font-semibold text-card-foreground">Sobre o PROART</h3>
                  <p className="text-sm text-muted-foreground mt-1">Protocolo de Avaliação dos Riscos Psicossociais no Trabalho</p>
                </div>
                <p className="text-sm text-muted-foreground">O <strong>PROART</strong> é um instrumento científico validado, desenvolvido para avaliar os fatores de risco psicossocial nas organizações brasileiras. Ele permite identificar, mensurar e classificar os riscos que afetam a saúde mental e o bem-estar dos trabalhadores.</p>

                <div className="space-y-6">
                  <div>
                    <h4 className="text-sm font-semibold text-foreground mb-3">Escalas do PROART</h4>
                    <div className="space-y-4">
                      {[
                        { num: 1, title: "EOT — Escala de Organização do Trabalho", desc: "Avalia aspectos como ritmo de trabalho, pressão por resultados, divisão e distribuição de tarefas, normas e procedimentos organizacionais." },
                        { num: 2, title: "EEG — Escala de Estilo de Gestão", desc: "Avalia o estilo de liderança, comunicação com a chefia, participação nas decisões, reconhecimento e apoio organizacional." },
                        { num: 3, title: "EIST — Escala de Indicadores de Sofrimento no Trabalho", desc: "Avalia indicadores de esgotamento profissional, falta de reconhecimento, insatisfação no trabalho e falta de sentido no trabalho." },
                        { num: 4, title: "EDT — Escala de Danos e Consequências do Trabalho", desc: "Avalia os danos físicos, psicológicos e sociais decorrentes do trabalho, como dores, insônia, irritabilidade e isolamento social." },
                      ].map(s => (
                        <div key={s.num} className="flex items-start gap-4">
                          <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary text-primary-foreground text-sm font-bold shrink-0">{s.num}</div>
                          <div>
                            <h4 className="text-sm font-semibold text-foreground">{s.title}</h4>
                            <p className="text-xs text-muted-foreground mt-0.5">{s.desc}</p>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>

                  <div>
                    <h4 className="text-sm font-semibold text-foreground mb-3">Classificação de Risco</h4>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      {[
                        { level: "PR1", label: "Risco Baixo", color: "bg-success/10 text-success border-success/20" },
                        { level: "PR2", label: "Risco Médio-Baixo", color: "bg-blue-500/10 text-blue-600 border-blue-500/20" },
                        { level: "PR3", label: "Risco Médio-Alto", color: "bg-warning/10 text-warning border-warning/20" },
                        { level: "PR4", label: "Risco Alto", color: "bg-destructive/10 text-destructive border-destructive/20" },
                      ].map(r => (
                        <div key={r.level} className={cn("rounded-lg border p-3 flex items-center gap-3", r.color)}>
                          <span className="text-sm font-bold">{r.level}</span>
                          <span className="text-sm">{r.label}</span>
                        </div>
                      ))}
                    </div>
                  </div>

                  <div className="rounded-lg bg-primary/5 border border-primary/20 p-4 flex items-start gap-3">
                    <Info className="h-5 w-5 text-primary shrink-0 mt-0.5" />
                    <div>
                      <p className="text-sm font-medium text-foreground">Instrumento validado</p>
                      <p className="text-xs text-muted-foreground">O PROART é composto por 91 itens avaliados em escala Likert de 5 pontos (1 = Nunca a 5 = Sempre), distribuídos em 4 escalas que avaliam diferentes dimensões dos riscos psicossociais no trabalho.</p>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {activeTab === "faq" && (
              <div className="space-y-4">
                <div>
                  <h3 className="text-lg font-semibold text-card-foreground">Perguntas Frequentes</h3>
                  <p className="text-sm text-muted-foreground mt-1">Tire suas dúvidas sobre o SSTudo</p>
                </div>
                <div className="space-y-2">
                  {faqItems.map((item, i) => (
                    <div key={i} className="rounded-lg border border-border overflow-hidden">
                      <button onClick={() => setOpenFaq(openFaq === i ? null : i)}
                        className="w-full flex items-center justify-between p-4 text-left hover:bg-muted/50 transition-colors">
                        <span className="text-sm font-medium text-foreground">{item.q}</span>
                        {openFaq === i ? <ChevronDown className="h-4 w-4 text-muted-foreground shrink-0" /> : <ChevronRight className="h-4 w-4 text-muted-foreground shrink-0" />}
                      </button>
                      {openFaq === i && (
                        <div className="px-4 pb-4 text-sm text-muted-foreground border-t border-border pt-3">{item.a}</div>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}
