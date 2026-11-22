import { describe, it, expect } from 'vitest';
import { pickQuestion, QUESTIONS } from './questions';
import { toISODate, parseISO } from './dates';

describe('pickQuestion', () => {
  it('não repete a pergunta imediatamente anterior', () => {
    for (let i = 0; i < 200; i++) expect(pickQuestion([QUESTIONS[0].text]).text).not.toBe(QUESTIONS[0].text);
  });
  it('respeita exclusões', () => {
    const ex = QUESTIONS.slice(1).map((x) => x.text);
    expect(pickQuestion([], ex).text).toBe(QUESTIONS[0].text);
  });
  it('prefere perguntas nunca usadas ou mais antigas', () => {
    const history = QUESTIONS.slice(1).map((x) => x.text); // só a 0 nunca foi usada
    expect(pickQuestion(history).text).toBe(QUESTIONS[0].text);
  });
  it('funciona com banco de uma única pergunta', () => {
    const bank = [QUESTIONS[0]];
    expect(pickQuestion([QUESTIONS[0].text], [], Math.random, bank).text).toBe(QUESTIONS[0].text);
  });
});
describe('datas', () => {
  it('ida e volta ISO local', () => { expect(toISODate(parseISO('2025-04-16'))).toBe('2025-04-16'); });
});
