/**
 * TransitOps design tokens — "dispatch console" theme.
 *
 * Palette rationale:
 *  - ink   : graphite-navy dark surface (control-room, not pure black)
 *  - paper : cool light surface (not warm cream)
 *  - signal: dispatch amber — primary accent, used for calls-to-action & focus
 *  - transit: teal — "in motion" / active state accent (trips, on-route)
 *  - success/alert: semantic status colors, kept distinct from the two accents
 *    above so KPI/status badges never compete visually with primary actions.
 */
module.exports = {
  darkMode: "class",
  content: ["./src/**/*.{js,jsx,ts,tsx}"],
  theme: {
    extend: {
      colors: {
        ink: {
          50: "#F4F6F8",
          100: "#E6EAEE",
          200: "#C6CDD6",
          300: "#9AA5B1",
          400: "#6B7684",
          500: "#4A5361",
          600: "#374050",
          700: "#262E3B",
          800: "#191F29",
          900: "#101520",
          950: "#0B0E14",
        },
        paper: {
          50: "#FCFCFD",
          100: "#F6F7F9",
          200: "#EEF0F3",
        },
        signal: {
          50: "#FDF3E4",
          100: "#FAE3BC",
          200: "#F5CB88",
          300: "#F2A93B",
          400: "#E8940F",
          500: "#C97C0A",
          600: "#9C6108",
          700: "#6F4506",
        },
        transit: {
          50: "#E6FBF8",
          100: "#BFF4EC",
          200: "#7FE5D8",
          300: "#33C8B7",
          400: "#1CA895",
          500: "#158A7A",
          600: "#0F6A5E",
          700: "#0A4D44",
        },
        success: {
          400: "#3FBE79",
          500: "#2E9E62",
          600: "#237A4C",
        },
        alert: {
          50: "#FDECEC",
          400: "#EF5A5A",
          500: "#DC3B3B",
          600: "#B32C2C",
        },
        // Legacy alias so existing `bg-accent` usages keep working while
        // pages are migrated to the new palette in later phases.
        accent: "#F2A93B",
      },
      fontFamily: {
        sans: ["Manrope", "ui-sans-serif", "system-ui", "sans-serif"],
        display: ["Manrope", "ui-sans-serif", "system-ui", "sans-serif"],
        mono: ['"IBM Plex Mono"', "ui-monospace", "SFMono-Regular", "monospace"],
      },
      borderRadius: {
        sm: "6px",
        DEFAULT: "8px",
        md: "10px",
        lg: "14px",
        xl: "18px",
      },
      boxShadow: {
        xs: "0 1px 2px 0 rgba(11, 14, 20, 0.04)",
        card: "0 1px 3px 0 rgba(11, 14, 20, 0.06), 0 1px 2px -1px rgba(11, 14, 20, 0.06)",
        popover: "0 8px 24px -4px rgba(11, 14, 20, 0.16), 0 2px 8px -2px rgba(11, 14, 20, 0.08)",
        "glow-signal": "0 0 0 3px rgba(242, 169, 59, 0.18)",
        "glow-transit": "0 0 0 3px rgba(28, 168, 149, 0.18)",
      },
      transitionTimingFunction: {
        snappy: "cubic-bezier(0.2, 0.8, 0.2, 1)",
      },
    },
  },
  plugins: [],
};
