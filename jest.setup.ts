// Os testes nunca usam a rede: qualquer fetch que um teste não preparou falha na hora.
// As respostas reais das APIs ficam gravadas em __tests__/respostas.
(globalThis as { fetch: unknown }).fetch = jest.fn(async (url: string) => {
  throw new Error(`Teste tentou acessar a rede: ${url}`);
});
