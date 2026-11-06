// Clientes das APIs contra respostas gravadas das APIs de verdade (06/11/2026).
import { apiCsharp, urlServicos } from '@/lib/api/csharp';
import { ErroApi, montarQuery } from '@/lib/api/http';
import { apiSoa, IBGE_SAO_PAULO, urlVagas } from '@/lib/api/soa';
import { configurarPadroes } from '@/lib/config';
import { prepararFetch, redeFora } from './ajuda';

beforeEach(() => {
  configurarPadroes({ env: {}, plataforma: 'android', ehEmulador: true });
});

describe('montarQuery', () => {
  it('pula vazios e repete listas', () => {
    expect(montarQuery({ a: 1, b: undefined, c: '', d: null, e: ['X', 'Y'], f: 'são paulo' })).toBe(
      '?a=1&e=X&e=Y&f=s%C3%A3o%20paulo',
    );
    expect(montarQuery({})).toBe('');
  });
});

describe('API C#', () => {
  it('monta a busca com categoria, texto, posição, raio e "aberto agora"', () => {
    const url = urlServicos({ categoria: 'Saude', atendimento: ['Hormonizacao'], texto: ' UBS ', lat: -23.54312, lon: -46.64301, raioKm: 10, abertos: true });
    expect(url).toBe(
      'http://10.0.2.2:5000/api/servicos?categoria=Saude&atendimento=Hormonizacao&texto=UBS&lat=-23.5431&lon=-46.643&raioKm=10&abertos=true&tamanho=30',
    );
  });

  it('não manda raio sem posição (a API responderia 400)', () => {
    expect(urlServicos({ raioKm: 5 })).not.toContain('raioKm');
  });

  it('lê a página de serviços gravada', async () => {
    prepararFetch({ '/api/servicos': [200, 'servicos.json'] });
    const p = await apiCsharp.buscarServicos({});
    expect(p.total).toBe(10);
    const florescer = p.itens.find((s) => s.nome === 'Casa Florescer')!;
    expect(florescer.categoria).toBe('Acolhimento');
    expect(florescer.endereco.sigiloso).toBe(true);
    expect(florescer.endereco.logradouro).toBeNull();
  });

  it('lê o detalhe com horários e dados do tipo', async () => {
    prepararFetch({ '/api/servicos/10': [200, 'servico-10.json'] });
    const d = await apiCsharp.servico(10);
    expect(d.resumo.atendimentos).toContain('Hormonizacao');
    expect(d.saude).not.toBeNull();
    expect(d.horarios[0]).toMatchObject({ dia: 'segunda', abre: '08:00' });
  });

  it('lê "vagas agora" das casas (ESP32)', async () => {
    prepararFetch({ '/api/casas': [200, 'casas.json'] });
    const casas = await apiCsharp.casas();
    expect(casas[0]).toMatchObject({ casaId: 1, situacao: 'Disponivel', livres: 3, mensagem: '3 vagas agora' });
    expect(casas[1].situacao).toBe('SemLeitura');
  });

  it('lê as rodas', async () => {
    prepararFetch({ '/api/rodas': [200, 'rodas.json'] });
    const rodas = await apiCsharp.rodas({ presencial: true });
    expect(rodas[0].local?.nome).toContain('Brunna Valin');
  });

  it('conta a interação só com tipo e serviço (204 sem corpo)', async () => {
    const pedidas = prepararFetch({ '/api/metricas/interacoes': [204, ''] });
    await expect(apiCsharp.registrarInteracao('ComoChegar', 3)).resolves.toBeUndefined();
    expect(pedidas[0].init?.method).toBe('POST');
    expect(JSON.parse(String(pedidas[0].init?.body))).toEqual({ tipo: 'ComoChegar', servicoId: 3 });
  });

  it('transforma ProblemDetails em mensagem legível', async () => {
    prepararFetch({ '/api/servicos/99999': [404, 'servico-404.json'] });
    await expect(apiCsharp.servico(99999)).rejects.toMatchObject({ tipo: 'http', status: 404, message: 'Serviço 99999 não encontrado.' });
  });

  it('rede fora vira ErroApi "indisponível"', async () => {
    redeFora();
    const erro = await apiCsharp.casas().catch((e) => e);
    expect(erro).toBeInstanceOf(ErroApi);
    expect(erro.indisponivel).toBe(true);
  });
});

describe('FastAPI', () => {
  it('monta o filtro de vagas', () => {
    expect(urlVagas({ texto: 'enfermagem', cidade: 'São Paulo', afirmativa: true, modalidade: 'hibrido' })).toBe(
      'http://10.0.2.2:8000/api/vagas?texto=enfermagem&cidade=S%C3%A3o%20Paulo&afirmativa=true&modalidade=hibrido&tamanho=30',
    );
  });

  it('lê as vagas afirmativas gravadas e o motivo de cada uma', async () => {
    prepararFetch({ '/api/vagas': [200, 'vagas.json'] });
    const p = await apiSoa.vagas({ afirmativa: true });
    expect(p.total).toBeGreaterThan(1);
    expect(p.itens.every((v) => v.afirmativa)).toBe(true);
    expect(p.itens.every((v) => /^https?:\/\//.test(v.url_candidatura))).toBe(true);
    expect(p.itens.find((v) => v.origem === 'gupy')?.termo_afirmativo).toBeTruthy();
  });

  it('lê o detalhe da vaga com o aviso de candidatura no site de origem', async () => {
    prepararFetch({ '/api/vagas/17': [200, 'vaga-detalhe.json'] });
    const v = await apiSoa.vaga(17);
    expect(v.termo_afirmativo).toBe('pessoas transgenero');
    expect(v.aviso).toMatch(/site de origem/);
  });

  it('lê os estabelecimentos do processo transexualizador em SP', async () => {
    const pedidas = prepararFetch({ [`/api/municipios/${IBGE_SAO_PAULO}/estabelecimentos`]: [200, 'estabelecimentos-sp.json'] });
    const r = await apiSoa.estabelecimentos(IBGE_SAO_PAULO, '30.02');
    expect(pedidas[0].url).toContain('habilitacao=30.02');
    expect(r.itens.map((e) => e.codigo_cnes)).toContain(2078015);
    expect(r.itens.every((e) => e.habilitacoes.length > 0)).toBe(true);
  });

  it('lê um estabelecimento do CNES', async () => {
    prepararFetch({ '/api/cnes/estabelecimentos/2078015': [200, 'cnes-2078015.json'] });
    const e = await apiSoa.estabelecimento(2078015);
    expect(e.habilitacoes).toEqual(expect.arrayContaining(['30.01', '30.02', '30.03']));
    expect(JSON.stringify(e)).not.toContain('@'); // a API não repassa e-mail do CNES
  });

  it('404 da vaga chega como erro de verdade (não é "fora do ar")', async () => {
    prepararFetch({ '/api/vagas/999999': [404, 'vaga-404.json'] });
    const erro = await apiSoa.vaga(999999).catch((e) => e);
    expect(erro.status).toBe(404);
    expect(erro.indisponivel).toBe(false);
  });
});
