import { Navigate, Route, Routes, useLocation } from "react-router-dom";
import type { ReactElement } from "react";
import AppShell from "./components/AppShell";
import { useAuth } from "./state/AuthContext";
import { Spinner } from "./components/ui";
import Landing from "./pages/Landing";
import AuthPage from "./pages/Auth";
import Dashboard from "./pages/Dashboard";
import Transactions from "./pages/Transactions";
import Budgets from "./pages/Budgets";
import Goals from "./pages/Goals";
import Simulator from "./pages/Simulator";
import Insights from "./pages/Insights";
import HistoryPage from "./pages/History";
import Chat from "./pages/Chat";
import SettingsPage from "./pages/Settings";
import Admin from "./pages/Admin";
import NotFound from "./pages/NotFound";

function RequireAuth({ children, adminOnly = false }: { children: ReactElement; adminOnly?: boolean }) {
  const { user, loading } = useAuth();
  const location = useLocation();
  if (loading) {
    return (
      <div className="flex min-h-dvh items-center justify-center">
        <Spinner label="Loading…" />
      </div>
    );
  }
  if (!user) return <Navigate to="/signin" state={{ from: location.pathname }} replace />;
  if (adminOnly && user.role !== "admin") return <Navigate to="/app" replace />;
  return children;
}

export default function App() {
  return (
    <Routes>
      <Route path="/" element={<Landing />} />
      <Route path="/signin" element={<AuthPage mode="signin" />} />
      <Route path="/signup" element={<AuthPage mode="signup" />} />
      <Route
        path="/app"
        element={
          <RequireAuth>
            <AppShell />
          </RequireAuth>
        }
      >
        <Route index element={<Dashboard />} />
        <Route path="transactions" element={<Transactions />} />
        <Route path="budgets" element={<Budgets />} />
        <Route path="goals" element={<Goals />} />
        <Route path="simulator" element={<Simulator />} />
        <Route path="insights" element={<Insights />} />
        <Route path="history" element={<HistoryPage />} />
        <Route path="chat" element={<Chat />} />
        <Route path="settings" element={<SettingsPage />} />
        <Route
          path="admin"
          element={
            <RequireAuth adminOnly>
              <Admin />
            </RequireAuth>
          }
        />
      </Route>
      <Route path="*" element={<NotFound />} />
    </Routes>
  );
}
