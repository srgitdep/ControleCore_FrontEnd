export * from './api/purchases.api';
export * from './pages/PurchasesPage';
export * from './components/RecebimentoModal';
// `RececoesModal` não estava exportado e só era alcançável por caminho relativo dentro
// da própria feature — o que impedia reutilizá-lo de fora.
export * from './components/RececoesModal';
export * from './components/SugestaoComprasModal';
export * from './components/CriarPedidoModal';
export * from './components/ConferenciaTresViasModal';
