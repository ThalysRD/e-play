// pages/catalogo/produto/[id].js
import { useRouter } from 'next/router';

function PaginaProduto() {
  const router = useRouter();
  const { id } = router.query; // Pega o 'id' da URL

  return (
    <div>
      <h1>Detalhes do Produto: {id}</h1>
      {/* Lógica para buscar os dados do produto com base no id */}
    </div>
  );
}

export default PaginaProduto;