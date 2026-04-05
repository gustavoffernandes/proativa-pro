import { useState, useEffect, useCallback } from "react";
import introJs from "intro.js";
import "intro.js/introjs.css";
import type { AppRole } from "@/contexts/AuthContext";

const ONBOARDING_KEY = "proativa_onboarding_done";

interface OnboardingStep {
  id: string;
  title: string;
  description: string;
  position: string;
  adminOnly?: boolean;
  hideForCompanyUser?: boolean;
}

const welcomeStep = {
  id: "sidebar-logo",
  title: "Bem-vindo ao PROATIVA",
  description: "Vamos fazer um tour rápido pelas funcionalidades disponíveis para você no sistema.",
  position: "right",
};

const allSteps: OnboardingStep[] = [
  {
    id: "menu-visao-geral",
    title: "Visão Geral",
    description: "Painel principal com KPIs, gráficos de fatores de risco e métricas consolidadas de todas as pesquisas.",
    position: "right",
  },
  {
    id: "menu-analise",
    title: "Análise por Pergunta",
    description: "Visualize a distribuição das respostas por pergunta individual, com gráficos detalhados e filtros por empresa e formulário.",
    position: "right",
  },
  {
    id: "menu-empresas",
    title: "Comparação de Empresas",
    description: "Compare os resultados entre diferentes empresas cadastradas, identificando pontos fortes e áreas de melhoria em cada uma.",
    position: "right",
    hideForCompanyUser: true,
  },
  {
    id: "menu-demografico",
    title: "Perfil Demográfico",
    description: "Analise a distribuição demográfica dos respondentes por idade, sexo, setor e outros critérios.",
    position: "right",
  },
  {
    id: "menu-heatmap",
    title: "Heatmap de Satisfação",
    description: "Mapa de calor que cruza fatores e setores da empresa, facilitando a identificação visual de áreas críticas.",
    position: "right",
  },
  {
    id: "menu-evolucao",
    title: "Evolução Temporal",
    description: "Acompanhe a evolução dos resultados ao longo do tempo, comparando diferentes formulários e períodos.",
    position: "right",
  },
  {
    id: "menu-relatorios",
    title: "Relatórios",
    description: "Exporte relatórios completos em PDF contendo todos os dados, gráficos e análises da pesquisa.",
    position: "right",
  },
  {
    id: "menu-plano-acao",
    title: "Plano de Ação",
    description: "Crie e acompanhe planos de ação baseados nos riscos identificados, com tarefas, responsáveis e prazos.",
    position: "right",
  },
  {
    id: "menu-notas",
    title: "Bloco de Notas",
    description: "Registre observações, anotações e insights relevantes sobre cada empresa analisada.",
    position: "right",
    hideForCompanyUser: true,
  },
  {
    id: "menu-empresas-cadastro",
    title: "Empresas",
    description: "Gerencie o cadastro de empresas, incluindo dados de contato, setor de atuação e informações complementares.",
    position: "right",
    adminOnly: true,
  },
  {
    id: "menu-integracoes",
    title: "Integrações",
    description: "Configure a sincronização com Google Sheets para importar automaticamente as respostas dos formulários.",
    position: "right",
    adminOnly: true,
  },
  {
    id: "menu-configuracoes",
    title: "Configurações",
    description: "Gerencie usuários, permissões de acesso e demais configurações do sistema.",
    position: "right",
  },
];

function getStepsForRole(role: AppRole | null) {
  return allSteps.filter((step) => {
    if (step.adminOnly && role !== "admin") return false;
    if (step.hideForCompanyUser && role === "company_user") return false;
    return true;
  });
}

export function useOnboarding(userId: string | undefined, role: AppRole | null) {
  const [shouldRun, setShouldRun] = useState(false);

  useEffect(() => {
    if (!userId || role === null) return;
    const key = `${ONBOARDING_KEY}_${userId}`;
    const done = localStorage.getItem(key);
    if (!done) {
      const timer = setTimeout(() => setShouldRun(true), 800);
      return () => clearTimeout(timer);
    }
  }, [userId, role]);

  const startTour = useCallback(() => {
    if (!userId) return;

    const visibleSteps = getStepsForRole(role);

    const introSteps = [
      {
        element: `[data-onboarding="${welcomeStep.id}"]`,
        intro: `
          <div style="text-align:center">
            <h3 style="margin:0 0 8px;font-weight:700;font-size:16px">${welcomeStep.title}</h3>
            <p style="margin:0;font-size:13px;opacity:0.85">${welcomeStep.description}</p>
          </div>
        `,
        position: welcomeStep.position as "right",
      },
      ...visibleSteps.map((step) => ({
        element: `[data-onboarding="${step.id}"]`,
        intro: `
          <h3 style="margin:0 0 6px;font-weight:700;font-size:14px">${step.title}</h3>
          <p style="margin:0;font-size:13px;line-height:1.5">${step.description}</p>
        `,
        position: step.position as "right",
      })),
    ];

    const intro = introJs();
    intro.setOptions({
      steps: introSteps,
      showProgress: true,
      showBullets: true,
      exitOnOverlayClick: false,
      showStepNumbers: false,
      nextLabel: "Próximo →",
      prevLabel: "← Anterior",
      doneLabel: "Concluir",
      skipLabel: "Pular",
      tooltipClass: "proativa-onboarding-tooltip",
      highlightClass: "proativa-onboarding-highlight",
      overlayOpacity: 0.6,
      disableInteraction: true,
      scrollToElement: true,
      scrollTo: "tooltip",
    });

    intro.oncomplete(() => {
      localStorage.setItem(`${ONBOARDING_KEY}_${userId}`, "true");
      setShouldRun(false);
    });

    intro.onexit(() => {
      localStorage.setItem(`${ONBOARDING_KEY}_${userId}`, "true");
      setShouldRun(false);
    });

    intro.start();
  }, [userId, role]);

  useEffect(() => {
    if (shouldRun) {
      startTour();
    }
  }, [shouldRun, startTour]);

  const restartTour = useCallback(() => {
    if (userId) {
      localStorage.removeItem(`${ONBOARDING_KEY}_${userId}`);
      startTour();
    }
  }, [userId, startTour]);

  return { restartTour };
}
