import { apiCsharp } from '@/lib/api/csharp';
import { ErroApi } from '@/lib/api/http';
import { memoriaCache, obterComCache, SemDados } from '@/lib/cache';
import { configurarPadroes } from '@/lib/config';
import { prepararFetch, redeFora } from './ajuda';

const ONTEM = () => new Date('2026-11-05T21:00:00Z');
const HOJE = () => new Date('2026-11-06T13:00:00Z');

beforeEach(() => configurarPadroes({ env: {}, plataforma: 'android', ehEmulador: true }));

describe('obterComCache', () => {
  it('com rede: devolve o dado novo e guarda com a data', async () => {
    prepararFetch({ '/api/casas': [200, 'casas.json'] });
    const armazem = memoriaCache();
    const r = await obterComCache('casas', () => apiCsharp.casas(), armazem, HOJE);
    expect(r.tipo).toBe('rede');
    expect(armazem.mapa.get('casas')?.guardadoEm).toBe('2026-11-06T13:00:00.000Z');
  });

  it('API fora: mostra o último guardado e diz de quando é', async () => {
    const armazem = memoriaCache();
    prepararFetch({ '/api/casas': [200, 'casas.json'] });
    await obterComCache('casas', () => apiCsharp.casas(), armazem, ONTEM);

    redeFora();
    const r = await obterComCache('casas', () => apiCsharp.casas(), armazem, HOJE);
    expect(r.tipo).toBe('cache');
    if (r.tipo !== 'cache') return;
    expect(r.guardadoEm).toBe('2026-11-05T21:00:00.000Z');
    expect(r.dados[0].mensagem).toBe('3 vagas agora');
    expect(r.motivo).toMatch(/Não foi possível/);
  });

  it('API fora e nada guardado: erro que explica, nunca tela vazia', async () => {
    redeFora();
    const erro = await obterComCache('casas', () => apiCsharp.casas(), memoriaCache(), HOJE).catch((e) => e);
    expect(erro).toBeInstanceOf(SemDados);
    expect(erro.indisponivel).toBe(true);
  });

  it('servidor com erro 5xx também cai para o guardado', async () => {
    const armazem = memoriaCache();
    await armazem.gravar('x', JSON.stringify({ ok: 1 }), '2026-11-05T10:00:00.000Z');
    const r = await obterComCache('x', () => Promise.reject(new ErroApi('http', 'Erro interno', 503)), armazem, HOJE);
    expect(r).toMatchObject({ tipo: 'cache', dados: { ok: 1 } });
  });

  it('404 não usa versão velha: o recurso não existe mais', async () => {
    const armazem = memoriaCache();
    await armazem.gravar('servico:99999', JSON.stringify({ velho: true }), '2026-11-05T10:00:00.000Z');
    prepararFetch({ '/api/servicos/99999': [404, 'servico-404.json'] });
    const erro = await obterComCache('servico:99999', () => apiCsharp.servico(99999), armazem, HOJE).catch((e) => e);
    expect(erro).toBeInstanceOf(SemDados);
    expect(erro.indisponivel).toBe(false);
    expect(erro.motivo).toBe('Serviço 99999 não encontrado.');
  });

  it('cache corrompido conta como vazio', async () => {
    const armazem = memoriaCache();
    await armazem.gravar('y', '{quebrado', '2026-11-05T10:00:00.000Z');
    redeFora();
    await expect(obterComCache('y', () => apiCsharp.casas(), armazem, HOJE)).rejects.toBeInstanceOf(SemDados);
  });
});
