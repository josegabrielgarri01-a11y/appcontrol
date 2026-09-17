import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AppProvider, useApp } from '@/context/AppContext';
import { LicenseActivation } from '@/pages/LicenseActivation';
import { ChildMode } from '@/pages/ChildMode';
import { AdminDashboard } from '@/pages/AdminDashboard';
import { SuperAdminPanel } from '@/pages/SuperAdminPanel';

function ProtectedRoute({ role, children }: { role: 'child' | 'admin'; children: React.ReactNode }) {
  const { isActivated, role: currentRole } = useApp();
  if (!isActivated) return <Navigate to="/" replace />;
  if (currentRole !== role) return <Navigate to="/" replace />;
  return <>{children}</>;
}

function SuperAdminRoute({ children }: { children: React.ReactNode }) {
  const { isSuperAdmin } = useApp();
  if (!isSuperAdmin) return <Navigate to="/" replace />;
  return <>{children}</>;
}

function AppRoutes() {
  const { isActivated, role, isSuperAdmin } = useApp();

  return (
    <Routes>
      <Route
        path="/"
        element={
          isSuperAdmin ? (
            <Navigate to="/super-admin" replace />
          ) : isActivated && role ? (
            <Navigate to={`/${role}`} replace />
          ) : (
            <LicenseActivation />
          )
        }
      />
      <Route
        path="/child"
        element={
          <ProtectedRoute role="child">
            <ChildMode />
          </ProtectedRoute>
        }
      />
      <Route
        path="/admin"
        element={
          <ProtectedRoute role="admin">
            <AdminDashboard />
          </ProtectedRoute>
        }
      />
      <Route
        path="/super-admin"
        element={
          <SuperAdminRoute>
            <SuperAdminPanel />
          </SuperAdminRoute>
        }
      />
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}

function App() {
  return (
    <AppProvider>
      <BrowserRouter>
        <AppRoutes />
      </BrowserRouter>
    </AppProvider>
  );
}

export default App;
