// Última barreira antes da rede: nenhuma requisição sai do celular levando documento,
// credencial ou dado de saúde ligado à pessoa. Versão enxuta das regras do motor de PII
// (GS-CYBER-AQUENDA, aquenda_cyber/pii/regras.py), com os mesmos validadores.
//
// Conversa sobre saúde numa sala ("comecei a hormonização") continua podendo sair: é o
// motivo da sala existir. O que nunca sai é o que identifica (CPF, Cartão SUS) ou abre
// conta (senha, token), e dose de medicamento junto do nome do remédio.

export type Bloqueio = { regra: string; nome: string };

function soDigitos(t: string): string {
  return t.replace(/\D/g, '');
}

/** Troca dígitos largos (１２３) por ASCII e tira caracteres invisíveis usados para disfarçar. */
export function normalizar(t: string): string {
  return t.normalize('NFKC').replace(/[​-‍⁠﻿­]/g, '');
}

export function cpfValido(t: string): boolean {
  const d = soDigitos(t);
  if (d.length !== 11 || /^(\d)\1{10}$/.test(d)) return false;
  const n = [...d].map(Number);
  for (const pos of [9, 10]) {
    let soma = 0;
    for (let i = 0; i < pos; i++) soma += n[i] * (pos + 1 - i);
    if (((soma * 10) % 11) % 10 !== n[pos]) return false;
  }
  return true;
}

export function cnsValido(t: string): boolean {
  const d = soDigitos(t);
  if (d.length !== 15 || !'12789'.includes(d[0])) return false;
  let soma = 0;
  for (let i = 0; i < 15; i++) soma += Number(d[i]) * (15 - i);
  return soma % 11 === 0;
}

export function luhnValido(t: string): boolean {
  const d = soDigitos(t);
  if (d.length < 13 || d.length > 19) return false;
  let total = 0;
  [...d].reverse().forEach((c, i) => {
    let n = Number(c);
    if (i % 2 === 1) {
      n *= 2;
      if (n > 9) n -= 9;
    }
    total += n;
  });
  return total % 10 === 0;
}

const CPF = /(?<!\d)(\d{3}[.\s]?\d{3}[.\s]?\d{3}[-.\s/]?\d{2}|(?:\d[\s.-]){10}\d)(?!\d)/g;
const CNS = /(?<!\d)([12789]\d{2}[\s.]?\d{4}[\s.]?\d{4}[\s.]?\d{4})(?!\d)/g;
const CARTAO = /(?<!\d)([3-6]\d{3}(?:[ -]?\d{4}){2}[ -]?\d{4}(?:[ -]?\d{1,3})?)(?!\d)/g;
const SENHA = /(?:senha|password|passwd|pwd|\bpin\b)["']?\s*(?:[:=]|é|e)\s*["']?([^\s"',;}]{3,64})/gi;
const TOKEN = /(sk-ant-[A-Za-z0-9_-]{20,}|AKIA[0-9A-Z]{16}|eyJ[\w-]{8,}\.eyJ[\w-]{8,}\.[\w-]{8,})/;
const REMEDIO = /\b(estradiol|testosterona|ciproterona|espironolactona|finasterida|progesterona|deposteron|durateston|nebido|perlutan|androcur|truvada|dolutegravir|tenofovir)\b/i;
const DOSE = /\b\d+(?:[.,]\d+)?\s?(?:mg|ml|mcg|ui|ampolas?|comprimidos?)\b/i;

/** Procura o que nunca pode sair do celular. Devolve a lista do que achou (vazia = pode sair). */
export function oQueNaoPodeSair(texto: string): Bloqueio[] {
  const t = normalizar(texto);
  const achados: Bloqueio[] = [];
  for (const m of t.matchAll(CPF)) if (cpfValido(m[1])) achados.push({ regra: 'cpf', nome: 'CPF' });
  for (const m of t.matchAll(CNS)) if (cnsValido(m[1])) achados.push({ regra: 'cns', nome: 'Cartão SUS' });
  for (const m of t.matchAll(CARTAO)) if (luhnValido(m[1]) && !cpfValido(m[1])) achados.push({ regra: 'cartao', nome: 'cartão de crédito' });
  for (const m of t.matchAll(SENHA)) if (!/^[*x•<[{$]/i.test(m[1])) achados.push({ regra: 'senha', nome: 'senha ou PIN' });
  if (TOKEN.test(t)) achados.push({ regra: 'token', nome: 'chave de acesso' });
  const remedio = REMEDIO.exec(t);
  if (remedio) {
    const perto = t.slice(Math.max(0, remedio.index - 48), remedio.index + remedio[0].length + 48);
    if (DOSE.test(perto)) achados.push({ regra: 'saude', nome: 'remédio com dose' });
  }
  const unicos = new Map(achados.map((a) => [a.regra, a]));
  return [...unicos.values()];
}

/** URL e corpo de uma requisição: levanta a lista do que achou, ou nada. */
export function verificarSaida(url: string, corpo?: unknown): Bloqueio[] {
  let texto = url;
  try {
    texto = decodeURIComponent(url);
  } catch {
    // URL com % solto: confere como está
  }
  if (corpo !== undefined) texto += ' ' + (typeof corpo === 'string' ? corpo : JSON.stringify(corpo));
  return oQueNaoPodeSair(texto);
}
