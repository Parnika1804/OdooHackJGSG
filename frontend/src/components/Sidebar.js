import { NavLink } from "react-router-dom";
import { canAccess } from "../permissions";

const navItems = [
  { label: "Dashboard", path: "/dashboard", permKey: "dashboard" },
  { label: "Fleet", path: "/vehicles", permKey: "vehicles" },
  { label: "Drivers", path: "/drivers", permKey: "drivers" },
  { label: "Trips", path: "/trips", permKey: "trips" },
  { label: "Maintenance", path: "/maintenance", permKey: "maintenance" },
  { label: "Fuel & Expenses", path: "/fuel-expenses", permKey: "fuelExpenses" },
  { label: "Analytics", path: "/analytics", permKey: "analytics" },
  { label: "Settings", path: "/settings", permKey: "settings" },
];

export default function Sidebar() {
  const role = localStorage.getItem("role");
  const visibleItems = navItems.filter((item) => canAccess(item.permKey, role));

  return (
    <div className="w-56 min-h-screen bg-neutral-100 dark:bg-neutral-950 text-gray-800 dark:text-neutral-200 py-5">
      <div className="font-bold text-lg px-5 pb-5">TransitOps</div>
      <nav>
        {visibleItems.map((item) => (
          <NavLink
            key={item.path}
            to={item.path}
            className={({ isActive }) =>
              `block px-5 py-2.5 text-sm ${
                isActive
                  ? "bg-accent text-black font-semibold"
                  : "hover:bg-neutral-200 dark:hover:bg-neutral-900"
              }`
            }
          >
            {item.label}
          </NavLink>
        ))}
      </nav>
    </div>
  );
}