import {
  LayoutDashboard,
  Truck,
  IdCard,
  Route,
  Wrench,
  Fuel,
  BarChart3,
  Settings as SettingsIcon,
} from "lucide-react";

// Single source of truth for sidebar nav + breadcrumb labels + icons.
// Order here is also the order stops appear on the sidebar's route line.
export const navItems = [
  { label: "Dashboard", path: "/dashboard", permKey: "dashboard", icon: LayoutDashboard },
  { label: "Fleet", path: "/vehicles", permKey: "vehicles", icon: Truck },
  { label: "Drivers", path: "/drivers", permKey: "drivers", icon: IdCard },
  { label: "Trips", path: "/trips", permKey: "trips", icon: Route },
  { label: "Maintenance", path: "/maintenance", permKey: "maintenance", icon: Wrench },
  { label: "Fuel & Expenses", path: "/fuel-expenses", permKey: "fuelExpenses", icon: Fuel },
  { label: "Analytics", path: "/analytics", permKey: "analytics", icon: BarChart3 },
  { label: "Settings", path: "/settings", permKey: "settings", icon: SettingsIcon },
];

export function labelForPath(pathname) {
  return navItems.find((i) => i.path === pathname)?.label || "";
}
