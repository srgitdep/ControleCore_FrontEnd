// Export API
export * from './api/dashboard.api';

// Export Hooks
export * from './hooks/useDashboard';

// Export Types
export * from './types';

// Export Pages & Components
export * from './pages/DashboardPage';
export * from './components/AdminDashboard';
export * from './components/SuperAdminDashboard';
// O KpiCard local foi substituído pelo de `shared/ui`, que unifica os oito estilos
// de cartão que existiam no sistema. Ver `shared/ui/Card.tsx`.
export * from './components/SalesChart';
