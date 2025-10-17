import { useRouter } from 'next/router';

function PaginaProduto() {
  const router = useRouter();
  const { id } = router.query;

  return (
    <div>
      <h1>Detalhes do Produto: {id}</h1>
    </div>
  );
}

export default PaginaProduto;