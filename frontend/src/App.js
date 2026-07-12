import { useState } from "react";
import { BrowserRouter, Routes, Route, useLocation } from "react-router-dom";
import Sidebar from "./components/Sidebar";
import Topbar from "./components/Topbar";
import ProtectedRoute from "./ProtectedRoute";
import Login from "./pages/Login";
import Signup from "./pages/Signup";
import Landing from "./pages/Landing";
import Dashboard from "./pages/Dashboard";
import Vehicles from "./pages/Vehicles";
import Drivers from "./pages/Drivers";
import Trips from "./pages/Trips";
import Maintenance from "./pages/Maintenance";
import FuelExpenses from "./pages/FuelExpenses";
import Analytics from "./pages/Analytics";
import Settings from "./pages/Settings";
import { rolesForPage } from "./permissions";
import "./App.css";

function AppLayout({ children }) {
  const [mobileNavOpen, setMobileNavOpen] = useState(false);
  const location = useLocation();

  return (
    <div className="flex min-h-screen bg-paper-100 dark:bg-ink-950">
      <a
        href="#main-content"
        className="sr-only focus:not-sr-only focus:fixed focus:z-50 focus:top-3 focus:left-3 focus:rounded-md focus:bg-signal-300 focus:text-ink-950 focus:px-4 focus:py-2 focus:text-sm focus:font-semibold"
      >
        Skip to main content
      </a>
      <Sidebar mobileOpen={mobileNavOpen} onCloseMobile={() => setMobileNavOpen(false)} />
      <div className="flex-1 min-w-0 flex flex-col">
        <Topbar onOpenMobileNav={() => setMobileNavOpen(true)} />
        {/* Keying on pathname remounts this wrapper on every navigation, which
            restarts the fade/slide-up animation — a lightweight page
            transition without pulling in a routing-transition library. */}
        <main
          id="main-content"
          key={location.pathname}
          tabIndex={-1}
          className="flex-1 min-w-0 animate-page-in outline-none"
        >
          {children}
        </main>
      </div>
    </div>
  );
}

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Landing />} />
        <Route path="/login" element={<Login />} />
        <Route path="/signup" element={<Signup />} />

        <Route path="/dashboard" element={
          <ProtectedRoute allowedRoles={rolesForPage("dashboard")}>
            <AppLayout><Dashboard /></AppLayout>
          </ProtectedRoute>
        } />

        <Route path="/vehicles" element={
          <ProtectedRoute allowedRoles={rolesForPage("vehicles")}>
            <AppLayout><Vehicles /></AppLayout>
          </ProtectedRoute>
        } />

        <Route path="/drivers" element={
          <ProtectedRoute allowedRoles={rolesForPage("drivers")}>
            <AppLayout><Drivers /></AppLayout>
          </ProtectedRoute>
        } />

        <Route path="/trips" element={
          <ProtectedRoute allowedRoles={rolesForPage("trips")}>
            <AppLayout><Trips /></AppLayout>
          </ProtectedRoute>
        } />

        <Route path="/maintenance" element={
          <ProtectedRoute allowedRoles={rolesForPage("maintenance")}>
            <AppLayout><Maintenance /></AppLayout>
          </ProtectedRoute>
        } />

        <Route path="/fuel-expenses" element={
          <ProtectedRoute allowedRoles={rolesForPage("fuelExpenses")}>
            <AppLayout><FuelExpenses /></AppLayout>
          </ProtectedRoute>
        } />

        <Route path="/analytics" element={
          <ProtectedRoute allowedRoles={rolesForPage("analytics")}>
            <AppLayout><Analytics /></AppLayout>
          </ProtectedRoute>
        } />

        <Route path="/settings" element={
          <ProtectedRoute allowedRoles={rolesForPage("settings")}>
            <AppLayout><Settings /></AppLayout>
          </ProtectedRoute>
        } />

        <Route
          path="/unauthorized"
          element={
            <div className="min-h-screen flex items-center justify-center bg-paper-100 dark:bg-ink-950 text-ink-700 dark:text-ink-200 p-10 text-center">
              <div>
                <p className="font-display text-lg font-bold mb-1">Access restricted</p>
                <p className="text-sm text-ink-400">
                  Your role doesn't have permission to view this page.
                </p>
              </div>
            </div>
          }
        />
      </Routes>
    </BrowserRouter>
  );
}

export default App;