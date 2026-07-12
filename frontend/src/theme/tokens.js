/**
 * Plain hex values mirroring tailwind.config.js, for use anywhere Tailwind
 * classes don't reach (Chart.js datasets, canvas, inline SVG gradients).
 * Keep this in sync by hand — it's a small, deliberately flat list.
 */
export const tokens = {
  ink: {
    950: "#0B0E14",
    900: "#101520",
    800: "#191F29",
    700: "#262E3B",
    500: "#4A5361",
    300: "#9AA5B1",
    100: "#E6EAEE",
  },
  paper: {
    50: "#FCFCFD",
    100: "#F6F7F9",
  },
  signal: {
    300: "#F2A93B",
    400: "#E8940F",
  },
  transit: {
    300: "#33C8B7",
    400: "#1CA895",
  },
  success: {
    400: "#3FBE79",
  },
  alert: {
    400: "#EF5A5A",
  },
};

export default tokens;
