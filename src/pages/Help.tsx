import { useState } from "react";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { HelpCircle, Rocket, Building2, FileText, BarChart3, Settings, Info, ChevronDown, ChevronRight, AlertCircle } from "lucide-react";
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

const steps = [
  { num: 1, title: "Configure os dados básicos", desc: "Acesse Setores, Grupos de Trabalho e Unidades no menu de Configurações para cadastrar as opções que aparecerão no formulário de pesquisa." },
  { num: 2, title: "Cadastre uma empresa", desc: "No menu Empresas, clique em Nova Empresa e preencha os dados da empresa que será avaliada (razão social, CNPJ, número de funcionários, etc)." },
  { num: 3, title: "Crie uma pesquisa", desc: "Acesse Formulários → Novo Formulário. Selecione a empresa, defina o título, período de coleta e ative a pesquisa." },
  { num: 4, title: "Distribua o link", desc: "Copie o link único gerado pelo sistema e envie aos colaboradores da empresa. Eles responderão de forma anônima através de qualquer dispositivo." },
  { num: 5, title: "Gere os relatórios", desc: "Após coletar as respostas, acesse Relatórios para gerar o PDF completo com análises estatísticas, classificação de risco e recomendações." },
];

const faqItems = [
  { q: "Quantas respostas são necessárias para ter resultados confiáveis?", a: "Recomendamos um mínimo de 10 respondentes para que os resultados sejam estatisticamente significativos." },
  { q: "As respostas são realmente anônimas?", a: "Sim, quando a opção de pesquisa anônima está ativada, não é possível identificar individualmente os respondentes." },
  { q: "Posso ter mais de uma pesquisa ativa por empresa?", a: "Sim, cada empresa pode ter múltiplas pesquisas ativas simultaneamente, permitindo avaliar diferentes unidades ou períodos." },
  { q: "Como funciona a Matriz de Risco P×S?", a: "A Matriz de Risco combina a Probabilidade (frequência das respostas negativas) com a Severidade (intensidade do impacto) para classificar cada fator de risco." },
  { q: "Posso exportar os dados em Excel?", a: "Sim, na aba Relatórios você pode exportar os dados em formato Excel (.xlsx) além do relatório em PDF." },
  { q: "O que é o PROART?", a: "O PROART (Protocolo de Avaliação dos Riscos Psicossociais no Trabalho) é um instrumento validado cientificamente para avaliar os riscos psicossociais no ambiente de trabalho." },
];

export default function Help() {
  const [activeTab, setActiveTab] = useState<TabId>("inicio");
  const [openFaq, setOpenFaq] = useState<number | null>(null);

  return (
    <DashboardLayout>
      <div className="animate-fade-in space-y-6">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold text-foreground">Central de Ajuda</h1>
          <p className="text-xs sm:text-sm text-muted-foreground mt-1">Aprenda a usar todas as funcionalidades do sistema PROART com nossos guias passo a passo</p>
        </div>

        <div className="flex flex-col md:flex-row gap-6">
          {/* Tabs */}
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

          {/* Content */}
          <div className="flex-1 rounded-xl border border-border bg-card p-5 sm:p-6 shadow-card">
            {activeTab === "inicio" && (
              <div className="space-y-6">
                <div>
                  <h3 className="text-lg font-semibold text-card-foreground">Primeiros Passos</h3>
                  <p className="text-sm text-muted-foreground mt-1">Configure o sistema em 5 minutos</p>
                </div>
                <p className="text-sm text-muted-foreground">O PROART é um sistema completo para avaliação de riscos psicossociais no trabalho. Siga os passos abaixo para começar:</p>
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
                <div className="rounded-lg bg-primary/5 border border-primary/20 p-4 flex items-start gap-3">
                  <AlertCircle className="h-5 w-5 text-primary shrink-0 mt-0.5" />
                  <div>
                    <p className="text-sm font-medium text-foreground">Dica importante</p>
                    <p className="text-xs text-muted-foreground">Recomendamos ter pelo menos <strong>10 respondentes</strong> para que os resultados sejam estatisticamente significativos.</p>
                  </div>
                </div>
              </div>
            )}

            {activeTab === "empresas" && (
              <div className="space-y-4">
                <h3 className="text-lg font-semibold text-card-foreground">Gestão de Empresas</h3>
                <div className="space-y-3 text-sm text-muted-foreground">
                  <p>Na aba <strong>Empresas</strong>, você pode cadastrar e gerenciar todas as empresas que serão avaliadas pelo sistema.</p>
                  <h4 className="font-semibold text-foreground">Como cadastrar:</h4>
                  <ol className="list-decimal list-inside space-y-1 ml-2">
                    <li>Clique em "Nova Empresa"</li>
                    <li>Preencha os dados: Nome fantasia, CNPJ, Contato, Endereço</li>
                    <li>Adicione os setores da empresa (Produção, Administrativo, RH, etc.)</li>
                    <li>Clique em "Salvar"</li>
                  </ol>
                  <h4 className="font-semibold text-foreground">Setores:</h4>
                  <p>Os setores cadastrados serão utilizados no formulário de pesquisa para segmentar os respondentes.</p>
                </div>
              </div>
            )}

            {activeTab === "pesquisas" && (
              <div className="space-y-4">
                <h3 className="text-lg font-semibold text-card-foreground">Pesquisas</h3>
                <div className="space-y-3 text-sm text-muted-foreground">
                  <p>Na aba <strong>Formulários</strong>, crie e gerencie suas pesquisas de avaliação.</p>
                  <h4 className="font-semibold text-foreground">Criando uma pesquisa:</h4>
                  <ol className="list-decimal list-inside space-y-1 ml-2">
                    <li>Selecione a empresa</li>
                    <li>Defina o título e descrição</li>
                    <li>Configure período, anonimato, CPF e LGPD</li>
                    <li>Copie e distribua o link</li>
                  </ol>
                  <h4 className="font-semibold text-foreground">Acompanhamento:</h4>
                  <p>Na aba <strong>Respondentes</strong>, acompanhe em tempo real quem já respondeu, quem está em andamento e quem ainda não iniciou.</p>
                </div>
              </div>
            )}

            {activeTab === "relatorios" && (
              <div className="space-y-4">
                <h3 className="text-lg font-semibold text-card-foreground">Relatórios</h3>
                <div className="space-y-3 text-sm text-muted-foreground">
                  <p>Gere relatórios completos em PDF com análises estatísticas e recomendações.</p>
                  <h4 className="font-semibold text-foreground">O relatório inclui:</h4>
                  <ul className="list-disc list-inside space-y-1 ml-2">
                    <li>Médias por escala e fator</li>
                    <li>Classificação de risco</li>
                    <li>Plano de ação (quando cadastrado)</li>
                    <li>Gráficos e visualizações</li>
                    <li>Métricas demográficas</li>
                  </ul>
                </div>
              </div>
            )}

            {activeTab === "configuracoes" && (
              <div className="space-y-4">
                <h3 className="text-lg font-semibold text-card-foreground">Configurações</h3>
                <div className="space-y-3 text-sm text-muted-foreground">
                  <p>Personalize o sistema de acordo com suas preferências.</p>
                  <h4 className="font-semibold text-foreground">Disponível:</h4>
                  <ul className="list-disc list-inside space-y-1 ml-2">
                    <li><strong>Perfil:</strong> Atualize seu nome, cargo e empresa</li>
                    <li><strong>Aparência:</strong> Escolha entre tema claro, escuro ou automático</li>
                    <li><strong>Geral:</strong> Informações sobre a versão do sistema</li>
                  </ul>
                </div>
              </div>
            )}

            {activeTab === "sobre" && (
              <div className="space-y-4">
                <h3 className="text-lg font-semibold text-card-foreground">Sobre o PROART</h3>
                <div className="space-y-3 text-sm text-muted-foreground">
                  <p>O <strong>PROART</strong> (Protocolo de Avaliação dos Riscos Psicossociais no Trabalho) é um instrumento científico validado para avaliar fatores de risco psicossocial em organizações.</p>
                  <h4 className="font-semibold text-foreground">Escalas avaliadas:</h4>
                  <ul className="list-disc list-inside space-y-1 ml-2">
                    <li><strong>ECO:</strong> Escala de Condições de Trabalho</li>
                    <li><strong>EOT:</strong> Escala de Organização do Trabalho</li>
                    <li><strong>ESRT:</strong> Escala de Socioprofissionais e Relações de Trabalho</li>
                    <li><strong>ERS:</strong> Escala de Reconhecimento e Segurança</li>
                  </ul>
                  <p>Cada escala contém fatores específicos que são avaliados em uma escala Likert de 1 a 5.</p>
                </div>
              </div>
            )}

            {activeTab === "faq" && (
              <div className="space-y-4">
                <h3 className="text-lg font-semibold text-card-foreground">Perguntas Frequentes</h3>
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
