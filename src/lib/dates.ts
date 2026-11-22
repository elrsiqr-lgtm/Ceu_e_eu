// Datas são sempre "YYYY-MM-DD" no fuso LOCAL do aparelho (regra: uma memória por data local).
export const pad = (n: number) => String(n).padStart(2, '0');
export const toISODate = (d: Date) => `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
export const todayISO = () => toISODate(new Date());
export const parseISO = (s: string) => {
  const [y, m, d] = s.split('-').map(Number);
  return new Date(y, m - 1, d);
};
const MESES = ['janeiro','fevereiro','março','abril','maio','junho','julho','agosto','setembro','outubro','novembro','dezembro'];
const MESES_CURTOS = ['jan.','fev.','mar.','abr.','mai.','jun.','jul.','ago.','set.','out.','nov.','dez.'];
export const monthName = (m: number) => MESES[m];
export const formatShort = (iso: string) => {
  const d = parseISO(iso);
  return `${d.getDate()} de ${MESES_CURTOS[d.getMonth()]} de ${d.getFullYear()}`;
};
export const formatLong = (iso: string) => {
  const d = parseISO(iso);
  const dias = ['domingo','segunda-feira','terça-feira','quarta-feira','quinta-feira','sexta-feira','sábado'];
  return `${dias[d.getDay()]}, ${d.getDate()} de ${MESES[d.getMonth()]} de ${d.getFullYear()}`;
};
export const greeting = (h = new Date().getHours()) =>
  h < 5 ? 'Boa noite!' : h < 12 ? 'Bom dia!' : h < 18 ? 'Boa tarde!' : 'Boa noite!';
