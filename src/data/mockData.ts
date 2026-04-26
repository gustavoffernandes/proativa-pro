// SSTudo Survey Structure & Data

export interface Question {
  id: string;
  section: string;
  sectionIndex: number;
  number: number;
  text: string;
}

export interface Company {
  id: string;
  name: string;
  sector: string;
  employees: number;
  color: string;
}

export interface Respondent {
  id: string;
  configId?: string;
  companyId: string;
  name: string;
  sex: "Masculino" | "Feminino" | "Prefiro não declarar";
  age: number;
  sector: string;
  answers: Record<string, number>;
  comment?: string;
  responseTimestamp?: string | null;
}

export const sections = [
  { id: "contexto", name: "Organização do Trabalho (EOT)", shortName: "EOT" },
  { id: "gestao", name: "Estilos de Gestão (EEG)", shortName: "EEG" },
  { id: "vivencias", name: "Indicadores de Sofrimento (EIST)", shortName: "EIST" },
  { id: "saude", name: "Danos Relacionados ao Trabalho (EDT)", shortName: "EDT" },
];

export const questions: Question[] = [
  { id: "c1", section: "contexto", sectionIndex: 0, number: 1, text: "O número de trabalhadores é suficiente para a execução das tarefas" },
  { id: "c2", section: "contexto", sectionIndex: 0, number: 2, text: "Os recursos de trabalho são em número suficiente" },
  { id: "c3", section: "contexto", sectionIndex: 0, number: 3, text: "O espaço físico disponível é adequado" },
  { id: "c4", section: "contexto", sectionIndex: 0, number: 4, text: "Os equipamentos são adequados" },
  { id: "c5", section: "contexto", sectionIndex: 0, number: 5, text: "O ritmo de trabalho é adequado" },
  { id: "c6", section: "contexto", sectionIndex: 0, number: 6, text: "Os prazos são flexíveis" },
  { id: "c7", section: "contexto", sectionIndex: 0, number: 7, text: "Condições adequadas para resultados esperados" },
  { id: "c8", section: "contexto", sectionIndex: 0, number: 8, text: "Há clareza na definição das tarefas" },
  { id: "c9", section: "contexto", sectionIndex: 0, number: 9, text: "Há justiça na distribuição das tarefas" },
  { id: "c10", section: "contexto", sectionIndex: 0, number: 10, text: "Funcionários participam das decisões" },
  { id: "c11", section: "contexto", sectionIndex: 0, number: 11, text: "Comunicação chefe-subordinado adequada" },
  { id: "c12", section: "contexto", sectionIndex: 0, number: 12, text: "Autonomia para realizar tarefas" },
  { id: "c13", section: "contexto", sectionIndex: 0, number: 13, text: "Qualidade na comunicação entre funcionários" },
  { id: "c14", section: "contexto", sectionIndex: 0, number: 14, text: "Informações claras para executar tarefas" },
  { id: "c15", section: "contexto", sectionIndex: 0, number: 15, text: "Avaliação inclui aspectos além da produção" },
  { id: "c16", section: "contexto", sectionIndex: 0, number: 16, text: "Flexibilidade nas normas" },
  { id: "c17", section: "contexto", sectionIndex: 0, number: 17, text: "Orientações coerentes entre si" },
  { id: "c18", section: "contexto", sectionIndex: 0, number: 18, text: "Tarefas variadas" },
  { id: "c19", section: "contexto", sectionIndex: 0, number: 19, text: "Liberdade para opinar sobre o trabalho" },
  { id: "g1", section: "gestao", sectionIndex: 1, number: 1, text: "Incentiva-se a idolatria dos chefes" },
  { id: "g2", section: "gestao", sectionIndex: 1, number: 2, text: "Gestores se consideram insubstituíveis" },
  { id: "g3", section: "gestao", sectionIndex: 1, number: 3, text: "Gestores preferem trabalhar individualmente" },
  { id: "g4", section: "gestao", sectionIndex: 1, number: 4, text: "Gestores se consideram o centro do mundo" },
  { id: "g5", section: "gestao", sectionIndex: 1, number: 5, text: "Gestores fazem qualquer coisa para chamar atenção" },
  { id: "g6", section: "gestao", sectionIndex: 1, number: 6, text: "Grande importância para as regras" },
  { id: "g7", section: "gestao", sectionIndex: 1, number: 7, text: "Hierarquia é valorizada" },
  { id: "g8", section: "gestao", sectionIndex: 1, number: 8, text: "Laços afetivos fracos" },
  { id: "g9", section: "gestao", sectionIndex: 1, number: 9, text: "Forte controle do trabalho" },
  { id: "g10", section: "gestao", sectionIndex: 1, number: 10, text: "Ambiente se desorganiza com mudanças" },
  { id: "g11", section: "gestao", sectionIndex: 1, number: 11, text: "Pessoas comprometidas sem retorno adequado" },
  { id: "g12", section: "gestao", sectionIndex: 1, number: 12, text: "Mérito das conquistas é de todos" },
  { id: "g13", section: "gestao", sectionIndex: 1, number: 13, text: "Trabalho coletivo valorizado" },
  { id: "g14", section: "gestao", sectionIndex: 1, number: 14, text: "Resultado visto como realização do grupo" },
  { id: "g15", section: "gestao", sectionIndex: 1, number: 15, text: "Decisões tomadas em grupo" },
  { id: "g16", section: "gestao", sectionIndex: 1, number: 16, text: "Incentivo a buscar novos desafios" },
  { id: "g17", section: "gestao", sectionIndex: 1, number: 17, text: "Trabalho interativo entre áreas" },
  { id: "g18", section: "gestao", sectionIndex: 1, number: 18, text: "Competência valorizada pela gestão" },
  { id: "g19", section: "gestao", sectionIndex: 1, number: 19, text: "Oportunidades semelhantes de ascensão" },
  { id: "g20", section: "gestao", sectionIndex: 1, number: 20, text: "Gestores preocupados com bem-estar" },
  { id: "g21", section: "gestao", sectionIndex: 1, number: 21, text: "Inovação é valorizada" },
  { id: "v1", section: "vivencias", sectionIndex: 2, number: 1, text: "Sinto-me inútil no trabalho" },
  { id: "v2", section: "vivencias", sectionIndex: 2, number: 2, text: "Tarefas insignificantes" },
  { id: "v3", section: "vivencias", sectionIndex: 2, number: 3, text: "Sinto-me improdutivo" },
  { id: "v4", section: "vivencias", sectionIndex: 2, number: 4, text: "Identificação com tarefas inexistente" },
  { id: "v5", section: "vivencias", sectionIndex: 2, number: 5, text: "Desmotivado para tarefas" },
  { id: "v6", section: "vivencias", sectionIndex: 2, number: 6, text: "Trabalho irrelevante para a sociedade" },
  { id: "v7", section: "vivencias", sectionIndex: 2, number: 7, text: "Trabalho sem sentido" },
  { id: "v8", section: "vivencias", sectionIndex: 2, number: 8, text: "Tarefas banais" },
  { id: "v9", section: "vivencias", sectionIndex: 2, number: 9, text: "Permanece por falta de oportunidade" },
  { id: "v10", section: "vivencias", sectionIndex: 2, number: 10, text: "Trabalho cansativo" },
  { id: "v11", section: "vivencias", sectionIndex: 2, number: 11, text: "Trabalho desgastante" },
  { id: "v12", section: "vivencias", sectionIndex: 2, number: 12, text: "Trabalho frustrante" },
  { id: "v13", section: "vivencias", sectionIndex: 2, number: 13, text: "Trabalho sobrecarrega" },
  { id: "v14", section: "vivencias", sectionIndex: 2, number: 14, text: "Trabalho desanima" },
  { id: "v15", section: "vivencias", sectionIndex: 2, number: 15, text: "Decisões políticas causam revolta" },
  { id: "v16", section: "vivencias", sectionIndex: 2, number: 16, text: "Trabalho causa sofrimento" },
  { id: "v17", section: "vivencias", sectionIndex: 2, number: 17, text: "Trabalho causa insatisfação" },
  { id: "v18", section: "vivencias", sectionIndex: 2, number: 18, text: "Trabalho desvalorizado pela organização" },
  { id: "v19", section: "vivencias", sectionIndex: 2, number: 19, text: "Submissão do chefe causa revolta" },
  { id: "v20", section: "vivencias", sectionIndex: 2, number: 20, text: "Colegas desvalorizam meu trabalho" },
  { id: "v21", section: "vivencias", sectionIndex: 2, number: 21, text: "Falta liberdade para dizer o que pensa" },
  { id: "v22", section: "vivencias", sectionIndex: 2, number: 22, text: "Colegas indiferentes" },
  { id: "v23", section: "vivencias", sectionIndex: 2, number: 23, text: "Excluído do planejamento" },
  { id: "v24", section: "vivencias", sectionIndex: 2, number: 24, text: "Chefia trata com indiferença" },
  { id: "v25", section: "vivencias", sectionIndex: 2, number: 25, text: "Difícil convivência com colegas" },
  { id: "v26", section: "vivencias", sectionIndex: 2, number: 26, text: "Trabalho desqualificado pela chefia" },
  { id: "v27", section: "vivencias", sectionIndex: 2, number: 27, text: "Falta liberdade para dialogar com chefia" },
  { id: "v28", section: "vivencias", sectionIndex: 2, number: 28, text: "Desconfiança entre chefia e subordinado" },
  { id: "s1", section: "saude", sectionIndex: 3, number: 1, text: "Amargura" },
  { id: "s2", section: "saude", sectionIndex: 3, number: 2, text: "Sensação de vazio" },
  { id: "s3", section: "saude", sectionIndex: 3, number: 3, text: "Mau-humor" },
  { id: "s4", section: "saude", sectionIndex: 3, number: 4, text: "Vontade de desistir de tudo" },
  { id: "s5", section: "saude", sectionIndex: 3, number: 5, text: "Tristeza" },
  { id: "s6", section: "saude", sectionIndex: 3, number: 6, text: "Perda da autoconfiança" },
  { id: "s7", section: "saude", sectionIndex: 3, number: 7, text: "Solidão" },
  { id: "s8", section: "saude", sectionIndex: 3, number: 8, text: "Insensibilidade com colegas" },
  { id: "s9", section: "saude", sectionIndex: 3, number: 9, text: "Dificuldades fora do trabalho" },
  { id: "s10", section: "saude", sectionIndex: 3, number: 10, text: "Vontade de ficar sozinho" },
  { id: "s11", section: "saude", sectionIndex: 3, number: 11, text: "Conflitos familiares" },
  { id: "s12", section: "saude", sectionIndex: 3, number: 12, text: "Agressividade" },
  { id: "s13", section: "saude", sectionIndex: 3, number: 13, text: "Dificuldade com amigos" },
  { id: "s14", section: "saude", sectionIndex: 3, number: 14, text: "Impaciência com pessoas" },
  { id: "s15", section: "saude", sectionIndex: 3, number: 15, text: "Dores no corpo" },
  { id: "s16", section: "saude", sectionIndex: 3, number: 16, text: "Dores no braço" },
  { id: "s17", section: "saude", sectionIndex: 3, number: 17, text: "Dor de cabeça" },
  { id: "s18", section: "saude", sectionIndex: 3, number: 18, text: "Distúrbios digestivos" },
  { id: "s19", section: "saude", sectionIndex: 3, number: 19, text: "Dores nas costas" },
  { id: "s20", section: "saude", sectionIndex: 3, number: 20, text: "Alterações no sono" },
  { id: "s21", section: "saude", sectionIndex: 3, number: 21, text: "Dores nas pernas" },
  { id: "s22", section: "saude", sectionIndex: 3, number: 22, text: "Distúrbios circulatórios" },
  { id: "s23", section: "saude", sectionIndex: 3, number: 23, text: "Alterações no apetite" },
];

export const companies: Company[] = [
  { id: "emp1", name: "TechSol Ltda", sector: "Tecnologia", employees: 120, color: "hsl(217, 71%, 45%)" },
  { id: "emp2", name: "Construtora Horizonte", sector: "Construção Civil", employees: 350, color: "hsl(170, 60%, 45%)" },
  { id: "emp3", name: "Indústria MetalForte", sector: "Indústria", employees: 200, color: "hsl(38, 92%, 55%)" },
  { id: "emp4", name: "Hospital São Lucas", sector: "Saúde", employees: 500, color: "hsl(280, 60%, 55%)" },
  { id: "emp5", name: "Logística Express", sector: "Logística", employees: 180, color: "hsl(0, 72%, 55%)" },
];

const sectorsList = ["Administrativo", "Operacional", "Comercial", "RH", "TI", "Financeiro", "Produção"];

function randomInt(min: number, max: number): number {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

function generateAnswers(bias: number): Record<string, number> {
  const answers: Record<string, number> = {};
  questions.forEach((q) => {
    const isNegative = q.section === "vivencias" || q.section === "saude" ||
      ["g1","g2","g3","g4","g5","g8","g9","g10"].includes(q.id);
    if (isNegative) {
      answers[q.id] = Math.max(1, Math.min(5, randomInt(1, 3) + Math.round((5 - bias) * 0.3)));
    } else {
      answers[q.id] = Math.max(1, Math.min(5, randomInt(2, 5) - Math.round((5 - bias) * 0.3)));
    }
  });
  return answers;
}

function generateRespondents(): Respondent[] {
  const respondents: Respondent[] = [];
  const sexes: Respondent["sex"][] = ["Masculino", "Feminino", "Prefiro não declarar"];
  const names = [
    "Ana Silva", "Carlos Santos", "Maria Oliveira", "João Pereira", "Fernanda Costa",
    "Ricardo Lima", "Patrícia Souza", "Marcos Almeida", "Juliana Ferreira", "André Ribeiro",
    "Camila Martins", "Lucas Barbosa", "Beatriz Rocha", "Pedro Cardoso", "Larissa Araújo",
    "Gustavo Mendes", "Amanda Gomes", "Felipe Nascimento", "Isabela Moreira", "Rafael Dias",
  ];

  const biases: Record<string, number> = {
    emp1: 3.8, emp2: 3.2, emp3: 2.9, emp4: 3.5, emp5: 3.0,
  };

  companies.forEach((company) => {
    const count = randomInt(15, 30);
    for (let i = 0; i < count; i++) {
      respondents.push({
        id: `${company.id}_r${i}`,
        companyId: company.id,
        name: names[i % names.length],
        sex: sexes[randomInt(0, 2)],
        age: randomInt(20, 60),
        sector: sectorsList[randomInt(0, sectorsList.length - 1)],
        answers: generateAnswers(biases[company.id]),
        comment: i % 5 === 0 ? "Satisfeito com o ambiente de trabalho em geral." : undefined,
      });
    }
  });

  return respondents;
}

export const respondents = generateRespondents();

export function getCompanyRespondents(companyId: string): Respondent[] {
  return respondents.filter((r) => r.companyId === companyId);
}

export function getQuestionAverage(questionId: string, companyId?: string): number {
  const pool = companyId ? getCompanyRespondents(companyId) : respondents;
  if (pool.length === 0) return 0;
  const sum = pool.reduce((acc, r) => acc + (r.answers[questionId] || 0), 0);
  return Math.round((sum / pool.length) * 100) / 100;
}

export function getSectionAverage(sectionId: string, companyId?: string): number {
  const sectionQuestions = questions.filter((q) => q.section === sectionId);
  if (sectionQuestions.length === 0) return 0;
  const avg = sectionQuestions.reduce((acc, q) => acc + getQuestionAverage(q.id, companyId), 0) / sectionQuestions.length;
  return Math.round(avg * 100) / 100;
}

export function getAnswerDistribution(questionId: string, companyId?: string): { value: number; count: number; percentage: number }[] {
  const pool = companyId ? getCompanyRespondents(companyId) : respondents;
  return [1, 2, 3, 4, 5].map((value) => {
    const count = pool.filter((r) => r.answers[questionId] === value).length;
    return { value, count, percentage: pool.length > 0 ? Math.round((count / pool.length) * 100) : 0 };
  });
}

export const scaleLabels: Record<number, string> = {
  1: "Nunca",
  2: "Raramente",
  3: "Às vezes",
  4: "Frequentemente",
  5: "Sempre",
};
