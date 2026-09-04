// Barrel export do módulo HR
export * from './api/hr.api';
export * from './api/salarios.api';
export * from './api/turnos.api';
export * from './api/contratos.api';
export * from './types';
export * from './components/GestaoDeTurnos';
export * from './components/ContratosDoColaborador';
export * from './components/Organograma';
// A página com os três separadores. As três anteriores continuam exportadas porque
// são o conteúdo de cada separador.
export * from './pages/RecursosHumanosPage';
export * from './pages/EmployeeListPage';
export * from './pages/ShiftManagementPage';
export * from './pages/SalariosPage';
