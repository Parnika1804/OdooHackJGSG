import { NavLink } from "react-router-dom";

const navItems = [
  { label: "Dashboard", path: "/dashboard" },
  { label: "Fleet", path: "/vehicles" },
  { label: "Drivers", path: "/drivers" },
  { label: "Trips", path: "/trips" },
  { label: "Maintenance", path: "/maintenance" },
  { label: "Fuel & Expenses", path: "/fuel-expenses" },
  { label: "Analytics", path: "/analytics" },
  { label: "Settings", path: "/settings" },
];

export default function Sidebar() {
  return (
    <div className="w-56 min-h-screen bg-neutral-100 dark:bg-neutral-950 text-gray-800 dark:text-neutral-200 py-5">
      <div className="font-bold text-lg px-5 pb-5">TransitOps</div>
      <nav>
        {navItems.map((item) => (
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