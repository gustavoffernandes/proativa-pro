import { type Question } from "@/data/mockData";
import { PROART_SCALES, classifyRisk, getRiskLabel } from "@/lib/proartMethodology";

export interface ExportData {
  companies: { id: string; name: string; sector: string; employees: number }[];
  sections: { id: string; name: string; shortName: string }[];
  questions: Question[];
  respondents: { id: string; companyId: string; name: string; sex: string; age: number; sector: string; answers: Record<string, number> }[];
  getCompanyRespondents: (companyId: string) => any[];
  getSectionAverage: (sectionId: string, companyId?: string) => number;
  getQuestionAverage: (questionId: string, companyId?: string) => number;
  getAnswerDistribution: (questionId: string, companyId?: string) => { value: number; count: number; percentage: number }[];
  getAvailableSections: () => { id: string; name: string; shortName: string }[];
  getAvailableQuestions: () => Question[];
}

function downloadCSV(filename: string, csvContent: string) {
  const BOM = "\uFEFF";
  const blob = new Blob([BOM + csvContent], { type: "text/csv;charset=utf-8;" });
  const link = document.createElement("a");
  link.href = URL.createObjectURL(blob);
  link.download = filename;
  link.click();
  URL.revokeObjectURL(link.href);
}

export function exportCompanyReport(companyId: string, data: ExportData) {
  const company = data.companies.find(c => c.id === companyId);
  if (!company) return;
  const pool = data.getCompanyRespondents(companyId);
  const availableSections = data.getAvailableSections();
  const availableQuestions = data.getAvailableQuestions();
  const lines: string[] = [];

  lines.push(`RELATÓRIO PROATIVA - ${company.name}`);
  lines.push(`Setor: ${company.sector}`);
  lines.push(`Funcionários: ${company.employees}`);
  lines.push(`Respostas coletadas: ${pool.length}`);
  lines.push(`Data de geração: ${new Date().toLocaleDateString("pt-BR")}`);
  lines.push("");

  lines.push("RESUMO POR PILAR");
  lines.push("Pilar,Média,Classificação");
  availableSections.forEach(s => {
    const avg = data.getSectionAverage(s.id, companyId);
    const scale = PROART_SCALES.find(sc => sc.id === s.id);
    const scaleType = scale?.type === "positive" ? "positive" as const : "negative" as const;
    const classification = getRiskLabel(classifyRisk(avg, scaleType));
    lines.push(`${s.name},${avg.toFixed(2)},${classification}`);
  });
  lines.push("");

  availableSections.forEach(s => {
    const qs = availableQuestions.filter(q => q.section === s.id);
    lines.push(`DETALHAMENTO - ${s.name.toUpperCase()}`);
    lines.push("Nº,Pergunta,Média,Nunca(%),Raramente(%),Às vezes(%),Frequentemente(%),Sempre(%)");
    qs.forEach(q => {
      const avg = data.getQuestionAverage(q.id, companyId);
      const dist = data.getAnswerDistribution(q.id, companyId);
      lines.push(`${q.number},"${q.text}",${avg.toFixed(2)},${dist.map(d => d.percentage).join(",")}`);
    });
    lines.push("");
  });

  lines.push("PERFIL DEMOGRÁFICO DOS RESPONDENTES");
  lines.push("Gênero,Quantidade,%");
  const sexGroups = ["Masculino", "Feminino", "Prefiro não declarar"];
  sexGroups.forEach(sex => {
    const count = pool.filter((r: any) => r.sex === sex).length;
    lines.push(`${sex},${count},${pool.length > 0 ? Math.round((count / pool.length) * 100) : 0}%`);
  });
  lines.push("");

  lines.push("Faixa Etária,Quantidade");
  const ageRanges = [
    { label: "18-25", min: 18, max: 25 },
    { label: "26-35", min: 26, max: 35 },
    { label: "36-45", min: 36, max: 45 },
    { label: "46-55", min: 46, max: 55 },
    { label: "56+", min: 56, max: 100 },
  ];
  ageRanges.forEach(r => {
    lines.push(`${r.label},${pool.filter((resp: any) => resp.age >= r.min && resp.age <= r.max).length}`);
  });

  downloadCSV(`relatorio_${company.name.replace(/\s+/g, "_")}_${new Date().toISOString().split("T")[0]}.csv`, lines.join("\n"));
}

export function exportComparisonReport(companyIds: string[], data: ExportData) {
  const selected = data.companies.filter(c => companyIds.includes(c.id));
  const availableSections = data.getAvailableSections();
  const availableQuestions = data.getAvailableQuestions();
  const lines: string[] = [];

  lines.push("RELATÓRIO COMPARATIVO PROATIVA");
  lines.push(`Empresas: ${selected.map(c => c.name).join(" | ")}`);
  lines.push(`Data: ${new Date().toLocaleDateString("pt-BR")}`);
  lines.push("");

  lines.push("VISÃO GERAL");
  const header = ["Empresa", "Respostas", ...availableSections.map(s => s.shortName), "Média Geral"];
  lines.push(header.join(","));
  selected.forEach(c => {
    const avgs = availableSections.map(s => data.getSectionAverage(s.id, c.id).toFixed(2));
    const overall = availableSections.length > 0
      ? (availableSections.reduce((acc, s) => acc + data.getSectionAverage(s.id, c.id), 0) / availableSections.length).toFixed(2)
      : "0";
    lines.push(`"${c.name}",${data.getCompanyRespondents(c.id).length},${avgs.join(",")},${overall}`);
  });
  lines.push("");

  availableSections.forEach(s => {
    const qs = availableQuestions.filter(q => q.section === s.id);
    lines.push(`COMPARATIVO POR PERGUNTA - ${s.name.toUpperCase()}`);
    const qHeader = ["Nº", "Pergunta", ...selected.map(c => c.name)];
    lines.push(qHeader.join(","));
    qs.forEach(q => {
      const vals = selected.map(c => data.getQuestionAverage(q.id, c.id).toFixed(2));
      lines.push(`${q.number},"${q.text}",${vals.join(",")}`);
    });
    lines.push("");
  });

  downloadCSV(`comparativo_PROATIVA_${new Date().toISOString().split("T")[0]}.csv`, lines.join("\n"));
}

export function exportRawData(data: ExportData) {
  const availableQuestions = data.getAvailableQuestions();
  const lines: string[] = [];
  const header = ["Respondente", "Empresa", "Sexo", "Idade", "Setor", ...availableQuestions.map(q => `${q.section}_${q.number}`)];
  lines.push(header.join(","));

  data.respondents.forEach(r => {
    const company = data.companies.find(c => c.id === r.companyId);
    const answers = availableQuestions.map(q => r.answers[q.id] || "");
    lines.push(`"${r.name}","${company?.name || ""}",${r.sex},${r.age},${r.sector},${answers.join(",")}`);
  });

  downloadCSV(`dados_brutos_PROATIVA_${new Date().toISOString().split("T")[0]}.csv`, lines.join("\n"));
}

export function exportHeatmapData(sectionId: string, data: ExportData) {
  const availableQuestions = data.getAvailableQuestions();
  const qs = availableQuestions.filter(q => q.section === sectionId);
  const section = data.sections.find(s => s.id === sectionId);
  const lines: string[] = [];

  lines.push(`HEATMAP - ${section?.name.toUpperCase() || sectionId}`);
  lines.push(`Data: ${new Date().toLocaleDateString("pt-BR")}`);
  lines.push("");

  const header = ["Pergunta", ...data.companies.map(c => c.name)];
  lines.push(header.join(","));
  qs.forEach(q => {
    const vals = data.companies.map(c => data.getQuestionAverage(q.id, c.id).toFixed(2));
    lines.push(`"${q.number}. ${q.text}",${vals.join(",")}`);
  });

  downloadCSV(`heatmap_${sectionId}_${new Date().toISOString().split("T")[0]}.csv`, lines.join("\n"));
}
