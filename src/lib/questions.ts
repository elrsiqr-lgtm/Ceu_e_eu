export type Category = 'Acontecimentos' | 'Sentimentos' | 'Gratidão' | 'Reflexão' | 'Memória' | 'Futuro';
export interface Question { text: string; category: Category }

const q = (category: Category, ...texts: string[]): Question[] => texts.map((text) => ({ text, category }));

export const QUESTIONS: Question[] = [
  ...q('Acontecimentos', 'O que mais marcou seu dia?', 'Qual foi o momento mais inesperado de hoje?', 'Quem cruzou seu caminho hoje?', 'O que você fez hoje que gostaria de lembrar?', 'Qual conversa ficou na sua cabeça hoje?'),
  ...q('Sentimentos', 'Como você está se sentindo agora, de verdade?', 'Que emoção mais apareceu hoje?', 'O que pesou e o que aliviou hoje?', 'Se o seu dia tivesse uma cor, qual seria?', 'O que seu corpo está pedindo neste fim de dia?'),
  ...q('Gratidão', 'Pelo que você é grata ou grato hoje?', 'Qual pequena coisa tornou seu dia melhor?', 'Quem merece um agradecimento seu hoje?', 'Que gesto de gentileza você viu ou recebeu hoje?'),
  ...q('Reflexão', 'O que este dia te ensinou?', 'O que você faria diferente hoje?', 'O que você precisa soltar antes de dormir?', 'O que o céu de hoje diz sobre o seu momento?', 'Do que você precisa mais nesta fase?'),
  ...q('Memória', 'Que cheiro, som ou sabor define o dia de hoje?', 'O que você gostaria de lembrar daqui a um ano?', 'Que detalhe pequeno você não quer esquecer?', 'Onde você estava quando olhou para o céu?'),
  ...q('Futuro', 'O que você espera de amanhã?', 'Que pequeno passo você quer dar esta semana?', 'O que você gostaria de dizer a si mesma ou a si mesmo daqui a um ano?', 'Que sensação você quer ter ao acordar amanhã?'),
];

/**
 * Seleção rotativa: prefere as perguntas usadas há mais tempo (ou nunca usadas),
 * nunca repete a imediatamente anterior nem as excluídas, se houver alternativa.
 * `history` vem do mais recente para o mais antigo.
 */
export function pickQuestion(history: string[], exclude: string[] = [], rand: () => number = Math.random, bank: Question[] = QUESTIONS): Question {
  const last = history[0];
  let pool = bank.filter((x) => x.text !== last && !exclude.includes(x.text));
  if (pool.length === 0) pool = bank.filter((x) => !exclude.includes(x.text));
  if (pool.length === 0) pool = bank;
  // idade = posição na história (maior = mais antiga); nunca usada = infinito
  const age = (t: string) => { const i = history.indexOf(t); return i === -1 ? Infinity : i; };
  const maxAge = Math.max(...pool.map((x) => age(x.text)));
  const oldest = pool.filter((x) => age(x.text) === maxAge);
  return oldest[Math.floor(rand() * oldest.length)];
}
