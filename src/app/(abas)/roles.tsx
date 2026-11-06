import { BuscaServicos, type OpcaoFiltro } from '@/componentes/BuscaServicos';

const OPCOES: OpcaoFiltro[] = [{ chave: 'todos', titulo: 'Todos', categoria: 'Role' }];

export default function Roles() {
  return <BuscaServicos secao="roles" titulo="Rolês" apoio="Bares, baladas e cultura." opcoes={OPCOES} permitidas={['Role']} textoBusca="Buscar rolê ou bairro" comMapa />;
}
