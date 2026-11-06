// Última barreira antes da rede (mesmas regras do motor de PII do GS-CYBER-AQUENDA).
import { apiChat } from '@/lib/api/chat';
import { configurarPadroes } from '@/lib/config';
import { cnsValido, cpfValido, oQueNaoPodeSair, verificarSaida } from '@/lib/saidaSegura';

beforeEach(() => configurarPadroes({ env: {}, plataforma: 'android', ehEmulador: true }));

describe('o que nunca sai do celular', () => {
  it.each([
    ['meu cpf é 529.982.247-25', 'cpf'],
    ['cpf ５２９.９８２.２４７-２５', 'cpf'],
    ['cpf 529.98​2.247-25', 'cpf'],
    ['cartão sus 123 4567 8901 0000', 'cns'],
    ['cartão 4111 1111 1111 1111', 'cartao'],
    ['senha: Lua2580!', 'senha'],
    ['sk-ant-api03-abcdefghijklmnopqrstuvwxyz', 'token'],
    ['tomo 2 mg de estradiol', 'saude'],
  ])('bloqueia %s', (texto, regra) => {
    expect(oQueNaoPodeSair(texto).map((b) => b.regra)).toContain(regra);
  });

  it.each([
    'comecei a hormonização pelo SUS',
    'alguém conhece a UBS República?',
    'protocolo 123.456.789-00',
    'tenho 23 anos e cheguei em 2025',
    'senha: ********',
  ])('deixa passar %s', (texto) => {
    expect(oQueNaoPodeSair(texto)).toEqual([]);
  });

  it('valida os documentos de verdade', () => {
    expect(cpfValido('52998224725')).toBe(true);
    expect(cpfValido('12345678900')).toBe(false);
    expect(cnsValido('123456789010000')).toBe(true);
  });

  it('confere URL decodificada e corpo', () => {
    expect(verificarSaida('http://x/api?texto=529.982.247-25')).toHaveLength(1);
    expect(verificarSaida('http://x/api?texto=529%2E982%2E247-25')).toHaveLength(1);
    expect(verificarSaida('http://x/api', { texto: 'senha: Lua2580!' })).toHaveLength(1);
    expect(verificarSaida('http://x/api', { texto: 'oi' })).toEqual([]);
  });

  it('a mensagem com CPF nem chega a sair: o fetch não é chamado', async () => {
    const fetchFalso = jest.fn();
    (globalThis as { fetch: unknown }).fetch = fetchFalso;
    await expect(apiChat.enviar('tok', 2, 'meu cpf 529.982.247-25')).rejects.toMatchObject({ tipo: 'bloqueado' });
    expect(fetchFalso).not.toHaveBeenCalled();
  });
});
