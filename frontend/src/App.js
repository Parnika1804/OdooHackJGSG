import { BrowserRouter, Routes, Route } from "react-router-dom";
import Sidebar from "./components/Sidebar";
import ProtectedRoute from "./ProtectedRoute";
import Login from "./pages/Login";
import Dashboard from "./pages/Dashboard";
import Vehicles from "./pages/Vehicles";
import Drivers from "./pages/Drivers";
import Trips from "./pages/Trips";
import Maintenance from "./pages/Maintenance";
import FuelExpenses from "./pages/FuelExpenses";
import Analytics from "./pages/Analytics";
import Settings from "./pages/Settings";
import "./App.css";

function AppLayout({ children }) {
  return (
    <div style={{ display: "flex" }}>
      <Sidebar />
      <div style={{ flex: 1 }}>{children}</div>
    </div>
  );
}

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Login />} />

        <Route path="/dashboard" element={
          <ProtectedRoute allowedRoles={["Fleet Manager", "Dispatcher", "Safety Officer", "Financial Analyst"]}>
            <AppLayout><Dashboard /></AppLayout>
          </ProtectedRoute>
        } />

        <Route path="/vehicles" element={
          <ProtectedRoute allowedRoles={["Fleet Manager"]}>
            <AppLayout><Vehicles /></AppLayout>
          </ProtectedRoute>
        } />

        <Route path="/drivers" element={
          <ProtectedRoute allowedRoles={["Fleet Manager", "Safety Officer"]}>
            <AppLayout><Drivers /></AppLayout>
          </ProtectedRoute>
        } />

        <Route path="/trips" element={
          <ProtectedRoute allowedRoles={["Fleet Manager", "Dispatcher"]}>
            <AppLayout><Trips /></AppLayout>
          </ProtectedRoute>
        } />

        <Route path="/maintenance" element={
          <ProtectedRoute allowedRoles={["Fleet Manager"]}>
            <AppLayout><Maintenance /></AppLayout>
          </ProtectedRoute>
        } />

        <Route path="/fuel-expenses" element={
          <ProtectedRoute allowedRoles={["Financial Analyst", "Fleet Manager"]}>
            <AppLayout><FuelExpenses /></AppLayout>
          </ProtectedRoute>
        } />

        <Route path="/analytics" element={
          <ProtectedRoute allowedRoles={["Financial Analyst"]}>
            <AppLayout><Analytics /></AppLayout>
          </ProtectedRoute>
        } />

        <Route path="/settings" element={
          <ProtectedRoute allowedRoles={["Fleet Manager"]}>
            <AppLayout><Settings /></AppLayout>
          </ProtectedRoute>
        } />

        <Route path="/unauthorized" element={<div style={{ padding: 40 }}>You don't have access to this page.</div>} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;