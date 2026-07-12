import { NavLink } from "react-router-dom";
import "./Sidebar.css";

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
    <div className="sidebar">
      <div className="sidebar-logo">TransitOps</div>
      <nav>
        {navItems.map((item) => (
          <NavLink
            key={item.path}
            to={item.path}
            className={({ isActive }) => "sidebar-link" + (isActive ? " active" : "")}
          >
            {item.label}
          </NavLink>
        ))}
      </nav>
    </div>
  );
}