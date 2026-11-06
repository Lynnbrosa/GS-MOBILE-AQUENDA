import {
  avisoDaConsulta,
  conteudoConsulta,
  conteudoLembrete,
  dataBrParaIso,
  isoParaBr,
  lerHorario,
  planoDeNotificacoes,
  proximaOcorrencia,
  proximasOcorrencias,
  textoFrequencia,
  validarConsulta,
  validarLembrete,
  type Consulta,
  type Lembrete,
} from '@/lib/agenda';

// sexta-feira, 6/11/2026, 10h00 (horário local)
const AGORA = new Date(2026, 10, 6, 10, 0);

function lembrete(extra: Partial<Lembrete> = {}): Lembrete {
  return {
    titulo: 'Meu hormônio',
    anotacao: '',
    frequencia: 'diaria',
    hora: 20,
    minuto: 0,
    diasSemana: [],
    intervaloDias: 14,
    inicio: '2026-11-01',
    ativo: true,
    ...extra,
  };
}

describe('validarLembrete', () => {
  it('aceita um lembrete diário completo', () => {
    expect(validarLembrete(lembrete())).toEqual([]);
  });

  it('explica cada problema em linguagem simples', () => {
    const erros = validarLembrete(lembrete({ titulo: '  ', hora: 24, minuto: 60, inicio: '2026-02-30' }));
    expect(erros).toEqual([
      'Dê um nome para o lembrete.',
      'A hora vai de 0 a 23.',
      'Os minutos vão de 0 a 59.',
      'A data de início não é válida.',
    ]);
  });

  it('semanal precisa de ao menos um dia', () => {
    expect(validarLembrete(lembrete({ frequencia: 'semanal', diasSemana: [] }))).toContain('Escolha pelo menos um dia da semana.');
  });

  it('intervalo vai de 2 a 90 dias', () => {
    expect(validarLembrete(lembrete({ frequencia: 'intervalo', intervaloDias: 1 }))).toContain('O intervalo vai de 2 a 90 dias.');
    expect(validarLembrete(lembrete({ frequencia: 'intervalo', intervaloDias: 91 }))).toContain('O intervalo vai de 2 a 90 dias.');
    expect(validarLembrete(lembrete({ frequencia: 'intervalo', intervaloDias: 21 }))).toEqual([]);
  });
});

describe('proximasOcorrencias', () => {
  it('diária: hoje se o horário ainda não passou, depois um por dia', () => {
    const datas = proximasOcorrencias(lembrete(), AGORA, 3);
    expect(datas.map((d) => d.toString())).toEqual([
      new Date(2026, 10, 6, 20, 0).toString(),
      new Date(2026, 10, 7, 20, 0).toString(),
      new Date(2026, 10, 8, 20, 0).toString(),
    ]);
  });

  it('diária: pula para amanhã quando o horário de hoje já passou', () => {
    const d = proximaOcorrencia(lembrete({ hora: 8 }), AGORA);
    expect(d).toEqual(new Date(2026, 10, 7, 8, 0));
  });

  it('semanal: só nos dias escolhidos (seg e qui)', () => {
    const datas = proximasOcorrencias(lembrete({ frequencia: 'semanal', diasSemana: [1, 4] }), AGORA, 3);
    expect(datas).toEqual([new Date(2026, 10, 9, 20, 0), new Date(2026, 10, 12, 20, 0), new Date(2026, 10, 16, 20, 0)]);
  });

  it('intervalo: conta a partir do dia da primeira aplicação', () => {
    // começou em 01/11, a cada 14 dias: 01/11, 15/11, 29/11
    const datas = proximasOcorrencias(lembrete({ frequencia: 'intervalo', intervaloDias: 14 }), AGORA, 2);
    expect(datas).toEqual([new Date(2026, 10, 15, 20, 0), new Date(2026, 10, 29, 20, 0)]);
  });

  it('não começa antes do início', () => {
    expect(proximaOcorrencia(lembrete({ inicio: '2026-11-20' }), AGORA)).toEqual(new Date(2026, 10, 20, 20, 0));
  });

  it('atravessa a virada do ano', () => {
    const datas = proximasOcorrencias(lembrete({ frequencia: 'intervalo', intervaloDias: 21, inicio: '2026-12-20' }), AGORA, 2);
    expect(datas).toEqual([new Date(2026, 11, 20, 20, 0), new Date(2027, 0, 10, 20, 0)]);
  });

  it('pausado ou inválido não tem próxima', () => {
    expect(proximaOcorrencia(lembrete({ ativo: false }), AGORA)).toBeNull();
    expect(proximaOcorrencia(lembrete({ titulo: '' }), AGORA)).toBeNull();
  });
});

describe('planoDeNotificacoes', () => {
  it('diária vira um gatilho diário no horário escolhido', () => {
    expect(planoDeNotificacoes(lembrete({ hora: 7, minuto: 30 }), AGORA)).toEqual([{ tipo: 'diaria', hora: 7, minuto: 30 }]);
  });

  it('semanal usa 1 = domingo, como o expo-notifications', () => {
    const plano = planoDeNotificacoes(lembrete({ frequencia: 'semanal', diasSemana: [0, 3] }), AGORA);
    expect(plano).toEqual([
      { tipo: 'semanal', diaSemana: 1, hora: 20, minuto: 0 },
      { tipo: 'semanal', diaSemana: 4, hora: 20, minuto: 0 },
    ]);
  });

  it('intervalo agenda datas soltas (8 de cada vez)', () => {
    const plano = planoDeNotificacoes(lembrete({ frequencia: 'intervalo', intervaloDias: 14 }), AGORA);
    expect(plano).toHaveLength(8);
    expect(plano[0]).toEqual({ tipo: 'data', data: new Date(2026, 10, 15, 20, 0) });
  });

  it('se começa no futuro, agenda datas para não tocar antes', () => {
    const plano = planoDeNotificacoes(lembrete({ inicio: '2026-12-01' }), AGORA);
    expect(plano.every((p) => p.tipo === 'data')).toBe(true);
    expect(plano[0]).toEqual({ tipo: 'data', data: new Date(2026, 11, 1, 20, 0) });
  });

  it('pausado não agenda nada', () => {
    expect(planoDeNotificacoes(lembrete({ ativo: false }), AGORA)).toEqual([]);
  });
});

describe('texto das notificações', () => {
  it('no modo discreto não aparece o nome do lembrete', () => {
    const c = conteudoLembrete({ titulo: 'Meu hormônio' }, true);
    expect(c.titulo).toBe('Lembrete');
    expect(`${c.titulo} ${c.corpo}`.toLowerCase()).not.toMatch(/horm/);
  });

  it('fora do modo discreto usa o nome que a pessoa deu e não sugere dose', () => {
    const c = conteudoLembrete({ titulo: ' Meu hormônio ' }, false);
    expect(c.titulo).toBe('Meu hormônio');
    expect(c.corpo).not.toMatch(/\d+\s*(mg|ml)/i);
  });

  it('consulta discreta não diz onde nem o quê', () => {
    const c = conteudoConsulta({ titulo: 'Endocrinologista', local: 'CR POP TT', dataHora: '2026-11-10T17:00:00Z' }, true);
    expect(c.titulo).toBe('Compromisso');
    expect(c.corpo).not.toMatch(/CR POP|Endocrino/);
  });
});

describe('consultas', () => {
  const base: Consulta = {
    titulo: 'Endocrinologista',
    local: 'UBS República',
    dataHora: new Date(2026, 10, 10, 14, 30).toISOString(),
    antecedenciaMin: 1440,
    anotacao: '',
  };

  it('avisa no horário pedido antes da consulta', () => {
    expect(avisoDaConsulta(base, AGORA)).toEqual(new Date(2026, 10, 9, 14, 30));
  });

  it('não agenda aviso que já passou nem quando a pessoa não quer aviso', () => {
    expect(avisoDaConsulta({ ...base, dataHora: new Date(2026, 10, 6, 12, 0).toISOString() }, AGORA)).toBeNull();
    expect(avisoDaConsulta({ ...base, antecedenciaMin: 0 }, AGORA)).toBeNull();
  });

  it('recusa data que já passou', () => {
    expect(validarConsulta({ ...base, dataHora: new Date(2026, 10, 1).toISOString() }, AGORA)).toEqual(['Essa data já passou.']);
    expect(validarConsulta(base, AGORA)).toEqual([]);
  });
});

describe('textos e datas digitadas', () => {
  it('descreve a frequência', () => {
    expect(textoFrequencia(lembrete())).toBe('Todo dia às 20h00');
    expect(textoFrequencia(lembrete({ frequencia: 'semanal', diasSemana: [4, 1] }))).toBe('Toda seg e qui às 20h00');
    expect(textoFrequencia(lembrete({ frequencia: 'semanal', diasSemana: [0, 1, 2, 3, 4, 5, 6] }))).toBe('Todo dia às 20h00');
    expect(textoFrequencia(lembrete({ frequencia: 'intervalo', intervaloDias: 21, hora: 9, minuto: 5 }))).toBe('A cada 21 dias às 09h05');
  });

  it('lê datas no formato brasileiro', () => {
    expect(dataBrParaIso('14/11/2026')).toBe('2026-11-14');
    expect(dataBrParaIso('1/2', AGORA)).toBe('2026-02-01');
    expect(dataBrParaIso('31/02/2026')).toBeNull();
    expect(dataBrParaIso('amanhã')).toBeNull();
    expect(isoParaBr('2026-11-14')).toBe('14/11/2026');
  });

  it('lê horários de vários jeitos', () => {
    expect(lerHorario('20:30')).toEqual({ hora: 20, minuto: 30 });
    expect(lerHorario('8h05')).toEqual({ hora: 8, minuto: 5 });
    expect(lerHorario('7')).toEqual({ hora: 7, minuto: 0 });
    expect(lerHorario('25:00')).toBeNull();
    expect(lerHorario('meio-dia')).toBeNull();
  });
});
