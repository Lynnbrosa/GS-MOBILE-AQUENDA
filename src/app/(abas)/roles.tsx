import { BuscaServicos, type OpcaoFiltro } from '@/componentes/BuscaServicos';

const OPCOES: OpcaoFiltro[] = [{ chave: 'todos', titulo: 'Todos os rolês', categoria: 'Role' }];

export default function Roles() {
  return (
    <BuscaServicos
      titulo="Rolês"
      apoio="Bares, baladas e espaços LGBT+ da curadoria do grupo. Confira se abre hoje antes de sair. Se um lugar fechou, avise pelo detalhe."
      opcoes={OPCOES}
      permitidas={['Role']}
      textoBusca="Buscar rolê ou bairro"
    />
  );
}
