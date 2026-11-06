import { previsaoDoDia } from '@/lib/clima';
import { definirUrlPersonalizada, ipDoMetro, urlBase, urlPadrao, configurarPadroes, urlValida } from '@/lib/config';
import { esperaAposErros, iguaisTempoConstante, textoEspera, validarPin } from '@/lib/pin';

describe('endereço das APIs', () => {
  it('a variável de ambiente ganha de tudo', () => {
    expect(urlPadrao('csharp', { env: { csharp: 'http://192.168.0.5:5000/' }, plataforma: 'android', ehEmulador: true })).toBe(
      'http://192.168.0.5:5000',
    );
  });

  it('no emulador Android usa 10.0.2.2', () => {
    expect(urlPadrao('soa', { env: {}, plataforma: 'android', ehEmulador: true, hostDoMetro: '192.168.0.5:8081' })).toBe(
      'http://10.0.2.2:8000',
    );
  });

  it('no celular físico usa o IP do computador que serve o Metro', () => {
    expect(urlPadrao('csharp', { env: {}, plataforma: 'android', ehEmulador: false, hostDoMetro: '192.168.0.5:8081' })).toBe(
      'http://192.168.0.5:5000',
    );
    expect(ipDoMetro('localhost:8081')).toBeNull();
  });

  it('o que a pessoa salva em Ajustes vale por cima do padrão', () => {
    configurarPadroes({ env: {}, plataforma: 'android', ehEmulador: true });
    definirUrlPersonalizada('soa', 'http://10.0.0.9:8000/');
    expect(urlBase('soa')).toBe('http://10.0.0.9:8000');
    definirUrlPersonalizada('soa', null);
    expect(urlBase('soa')).toBe('http://10.0.2.2:8000');
    expect(urlValida('ftp://x')).toBe(false);
  });
});

describe('PIN', () => {
  it('recusa PIN fácil de adivinhar', () => {
    expect(validarPin('12')).toMatch(/4 a 6/);
    expect(validarPin('1111')).toMatch(/repetir/);
    expect(validarPin('1234')).toMatch(/sequências/);
    expect(validarPin('4321')).toMatch(/sequências/);
    expect(validarPin('12a4')).toMatch(/números/);
    expect(validarPin('2580')).toBeNull();
  });

  it('espera cresce depois de 5 erros e tem teto', () => {
    expect(esperaAposErros(4)).toBe(0);
    expect(esperaAposErros(5)).toBe(30_000);
    expect(esperaAposErros(6)).toBe(60_000);
    expect(esperaAposErros(20)).toBe(15 * 60_000);
    expect(textoEspera(30_000)).toBe('Tente de novo em 30 segundos.');
    expect(textoEspera(60_000)).toBe('Tente de novo em 1 minuto.');
  });

  it('compara sem atalho', () => {
    expect(iguaisTempoConstante('abc', 'abc')).toBe(true);
    expect(iguaisTempoConstante('abc', 'abd')).toBe(false);
    expect(iguaisTempoConstante('abc', 'abcd')).toBe(false);
  });
});

describe('tela de clima', () => {
  it('é a mesma previsão para o mesmo dia e faz sentido', () => {
    const a = previsaoDoDia(new Date(2026, 10, 6), 10);
    const b = previsaoDoDia(new Date(2026, 10, 6), 10);
    expect(a).toEqual(b);
    expect(a.max).toBeGreaterThan(a.min);
    expect(a.horas).toHaveLength(5);
  });
});
