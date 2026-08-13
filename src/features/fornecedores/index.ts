export * from './api/suppliers.api';

// A `FornecedoresPage` saiu: os fornecedores vivem agora no separador «Fornecedores»
// da secção Compras, que é onde importam — encomenda-se a um fornecedor, e a pergunta
// «a quem compro isto?» faz-se no contexto de uma compra.
//
// A rota `/fornecedores` mantém-se como redirecção, porque há ligações gravadas
// (favoritos, respostas antigas da Mayra) que apontam para lá.
export * from './components/FornecedoresTab';
export * from './components/FornecedorFormModal';
export * from './components/FornecedorDetailsModal';
