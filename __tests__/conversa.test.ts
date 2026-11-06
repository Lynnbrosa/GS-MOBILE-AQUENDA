// Salas de conversa: regras que rodam no celular e o cliente da API C# (/api/chat)
// contra respostas gravadas da API real.
import { apiChat, CABECALHO_TOKEN, urlHub, urlMensagens } from '@/lib/api/chat';
import type { Mensagem } from '@/lib/api/tipos';
import { configurarPadroes } from '@/lib/config';
import { ehMinha, horaDaMensagem, mesclar, proximoIntervalo, remover, semBloqueados, temContato, ultimoId, validarApelido } from '@/lib/conversa';
import { gravada, prepararFetch } from './ajuda';

const m = (id: number, apelido = 'Bia'): Mensagem => ({ id, salaId: 2, apelido, texto: `msg ${id}`, enviadaEm: '2026-11-06T06:26:53Z' });

beforeEach(() => configurarPadroes({ env: {}, plataforma: 'android', ehEmulador: true }));

describe('mensagens na tela', () => {
  it('junta as novas sem repetir e em ordem', () => {
    const r = mesclar([m(1), m(3)], [m(3), m(5), m(4)]);
    expect(r.map((x) => x.id)).toEqual([1, 3, 4, 5]);
    expect(ultimoId(r)).toBe(5);
    expect(ultimoId([])).toBeNull();
  });

  it('tira a mensagem que a moderação ocultou', () => {
    expect(remover([m(1), m(2), m(3)], 2).map((x) => x.id)).toEqual([1, 3]);
  });

  it('bloquear esconde tudo daquele apelido, sem ligar para maiúscula', () => {
    const lista = [m(1, 'Bia'), m(2, 'Rê Silva'), m(3, 'bia')];
    expect(semBloqueados(lista, new Set(['BIA'])).map((x) => x.id)).toEqual([2]);
    expect(semBloqueados(lista, new Set()).length).toBe(3);
  });

  it('reconhece as minhas pelo id enviado ou pelo apelido', () => {
    expect(ehMinha(m(9, 'Outra'), 'Lua', new Set([9]))).toBe(true);
    expect(ehMinha(m(1, ' lua '), 'Lua', new Set())).toBe(true);
    expect(ehMinha(m(1, 'Bia'), 'Lua', new Set())).toBe(false);
    expect(ehMinha(m(1, 'Bia'), undefined, new Set())).toBe(false);
  });
});

describe('segurança do texto (mesmas regras da API C#)', () => {
  it.each([
    'me chama no (11) 98765-4321',
    'whats +55 11 987654321',
    'meu cpf 123.456.789-09',
    'fulana@gmail.com',
    'entra em https://golpe.example',
    'acessa www.qualquer.coisa',
    'wa.me/5511999999999',
    'meuperfil.com.br',
  ])('recusa contato: %s', (t) => expect(temContato(t)).toBe(true));

  it.each(['tenho 23 anos e cheguei em 2025', 'a consulta é dia 14/11 às 14h', 'alguém conhece a UBS República?'])(
    'não confunde número comum: %s',
    (t) => expect(temContato(t)).toBe(false),
  );

  it('valida apelido como a API (3 a 24)', () => {
    expect(validarApelido('Bia')).toBeNull();
    expect(validarApelido('  Lua  Nova ')).toBeNull();
    expect(validarApelido('Bi')).toMatch(/3 a 24/);
    expect(validarApelido('bia<script>')).toMatch(/Use só/);
    expect(validarApelido('bia@mail.com')).not.toBeNull();
  });
});

describe('ritmo e hora', () => {
  it('sem tempo real, consulta cada vez mais devagar', () => {
    expect(proximoIntervalo(0)).toBe(4000);
    expect(proximoIntervalo(5)).toBe(8000);
    expect(proximoIntervalo(30)).toBe(15000);
  });

  it('mostra a hora curta', () => {
    const agora = new Date(2026, 10, 6, 15, 0);
    expect(horaDaMensagem(new Date(2026, 10, 6, 14, 5).toISOString(), agora)).toBe('14h05');
    expect(horaDaMensagem(new Date(2026, 10, 5, 22, 10).toISOString(), agora)).toBe('ontem 22h10');
    expect(horaDaMensagem(new Date(2026, 10, 3, 9, 0).toISOString(), agora)).toBe('03/11 09h00');
  });
});

describe('cliente das salas (respostas gravadas da API C#)', () => {
  it('monta as URLs do REST e do SignalR', () => {
    expect(urlMensagens(2)).toBe('http://10.0.2.2:5000/api/chat/salas/2/mensagens');
    expect(urlMensagens(2, 40, 20)).toBe('http://10.0.2.2:5000/api/chat/salas/2/mensagens?antesDe=40&limite=20');
    expect(urlHub()).toBe('http://10.0.2.2:5000/hubs/chat');
  });

  it('lê as regras e as quatro salas', async () => {
    prepararFetch({ '/api/chat/regras': [200, 'chat-regras.json'] });
    expect((await apiChat.regras()).some((r) => r.includes('18'))).toBe(true);
    prepararFetch({ '/api/chat/salas': [200, 'chat-salas.json'] });
    const salas = await apiChat.salas();
    expect(salas.map((s) => s.slug)).toEqual(['primeiro-emprego', 'transicao', 'familia', 'recem-chegades']);
    expect(salas.every((s) => s.aberta)).toBe(true);
  });

  it('entrar manda o aceite e o 18+ e recebe o token', async () => {
    const pedidas = prepararFetch({ '/api/chat/participantes': [201, 'chat-entrada.json'] });
    const e = await apiChat.entrar(' Lua ');
    expect(e).toMatchObject({ apelido: 'Lua', token: 'TOKEN-DE-TESTE-NAO-E-REAL' });
    expect(JSON.parse(String(pedidas[0].init!.body))).toEqual({ apelido: 'Lua', aceitoRegras: true, tenhoMaisDe18: true });
  });

  it('a API recusa menor de idade com mensagem clara', async () => {
    prepararFetch({ '/api/chat/participantes': [422, 'chat-entrada-menor-422.json'] });
    await expect(apiChat.entrar('Teen')).rejects.toMatchObject({ status: 422, message: expect.stringContaining('18') });
  });

  it('envia com o token no cabeçalho e só o texto no corpo', async () => {
    const pedidas = prepararFetch({ '/mensagens': [201, 'chat-mensagem-enviada.json'] });
    const enviada = await apiChat.enviar('tok', 2, '  Oi! Alguém já fez a retificação pela Defensoria?  ');
    expect(enviada.apelido).toBe('Lua');
    const init = pedidas[0].init!;
    expect((init.headers as Record<string, string>)[CABECALHO_TOKEN]).toBe('tok');
    expect(JSON.parse(String(init.body))).toEqual({ texto: 'Oi! Alguém já fez a retificação pela Defensoria?' });
  });

  it('telefone recusado (422) e sem token (401) chegam como erro de verdade', async () => {
    prepararFetch({ '/mensagens': [422, 'chat-mensagem-telefone-422.json'] });
    const e422 = await apiChat.enviar('tok', 2, 'x').catch((e) => e);
    expect(e422.status).toBe(422);
    expect(e422.indisponivel).toBe(false);
    prepararFetch({ '/mensagens': [401, 'chat-mensagem-sem-token-401.json'] });
    await expect(apiChat.enviar('', 2, 'oi')).rejects.toMatchObject({ status: 401 });
  });

  it('lê as mensagens da sala mandando o token de participante', async () => {
    const pedidas = prepararFetch({ '/mensagens': [200, 'chat-mensagens.json'] });
    const ms = await apiChat.mensagens('tok', 2);
    expect(ms.map((x) => x.texto)).toContain('Oi! Alguém já fez a retificação pela Defensoria?');
    expect((pedidas[0].init!.headers as Record<string, string>)[CABECALHO_TOKEN]).toBe('tok');
  });

  it('denúncia em 1 toque, sem corpo, devolve a contagem', async () => {
    const pedidas = prepararFetch({ '/denuncias': [202, 'chat-denuncia.json'] });
    expect(await apiChat.denunciar('tok', 5)).toEqual(JSON.parse(gravada('chat-denuncia.json')));
    expect(pedidas[0].init!.method).toBe('POST');
    expect(pedidas[0].init!.body).toBeUndefined();
  });
});
