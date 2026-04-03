/**
 * All 91 PROART questions with their IDs and texts
 * Organized by scale (EOT, EEG, EIST, EDT)
 */

export interface ProartQuestion {
  id: string;
  number: number;
  text: string;
  scaleId: string;
  scaleName: string;
  scaleShortName: string;
}

export const PROART_QUESTIONS: ProartQuestion[] = [
  // ===== EOT - Escala de Organização do Trabalho (19 questões) =====
  { id: "c1", number: 1, text: "O número de trabalhadores é suficiente para a execução das tarefas.", scaleId: "contexto", scaleName: "Escala de Organização do Trabalho", scaleShortName: "EOT" },
  { id: "c2", number: 2, text: "Os recursos de trabalho são em número suficiente para a realização das tarefas.", scaleId: "contexto", scaleName: "Escala de Organização do Trabalho", scaleShortName: "EOT" },
  { id: "c3", number: 3, text: "O espaço físico disponível para a realização do trabalho é adequado.", scaleId: "contexto", scaleName: "Escala de Organização do Trabalho", scaleShortName: "EOT" },
  { id: "c4", number: 4, text: "Os equipamentos são adequados para a realização das tarefas.", scaleId: "contexto", scaleName: "Escala de Organização do Trabalho", scaleShortName: "EOT" },
  { id: "c5", number: 5, text: "O ritmo de trabalho é adequado.", scaleId: "contexto", scaleName: "Escala de Organização do Trabalho", scaleShortName: "EOT" },
  { id: "c6", number: 6, text: "Os prazos para a realização das tarefas são flexíveis.", scaleId: "contexto", scaleName: "Escala de Organização do Trabalho", scaleShortName: "EOT" },
  { id: "c7", number: 7, text: "Possuo condições adequadas para alcançar os resultados esperados do meu trabalho.", scaleId: "contexto", scaleName: "Escala de Organização do Trabalho", scaleShortName: "EOT" },
  { id: "c8", number: 8, text: "Há clareza na definição das tarefas.", scaleId: "contexto", scaleName: "Escala de Organização do Trabalho", scaleShortName: "EOT" },
  { id: "c9", number: 9, text: "Há justiça na distribuição das tarefas.", scaleId: "contexto", scaleName: "Escala de Organização do Trabalho", scaleShortName: "EOT" },
  { id: "c10", number: 10, text: "Os funcionários participam das decisões sobre o trabalho.", scaleId: "contexto", scaleName: "Escala de Organização do Trabalho", scaleShortName: "EOT" },
  { id: "c11", number: 11, text: "A comunicação entre chefe e subordinado é adequada.", scaleId: "contexto", scaleName: "Escala de Organização do Trabalho", scaleShortName: "EOT" },
  { id: "c12", number: 12, text: "Tenho autonomia para realizar as tarefas como julgo melhor.", scaleId: "contexto", scaleName: "Escala de Organização do Trabalho", scaleShortName: "EOT" },
  { id: "c13", number: 13, text: "Há qualidade na comunicação entre os funcionários.", scaleId: "contexto", scaleName: "Escala de Organização do Trabalho", scaleShortName: "EOT" },
  { id: "c14", number: 14, text: "As informações de que preciso para executar minhas tarefas são claras.", scaleId: "contexto", scaleName: "Escala de Organização do Trabalho", scaleShortName: "EOT" },
  { id: "c15", number: 15, text: "A avaliação do meu trabalho inclui aspectos além da minha produção.", scaleId: "contexto", scaleName: "Escala de Organização do Trabalho", scaleShortName: "EOT" },
  { id: "c16", number: 16, text: "Há flexibilidade nas normas para a execução das tarefas.", scaleId: "contexto", scaleName: "Escala de Organização do Trabalho", scaleShortName: "EOT" },
  { id: "c17", number: 17, text: "As orientações que me são passadas para realizar as tarefas são coerentes entre si.", scaleId: "contexto", scaleName: "Escala de Organização do Trabalho", scaleShortName: "EOT" },
  { id: "c18", number: 18, text: "As tarefas que executo em meu trabalho são variadas.", scaleId: "contexto", scaleName: "Escala de Organização do Trabalho", scaleShortName: "EOT" },
  { id: "c19", number: 19, text: "Tenho liberdade para opinar sobre o meu trabalho.", scaleId: "contexto", scaleName: "Escala de Organização do Trabalho", scaleShortName: "EOT" },

  // ===== EEG - Escala de Estilos de Gestão (21 questões) =====
  { id: "g1", number: 20, text: "Em meu trabalho, incentiva-se a idolatria dos chefes.", scaleId: "gestao", scaleName: "Escala de Estilos de Gestão", scaleShortName: "EEG" },
  { id: "g2", number: 21, text: "Os gestores desta organização se consideram insubstituíveis.", scaleId: "gestao", scaleName: "Escala de Estilos de Gestão", scaleShortName: "EEG" },
  { id: "g3", number: 22, text: "Aqui os gestores preferem trabalhar individualmente.", scaleId: "gestao", scaleName: "Escala de Estilos de Gestão", scaleShortName: "EEG" },
  { id: "g4", number: 23, text: "Nesta organização os gestores se consideram o centro do mundo.", scaleId: "gestao", scaleName: "Escala de Estilos de Gestão", scaleShortName: "EEG" },
  { id: "g5", number: 24, text: "Os gestores desta organização fazem qualquer coisa para chamar a atenção.", scaleId: "gestao", scaleName: "Escala de Estilos de Gestão", scaleShortName: "EEG" },
  { id: "g6", number: 25, text: "É creditada grande importância para as regras nesta organização.", scaleId: "gestao", scaleName: "Escala de Estilos de Gestão", scaleShortName: "EEG" },
  { id: "g7", number: 26, text: "A hierarquia é valorizada nesta organização.", scaleId: "gestao", scaleName: "Escala de Estilos de Gestão", scaleShortName: "EEG" },
  { id: "g8", number: 27, text: "Os laços afetivos são fracos entre as pessoas desta organização.", scaleId: "gestao", scaleName: "Escala de Estilos de Gestão", scaleShortName: "EEG" },
  { id: "g9", number: 28, text: "Há forte controle do trabalho.", scaleId: "gestao", scaleName: "Escala de Estilos de Gestão", scaleShortName: "EEG" },
  { id: "g10", number: 29, text: "O ambiente de trabalho se desorganiza com mudanças.", scaleId: "gestao", scaleName: "Escala de Estilos de Gestão", scaleShortName: "EEG" },
  { id: "g11", number: 30, text: "As pessoas são compromissadas com a organização mesmo quando não há retorno adequado.", scaleId: "gestao", scaleName: "Escala de Estilos de Gestão", scaleShortName: "EEG" },
  { id: "g12", number: 31, text: "O mérito das conquistas na empresa é de todos.", scaleId: "gestao", scaleName: "Escala de Estilos de Gestão", scaleShortName: "EEG" },
  { id: "g13", number: 32, text: "O trabalho coletivo é valorizado pelos gestores.", scaleId: "gestao", scaleName: "Escala de Estilos de Gestão", scaleShortName: "EEG" },
  { id: "g14", number: 33, text: "Para esta organização, o resultado do trabalho é visto como uma realização do grupo.", scaleId: "gestao", scaleName: "Escala de Estilos de Gestão", scaleShortName: "EEG" },
  { id: "g15", number: 34, text: "As decisões nesta organização são tomadas em grupo.", scaleId: "gestao", scaleName: "Escala de Estilos de Gestão", scaleShortName: "EEG" },
  { id: "g16", number: 35, text: "Somos incentivados pelos gestores a buscar novos desafios.", scaleId: "gestao", scaleName: "Escala de Estilos de Gestão", scaleShortName: "EEG" },
  { id: "g17", number: 36, text: "Os gestores favorecem o trabalho interativo de profissionais de diferentes áreas.", scaleId: "gestao", scaleName: "Escala de Estilos de Gestão", scaleShortName: "EEG" },
  { id: "g18", number: 37, text: "A competência dos trabalhadores é valorizada pela gestão.", scaleId: "gestao", scaleName: "Escala de Estilos de Gestão", scaleShortName: "EEG" },
  { id: "g19", number: 38, text: "Existem oportunidades semelhantes de ascensão para todas as pessoas.", scaleId: "gestao", scaleName: "Escala de Estilos de Gestão", scaleShortName: "EEG" },
  { id: "g20", number: 39, text: "Os gestores se preocupam com o bem estar dos trabalhadores.", scaleId: "gestao", scaleName: "Escala de Estilos de Gestão", scaleShortName: "EEG" },
  { id: "g21", number: 40, text: "A inovação é valorizada nesta organização.", scaleId: "gestao", scaleName: "Escala de Estilos de Gestão", scaleShortName: "EEG" },

  // ===== EIST - Escala de Indicadores de Sofrimento no Trabalho (28 questões) =====
  { id: "v1", number: 41, text: "Sinto-me inútil em meu trabalho.", scaleId: "vivencias", scaleName: "Escala de Indicadores de Sofrimento no Trabalho", scaleShortName: "EIST" },
  { id: "v2", number: 42, text: "Considero minhas tarefas insignificantes.", scaleId: "vivencias", scaleName: "Escala de Indicadores de Sofrimento no Trabalho", scaleShortName: "EIST" },
  { id: "v3", number: 43, text: "Sinto-me improdutivo no meu trabalho.", scaleId: "vivencias", scaleName: "Escala de Indicadores de Sofrimento no Trabalho", scaleShortName: "EIST" },
  { id: "v4", number: 44, text: "A identificação com minhas tarefas é inexistente.", scaleId: "vivencias", scaleName: "Escala de Indicadores de Sofrimento no Trabalho", scaleShortName: "EIST" },
  { id: "v5", number: 45, text: "Sinto-me desmotivado para realizar minhas tarefas.", scaleId: "vivencias", scaleName: "Escala de Indicadores de Sofrimento no Trabalho", scaleShortName: "EIST" },
  { id: "v6", number: 46, text: "Meu trabalho é irrelevante para o desenvolvimento da sociedade.", scaleId: "vivencias", scaleName: "Escala de Indicadores de Sofrimento no Trabalho", scaleShortName: "EIST" },
  { id: "v7", number: 47, text: "Meu trabalho é sem sentido.", scaleId: "vivencias", scaleName: "Escala de Indicadores de Sofrimento no Trabalho", scaleShortName: "EIST" },
  { id: "v8", number: 48, text: "Minhas tarefas são banais.", scaleId: "vivencias", scaleName: "Escala de Indicadores de Sofrimento no Trabalho", scaleShortName: "EIST" },
  { id: "v9", number: 49, text: "Permaneço neste emprego por falta de oportunidade no mercado de trabalho.", scaleId: "vivencias", scaleName: "Escala de Indicadores de Sofrimento no Trabalho", scaleShortName: "EIST" },
  { id: "v10", number: 50, text: "Meu trabalho é cansativo.", scaleId: "vivencias", scaleName: "Escala de Indicadores de Sofrimento no Trabalho", scaleShortName: "EIST" },
  { id: "v11", number: 51, text: "Meu trabalho é desgastante.", scaleId: "vivencias", scaleName: "Escala de Indicadores de Sofrimento no Trabalho", scaleShortName: "EIST" },
  { id: "v12", number: 52, text: "Meu trabalho me frustra.", scaleId: "vivencias", scaleName: "Escala de Indicadores de Sofrimento no Trabalho", scaleShortName: "EIST" },
  { id: "v13", number: 53, text: "Meu trabalho me sobrecarrega.", scaleId: "vivencias", scaleName: "Escala de Indicadores de Sofrimento no Trabalho", scaleShortName: "EIST" },
  { id: "v14", number: 54, text: "Meu trabalho me desanima.", scaleId: "vivencias", scaleName: "Escala de Indicadores de Sofrimento no Trabalho", scaleShortName: "EIST" },
  { id: "v15", number: 55, text: "Submeter meu trabalho a decisões políticas é fonte de revolta.", scaleId: "vivencias", scaleName: "Escala de Indicadores de Sofrimento no Trabalho", scaleShortName: "EIST" },
  { id: "v16", number: 56, text: "Meu trabalho me faz sofrer.", scaleId: "vivencias", scaleName: "Escala de Indicadores de Sofrimento no Trabalho", scaleShortName: "EIST" },
  { id: "v17", number: 57, text: "Meu trabalho me causa insatisfação.", scaleId: "vivencias", scaleName: "Escala de Indicadores de Sofrimento no Trabalho", scaleShortName: "EIST" },
  { id: "v18", number: 58, text: "Meu trabalho é desvalorizado pela organização.", scaleId: "vivencias", scaleName: "Escala de Indicadores de Sofrimento no Trabalho", scaleShortName: "EIST" },
  { id: "v19", number: 59, text: "A submissão do meu chefe às ordens superiores me causa revolta.", scaleId: "vivencias", scaleName: "Escala de Indicadores de Sofrimento no Trabalho", scaleShortName: "EIST" },
  { id: "v20", number: 60, text: "Meus colegas desvalorizam meu trabalho.", scaleId: "vivencias", scaleName: "Escala de Indicadores de Sofrimento no Trabalho", scaleShortName: "EIST" },
  { id: "v21", number: 61, text: "Falta-me liberdade para dizer o que penso sobre meu trabalho.", scaleId: "vivencias", scaleName: "Escala de Indicadores de Sofrimento no Trabalho", scaleShortName: "EIST" },
  { id: "v22", number: 62, text: "Meus colegas são indiferentes comigo.", scaleId: "vivencias", scaleName: "Escala de Indicadores de Sofrimento no Trabalho", scaleShortName: "EIST" },
  { id: "v23", number: 63, text: "Sou excluído do planejamento de minhas próprias tarefas.", scaleId: "vivencias", scaleName: "Escala de Indicadores de Sofrimento no Trabalho", scaleShortName: "EIST" },
  { id: "v24", number: 64, text: "Minha chefia trata meu trabalho com indiferença.", scaleId: "vivencias", scaleName: "Escala de Indicadores de Sofrimento no Trabalho", scaleShortName: "EIST" },
  { id: "v25", number: 65, text: "É difícil a convivência com meus colegas.", scaleId: "vivencias", scaleName: "Escala de Indicadores de Sofrimento no Trabalho", scaleShortName: "EIST" },
  { id: "v26", number: 66, text: "O trabalho que realizo é desqualificado pela chefia.", scaleId: "vivencias", scaleName: "Escala de Indicadores de Sofrimento no Trabalho", scaleShortName: "EIST" },
  { id: "v27", number: 67, text: "Falta-me liberdade para dialogar com minha chefia.", scaleId: "vivencias", scaleName: "Escala de Indicadores de Sofrimento no Trabalho", scaleShortName: "EIST" },
  { id: "v28", number: 68, text: "Há desconfiança na relação entre chefia e subordinado.", scaleId: "vivencias", scaleName: "Escala de Indicadores de Sofrimento no Trabalho", scaleShortName: "EIST" },

  // ===== EDT - Escala de Danos Relacionados ao Trabalho (23 questões) =====
  { id: "s1", number: 69, text: "Amargura.", scaleId: "saude", scaleName: "Escala de Danos Relacionados ao Trabalho", scaleShortName: "EDT" },
  { id: "s2", number: 70, text: "Sensação de vazio.", scaleId: "saude", scaleName: "Escala de Danos Relacionados ao Trabalho", scaleShortName: "EDT" },
  { id: "s3", number: 71, text: "Mau-humor.", scaleId: "saude", scaleName: "Escala de Danos Relacionados ao Trabalho", scaleShortName: "EDT" },
  { id: "s4", number: 72, text: "Vontade de desistir de tudo.", scaleId: "saude", scaleName: "Escala de Danos Relacionados ao Trabalho", scaleShortName: "EDT" },
  { id: "s5", number: 73, text: "Tristeza.", scaleId: "saude", scaleName: "Escala de Danos Relacionados ao Trabalho", scaleShortName: "EDT" },
  { id: "s6", number: 74, text: "Perda da autoconfiança.", scaleId: "saude", scaleName: "Escala de Danos Relacionados ao Trabalho", scaleShortName: "EDT" },
  { id: "s7", number: 75, text: "Solidão.", scaleId: "saude", scaleName: "Escala de Danos Relacionados ao Trabalho", scaleShortName: "EDT" },
  { id: "s8", number: 76, text: "Insensibilidade em relação aos colegas.", scaleId: "saude", scaleName: "Escala de Danos Relacionados ao Trabalho", scaleShortName: "EDT" },
  { id: "s9", number: 77, text: "Dificuldades nas relações fora do trabalho.", scaleId: "saude", scaleName: "Escala de Danos Relacionados ao Trabalho", scaleShortName: "EDT" },
  { id: "s10", number: 78, text: "Vontade de ficar sozinho.", scaleId: "saude", scaleName: "Escala de Danos Relacionados ao Trabalho", scaleShortName: "EDT" },
  { id: "s11", number: 79, text: "Conflitos nas relações familiares.", scaleId: "saude", scaleName: "Escala de Danos Relacionados ao Trabalho", scaleShortName: "EDT" },
  { id: "s12", number: 80, text: "Agressividade com os outros.", scaleId: "saude", scaleName: "Escala de Danos Relacionados ao Trabalho", scaleShortName: "EDT" },
  { id: "s13", number: 81, text: "Dificuldade com os amigos.", scaleId: "saude", scaleName: "Escala de Danos Relacionados ao Trabalho", scaleShortName: "EDT" },
  { id: "s14", number: 82, text: "Impaciência com as pessoas em geral.", scaleId: "saude", scaleName: "Escala de Danos Relacionados ao Trabalho", scaleShortName: "EDT" },
  { id: "s15", number: 83, text: "Dores no corpo.", scaleId: "saude", scaleName: "Escala de Danos Relacionados ao Trabalho", scaleShortName: "EDT" },
  { id: "s16", number: 84, text: "Dores no braço.", scaleId: "saude", scaleName: "Escala de Danos Relacionados ao Trabalho", scaleShortName: "EDT" },
  { id: "s17", number: 85, text: "Dor de cabeça.", scaleId: "saude", scaleName: "Escala de Danos Relacionados ao Trabalho", scaleShortName: "EDT" },
  { id: "s18", number: 86, text: "Distúrbios digestivos.", scaleId: "saude", scaleName: "Escala de Danos Relacionados ao Trabalho", scaleShortName: "EDT" },
  { id: "s19", number: 87, text: "Dores nas costas.", scaleId: "saude", scaleName: "Escala de Danos Relacionados ao Trabalho", scaleShortName: "EDT" },
  { id: "s20", number: 88, text: "Alterações no sono.", scaleId: "saude", scaleName: "Escala de Danos Relacionados ao Trabalho", scaleShortName: "EDT" },
  { id: "s21", number: 89, text: "Dores nas pernas.", scaleId: "saude", scaleName: "Escala de Danos Relacionados ao Trabalho", scaleShortName: "EDT" },
  { id: "s22", number: 90, text: "Distúrbios circulatórios.", scaleId: "saude", scaleName: "Escala de Danos Relacionados ao Trabalho", scaleShortName: "EDT" },
  { id: "s23", number: 91, text: "Alterações no apetite.", scaleId: "saude", scaleName: "Escala de Danos Relacionados ao Trabalho", scaleShortName: "EDT" },
];

export const OPEN_QUESTIONS = [
  { id: "open1", text: "Descreva como você percebe a organização do trabalho.", hint: "Fique à vontade para escrever possíveis desconfortos e também contribuir com sugestões." },
  { id: "open2", text: "Descreva como você percebe a atuação do seu(sua) líder.", hint: "Fique à vontade para escrever possíveis desconfortos e também contribuir com sugestões." },
  { id: "open3", text: "Descreva como você percebe a sua saúde mental.", hint: "Fique à vontade para escrever possíveis desconfortos e também contribuir com sugestões." },
  { id: "open4", text: "Caso alguma informação importante não tenha sido abordada neste questionário, fique à vontade para descrever.", hint: "" },
];

export const LIKERT_OPTIONS = [
  { value: 1, label: "Nunca", percent: "0%" },
  { value: 2, label: "Raramente", percent: "25%" },
  { value: 3, label: "Às vezes", percent: "50%" },
  { value: 4, label: "Frequentemente", percent: "75%" },
  { value: 5, label: "Sempre", percent: "100%" },
];

export const DEMOGRAPHIC_OPTIONS = {
  genero: ["Masculino", "Feminino", "Outro", "Prefiro não informar"],
  faixa_etaria: ["18 a 25 anos", "26 a 35 anos", "36 a 45 anos", "46 a 55 anos", "Acima de 55 anos"],
  escolaridade: ["Ensino Fundamental", "Ensino Médio", "Técnico", "Superior Incompleto", "Superior Completo", "Pós-graduação"],
  estado_civil: ["Solteiro(a)", "Casado(a)", "Divorciado(a)", "Viúvo(a)", "União Estável"],
  tempo_empresa: ["Menos de 1 ano", "1 a 3 anos", "3 a 5 anos", "5 a 10 anos", "Mais de 10 anos"],
};

// Group questions by scale for step-by-step navigation
export function getQuestionsByScale() {
  const scales = [
    { id: "contexto", name: "Escala EOT", fullName: "Escala de Organização do Trabalho", shortName: "EOT" },
    { id: "gestao", name: "Escala EEG", fullName: "Escala de Estilos de Gestão", shortName: "EEG" },
    { id: "vivencias", name: "Escala EIST", fullName: "Escala de Indicadores de Sofrimento no Trabalho", shortName: "EIST" },
    { id: "saude", name: "Escala EDT", fullName: "Escala de Danos Relacionados ao Trabalho", shortName: "EDT" },
  ];

  return scales.map(scale => ({
    ...scale,
    questions: PROART_QUESTIONS.filter(q => q.scaleId === scale.id),
  }));
}
