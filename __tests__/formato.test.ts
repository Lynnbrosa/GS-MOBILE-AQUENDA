import {
  dataDaApi,
  distancia,
  distanciaFalada,
  haQuanto,
  linkMapa,
  linkSeguro,
  linkTelefone,
  nomeProprio,
  quandoFuturo,
  rotuloAtendimento,
  textoAberto,
} from '@/lib/formato';

const AGORA = new Date(2026, 10, 6, 15, 0);

describe('haQuanto (de quando é o dado guardado)', () => {
  it('fala em minutos, hoje, ontem ou data', () => {
    expect(haQuanto(new Date(2026, 10, 6, 14, 59, 40).toISOString(), AGORA)).toBe('agora há pouco');
    expect(haQuanto(new Date(2026, 10, 6, 14, 55).toISOString(), AGORA)).toBe('há 5 minutos');
    expect(haQuanto(new Date(2026, 10, 6, 9, 5).toISOString(), AGORA)).toBe('hoje às 09h05');
    expect(haQuanto(new Date(2026, 10, 5, 22, 0).toISOString(), AGORA)).toBe('ontem às 22h00');
    expect(haQuanto(new Date(2026, 10, 1, 18, 30).toISOString(), AGORA)).toBe('em 01/11 às 18h30');
    expect(haQuanto('não é data', AGORA)).toBe('em data desconhecida');
  });
});

describe('quandoFuturo', () => {
  it('fala do próximo lembrete do jeito que a gente fala', () => {
    expect(quandoFuturo(new Date(2026, 10, 6, 15, 20), AGORA)).toBe('em 20 minutos');
    expect(quandoFuturo(new Date(2026, 10, 6, 20, 0), AGORA)).toBe('hoje às 20h00');
    expect(quandoFuturo(new Date(2026, 10, 7, 8, 30), AGORA)).toBe('amanhã às 08h30');
    expect(quandoFuturo(new Date(2026, 10, 13, 9, 0), AGORA)).toBe('sex, 13/11 às 09h00');
  });
});

describe('distância', () => {
  it('metros abaixo de 1 km, vírgula decimal acima', () => {
    expect(distancia(0.347)).toBe('350 m');
    expect(distancia(1.25)).toBe('1,3 km');
    expect(distancia(null)).toBeNull();
    expect(distanciaFalada(2)).toBe('a 2,0 quilômetros');
  });
});

describe('links', () => {
  it('telefone vira tel: com o código do Brasil', () => {
    expect(linkTelefone('(11) 5087-9911')).toBe('tel:+551150879911');
    expect(linkTelefone('+55 11 5087-9911')).toBe('tel:+551150879911');
    expect(linkTelefone('123')).toBeNull();
  });

  it('mapa usa a coordenada quando existe', () => {
    expect(linkMapa('UBS', 'Rua X', -23.54, -46.64)).toBe('https://www.google.com/maps/search/?api=1&query=-23.54,-46.64');
    expect(linkMapa('UBS República', 'R. X, 1', null, null)).toContain(encodeURIComponent('UBS República, R. X, 1'));
  });

  it('só abre http(s)', () => {
    expect(linkSeguro('https://amepq.gupy.io/job/1')).toBe('https://amepq.gupy.io/job/1');
    expect(linkSeguro('javascript:alert(1)')).toBeNull();
    expect(linkSeguro(null)).toBeNull();
  });
});

describe('rótulos', () => {
  it('aberto, fechado ou "não sei"', () => {
    expect(textoAberto(true).texto).toBe('Aberto agora');
    expect(textoAberto(false).texto).toBe('Fechado agora');
    expect(textoAberto(null).texto).toBe('Horário a confirmar');
  });

  it('traduz os atendimentos da API', () => {
    expect(rotuloAtendimento('Hormonizacao')).toBe('Hormonização');
    expect(rotuloAtendimento('Retificacao')).toBe('Retificação de nome');
    expect(rotuloAtendimento('Novo')).toBe('Novo');
  });

  it('arruma os nomes em caixa alta do CNES', () => {
    expect(nomeProprio('CENTRO DE REFERENCIA E TREINAMENTO DST AIDS SAO PAULO')).toBe('Centro de Referencia e Treinamento DST AIDS Sao Paulo');
    expect(dataDaApi('2026-11-05')).toBe('05/11/2026');
  });
});
