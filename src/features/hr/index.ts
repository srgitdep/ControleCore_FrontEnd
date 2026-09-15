// Barrel export do módulo HR
export * from './api/hr.api';
export * from './api/salarios.api';
export * from './api/contratos.api';
export * from './api/turnos.api';
export * from './types';
// A página com os separadores. As páginas de cada separador continuam exportadas
// porque são o conteúdo de cada um.
export * from './pages/RecursosHumanosPage';
export * from './pages/EmployeeListPage';
export * from './pages/ShiftManagementPage';
export * from './pages/SalariosPage';
export * from './pages/ContratosPage';
export * from './pages/TurnosPage';
